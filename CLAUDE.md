# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Backend (`backend/`, FastAPI + Google Gemini, Python):
```bash
pip install -r requirements.txt
python main.py                    # runs uvicorn via __main__, reads HOST/PORT from .env
uvicorn main:app --reload --port 8000   # equivalent, with autoreload (typical local dev)
python worker.py                  # dedicated autonomous-loop process (see below) — needs AUTONOMOUS_MODE=true
```
There is no pytest suite — `test_models.py` and `test_gemini_search.py` are standalone debug scripts (no assertions, run directly with `python`) used to probe which Gemini model strings/features work, not part of any CI gate.

Frontend (`frontend/`, React 19 + Vite 8):
```bash
npm install
npm run dev        # vite dev server
npm run build       # production build
npm run lint         # oxlint
npm run preview      # preview a production build
```
Frontend talks to the backend at `import.meta.env.VITE_API_URL || 'http://localhost:8000'` (set `VITE_API_URL` for anything other than local backend).

Only `GEMINI_API_KEY` is required in `backend/.env` for the app to do anything useful; every other integration (MongoDB, YouTube, Reddit, RapidAPI/Instagram) is optional and the code checks `settings.has_*`/`db is not None` before using it, degrading gracefully.

## Architecture

**Two generations of the same idea coexist in this codebase**: an original generic 5-agent pipeline, and a newer "GMM" pipeline built for real client work. Don't assume one has replaced the other — both are live and both are reachable from the frontend.

### The original 5-agent pipeline (`pipeline.py`, `agents/{trend_scout,insight_analyst,content_strategist,script_writer,brand_guardian}.py`)
Strictly sequential: Trend Scout → Insight Analyst → Content Strategist → Script Writer → Brand Guardian, orchestrated by `execute_pipeline()` which mutates a `PipelineRun` in place. Shared by `POST /pipeline/run` (manual) and `autonomous.py` (self-looping mode, below) — the latter passes `precomputed_trend_output` to `execute_pipeline` so Trend Scout isn't run twice per cycle.

Trend Scout is a real multi-source aggregator (`services/trend_sources/`: Google Trends via `pytrends`, YouTube Data API, Reddit via `praw`, Instagram via RapidAPI), each source independently gated by credential availability and wrapped so a missing/failed source is skipped rather than fatal. It only falls back to asking Gemini directly for plausible trends if fewer than 3 real trends were found across all sources.

All other agents in this chain are pure Gemini calls through `BaseAgent.call_llm_json`/`call_llm`, which auto-inject a per-client brand-voice block (`BaseAgent.brand_context_summary`) into the system prompt. `LLMService.generate_json` has no real structured-output mode — it asks the model to "respond ONLY with valid JSON" and manually strips markdown fences before `json.loads`; on parse failure it returns `{"parse_error", "raw": ...}` (note the key is `raw`, some callers read a nonexistent `raw_text`).

### GMM / Grest (`agents/gmm_*.py`, `agents/grest_*.py`)
"GMM" = **Grest Marketing Manager** (see the comment header in `models.py`). It's a 3-phase omni-channel content engine — scrape brand (`gmm_brand_scraper`) → research news + viral hooks (`gmm_news_scout`, `gmm_hook_scout`) → generate final multi-platform copy (`gmm_omni_writer`) — parameterized by `client_id` so it isn't hardcoded to one brand, but the only real client currently onboarded is **Grest** (`grest.json`), a certified-refurbished-Apple-electronics e-commerce brand in India. Exposed via `/api/gmm/*` and driven by the frontend's `/gmm/:clientId` route (`GMMConsole.jsx`).

Grest also has its own dedicated agents (`grest_influencer_agent` for influencer discovery with prompt-level fake-follower heuristics, `grest_linkedin_agent` for a founder-voice LinkedIn draft run daily via APScheduler at noon — hardcoded to `client_id="grest"` in `main.py`'s `lifespan()`).

Several of these agents bypass `BaseAgent.call_llm`/`call_llm_json` and call `self.llm.generate`/`generate_json` directly — that's because they need `use_search=True` (live Google Search grounding), which the `BaseAgent` helpers don't expose as a parameter.

### Client profiles & persistence (`config.py`)
Every piece of persisted state (client profiles, generated scripts, LinkedIn drafts, covered-topics/autonomous state) follows the same dual-write pattern: **write to local JSON under `backend/data/` AND to MongoDB when `MONGODB_URI` is set**, read preferring MongoDB, falling back to local files. This is deliberate — MongoDB is optional for local dev, but Railway's filesystem is ephemeral, so MongoDB is what makes state survive a redeploy in production. `load_client_profile(client_id)` does a direct lookup (single file / `find_one`), not a scan of all clients — if you see code scanning `get_all_clients()` just to pick one by id, that's the pattern being reintroduced by mistake.

### Autonomous mode (`autonomous.py`, `worker.py`, `AUTONOMOUS.md`)
A self-looping runner for the 5-agent pipeline, entirely env-var controlled (`AUTONOMOUS_MODE`, `LOOP_INTERVAL_MINUTES`, `AUTONOMOUS_CLIENT_ID`, `AUTONOMOUS_TOPIC`, `AUTONOMOUS_KEYWORDS`). Each cycle scouts trends, dedupes titles against a covered-topics store (local file + Mongo) to avoid re-covering the same ground and to skip Gemini calls entirely when nothing is new, then runs the rest of the pipeline only on new trends. Designed to run as a **separate long-running worker process** (`python worker.py`, a second Railway service) rather than inside the request-serving web process — `AUTONOMOUS_IN_WEB=true` is an escape hatch for single-service/local setups that runs it on a background thread inside `main.py`'s `lifespan()` instead. Read `AUTONOMOUS.md` before touching this — it documents the Railway two-service deployment shape in detail.

### `main.py` — API surface
One large FastAPI file (~800 lines) with routes grouped by tag: System/Pipeline/Autonomous/Agents/Scripts/LinkedIn/"LinkedIn Storage"/Instagram/Analytics/Clients/Vault/GMM/Brand/Grest/Jobs. Background-job-style endpoints (GMM research/generate, LinkedIn draft, Grest influencer search) all follow the same hand-rolled pattern: kick off a `BackgroundTasks` job, store status in an in-memory `background_jobs` dict, poll via `GET /api/jobs/{job_id}` — there's no queue or persistence for these, so job status resets on restart. Expect some overlap/duplication between generations of features (e.g. `/linkedin/generate` vs `/api/linkedin-draft`, or `/scripts` vs `/api/vault/*`) — check which one the frontend (`frontend/src/utils/api.js`) actually calls before assuming an endpoint is current.

### Frontend (`frontend/src/`)
React Router SPA, one page per route under a persistent `Sidebar`, brand/client selection managed by `ClientContext` (a client must be selected before client-scoped nav items like Trends appear). All backend calls go through the single `apiRequest` wrapper in `utils/api.js` — grep there first when tracing what a page actually does, rather than the page component itself. Note that `api.js` calls a handful of endpoints (`/api/full-pipeline`, `/api/analyze-trends`, `/api/style-profile`, `/api/settings`, etc.) that do not exist anywhere in `main.py` — treat pages depending on those (`ContentLab`, `StyleProfile`, `Settings`) as not actually wired up end-to-end.
