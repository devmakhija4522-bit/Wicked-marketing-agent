# WICKED Autonomous Mode

The 5-agent pipeline (Trend Scout → Insight Analyst → Content Strategist →
Script Writer → Brand Guardian) can run on its own, on a loop, without manual
triggering. Manual mode (`POST /pipeline/run`) is unchanged and always available.

## How it works

Every cycle:

1. **Trend Scout** scans for content (topic/keywords from env vars below).
2. **"Should I run?" check** — trend titles are deduped against the
   covered-topics store (`data/covered_topics.json` locally, `covered_topics`
   collection in MongoDB). If nothing new was found, the cycle is **skipped**
   and no further Gemini calls are made.
3. If there are new trends, the remaining 4 agents run on those trends only.
4. On success the trends are marked covered; on failure they stay uncovered so
   the next cycle retries them.
5. The outcome (timestamp, decision, stage reached, summary, error) is written
   to `logs/pipeline_run.log`, the `autonomous_cycles` MongoDB collection, and
   `data/autonomous_state.json` — so you can audit what the agent did overnight.
6. The loop sleeps `LOOP_INTERVAL_MINUTES`, then repeats. A failed cycle is
   logged and never kills the loop.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `AUTONOMOUS_MODE` | `false` | Master kill switch for the loop. |
| `LOOP_INTERVAL_MINUTES` | `60` | Sleep between cycles. |
| `AUTONOMOUS_CLIENT_ID` | `generic` | Client brand profile used for cycles. |
| `AUTONOMOUS_TOPIC` | *(empty)* | Optional topic focus for Trend Scout. |
| `AUTONOMOUS_KEYWORDS` | *(empty)* | Optional comma-separated seed keywords. |
| `AUTONOMOUS_IN_WEB` | `false` | Run the loop inside the FastAPI process instead of a separate worker (see below). |

## Running it

### Local development

```bash
cd backend
# Option A — dedicated worker process (recommended, mirrors production):
#   set AUTONOMOUS_MODE=true in .env, then:
python worker.py

# Option B — inside the web server (one process for everything):
#   set AUTONOMOUS_MODE=true and AUTONOMOUS_IN_WEB=true in .env, then run
#   the server as usual:
python main.py
```

`.env` is re-read at the start of every cycle, so flipping `AUTONOMOUS_MODE`
locally takes effect without a restart.

### Railway (production)

The loop needs a **long-running worker**, not a serverless function, because it
holds the sleep/wake cycle in memory. Set it up as a second service:

1. In your Railway project, click **+ New → GitHub Repo** and pick this same repo.
2. On the new service, set **Settings → Deploy → Custom Start Command** to:
   `python worker.py`
   (root directory `backend`, same as the web service).
3. On the **worker service only**, set these variables:
   - `AUTONOMOUS_MODE=true`
   - `LOOP_INTERVAL_MINUTES=60` (or whatever cadence you want)
   - `AUTONOMOUS_CLIENT_ID=...`, `AUTONOMOUS_TOPIC=...`, `AUTONOMOUS_KEYWORDS=...`
   - plus the same `GEMINI_API_KEY` / `MONGODB_URI` / API keys the web service has.
4. Leave `AUTONOMOUS_MODE` unset (or `false`) on the web service, and keep
   `AUTONOMOUS_IN_WEB=false` everywhere in production — otherwise both services
   would run the loop and double your Gemini spend.

To kill the loop: set `AUTONOMOUS_MODE=false` on the worker service (Railway
redeploys it automatically) or pause the worker service entirely.

**MongoDB strongly recommended on Railway** — its filesystem is ephemeral, so
without `MONGODB_URI` the covered-topics store and cycle history reset on every
deploy (the log file too). With MongoDB, dedupe state survives restarts.

## Observability

- `GET /autonomous/status` — config, covered-topics count, last 20 cycle records.
- `POST /autonomous/trigger` — force one cycle immediately (dedupe still applies),
  even when `AUTONOMOUS_MODE=false`. Useful for testing.
- `logs/pipeline_run.log` — per-cycle audit log (also streamed to stdout, which
  Railway captures in its log viewer).
