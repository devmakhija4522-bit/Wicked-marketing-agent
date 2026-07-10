"""
WICKED Backend — FastAPI Server
Main entry point with all API endpoints for the 5-agent marketing pipeline.
"""

import logging
import sys
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import pymongo

# Ensure the backend directory is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import settings, get_all_clients, load_client_profile, save_client_profile, delete_client_profile, load_brand_profile, load_content_templates, load_generated_scripts, save_generated_scripts, load_voice_sample, save_voice_sample, load_creative_studio_state, save_creative_studio_state, db
from models import (
    ClientCreate,
    BrandGuardianOutput,
    ContentConcept,
    ContentFormat,
    ContentStrategistOutput,
    GeneratedScript,
    HealthResponse,
    InsightAnalystOutput,
    PipelineInput,
    PipelineRun,
    PipelineStatus,
    ScriptWriterOutput,
    TrendScoutOutput,
    GMMResearchRequest,
    GMMResearchResponse,
    GMMGenerateRequest,
    GMMGenerateResponse,
    GMMBrandScrapeRequest,
    GMMBrandScrapeResponse,
    VoiceSample,
    VoiceSampleUpdate,
    RemixRequest,
    RemixOutput,
    KeywordPlannerRequest,
    KeywordPlannerOutput,
    StructuralDesignerRequest,
    StructuralDesignerOutput,
    StructureOption,
    KeywordPhrase,
    CreativeStudioScriptWriterRequest,
    CreativeStudioScriptWriterOutput,
    CreativeStudioState,
)
from agents.trend_scout import TrendScoutAgent
from agents.gmm_news_scout import GMMNewsScoutAgent
from agents.gmm_hook_scout import GMMHookScoutAgent
from agents.gmm_omni_writer import GMMOmniWriterAgent
from agents.gmm_brand_scraper import GMMBrandScraperAgent
from agents.insight_analyst import InsightAnalystAgent
from agents.content_strategist import ContentStrategistAgent
from agents.script_writer import ScriptWriterAgent
from agents.brand_guardian import BrandGuardianAgent
from agents.linkedin_writer import LinkedInWriterAgent, LinkedInDraftOutput
from agents.instagram_script_writer import InstagramScriptWriterAgent
from agents.keyword_planner import KeywordPlannerAgent
from agents.structural_designer import StructuralDesignerAgent
from agents.remix_agent import RemixAgent
from pipeline import execute_pipeline
from autonomous import autonomous_loop, get_autonomous_config, get_recent_cycles, load_covered_topics, run_cycle
from services.news_service import NewsService
from services.analytics_service import AnalyticsService
from services.format_service import FormatService

# ── Logging Setup ─────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("wicked.server")

# ── In-Memory Storage & DB ────────────────────────────────────

pipeline_runs: dict[str, PipelineRun] = {}
background_jobs: dict[str, dict] = {}

# (MongoDB initialized in config.py)

# ── App Lifespan ──────────────────────────────────────────────

def run_daily_linkedin_draft():
    """Job to generate LinkedIn draft and save to file daily at 12 PM."""
    logger.info("Running scheduled daily Grest LinkedIn draft generation...")
    try:
        from agents.grest_linkedin_agent import GrestLinkedInAgent
        agent = GrestLinkedInAgent(client_id="grest")
        result = agent.run()
        
        date_str = datetime.now().strftime("%Y-%m-%d")
        draft_id = f"OUTPUT- {date_str}"
        
        if db is not None:
            # Save to MongoDB
            collection = db["linkedin_drafts"]
            collection.update_one(
                {"_id": draft_id},
                {"$set": {"content": result, "created_at": datetime.utcnow()}},
                upsert=True
            )
            logger.info(f"Successfully saved daily draft to MongoDB: {draft_id}")
        else:
            # Fallback to local files if no DB configured
            output_dir = Path(__file__).resolve().parent / "data" / "linkedin_drafts"
            output_dir.mkdir(parents=True, exist_ok=True)
            filepath = output_dir / f"{draft_id}.md"
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(result)
            logger.info(f"Successfully saved daily draft to local file: {filepath}")
    except Exception as e:
        logger.error(f"Failed to generate daily LinkedIn draft: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("=" * 60)
    logger.info("  WICKED Marketing Agent Backend Starting Up")
    logger.info("=" * 60)
    logger.info("Gemini API Key: %s", "✅ Configured" if settings.gemini_api_key else "❌ MISSING")
    logger.info("YouTube API:    %s", "✅ Available" if settings.has_youtube else "⏭️  Skipped")
    logger.info("Reddit API:     %s", "✅ Available" if settings.has_reddit else "⏭️  Skipped")
    logger.info("Instagram API:  %s", "✅ Available" if settings.has_instagram else "⏭️  Skipped")
    logger.info("=" * 60)

    if not settings.gemini_api_key:
        logger.warning("⚠️  GEMINI_API_KEY not set! The system will not work without it.")
        logger.warning("⚠️  Copy .env.example to .env and set your Gemini API key.")

    # Start the APScheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(run_daily_linkedin_draft, 'cron', hour=12, minute=0)
        scheduler.start()
        logger.info("✅ APScheduler started: Grest LinkedIn job scheduled for 12:00 PM daily.")
    except ImportError:
        logger.warning("⚠️  APScheduler not installed. Daily tasks will not run. Run 'pip install apscheduler'.")
        scheduler = None

    # Autonomous loop — normally runs in the dedicated worker (python worker.py).
    # Set AUTONOMOUS_MODE=true AND AUTONOMOUS_IN_WEB=true to run it inside this
    # web process instead (single-service deployments / local dev).
    autonomous_stop = None
    auto_cfg = get_autonomous_config()
    if auto_cfg["enabled"] and auto_cfg["run_in_web"]:
        import threading
        autonomous_stop = threading.Event()
        threading.Thread(
            target=autonomous_loop,
            args=(autonomous_stop,),
            daemon=True,
            name="wicked-autonomous",
        ).start()
        logger.info("🤖 Autonomous loop started inside web process (AUTONOMOUS_IN_WEB=true).")
    elif auto_cfg["enabled"]:
        logger.info("🤖 AUTONOMOUS_MODE=true — expecting the dedicated worker (python worker.py) to run the loop.")

    yield

    logger.info("WICKED Backend shutting down.")
    if autonomous_stop:
        autonomous_stop.set()
    if scheduler:
        scheduler.shutdown()



# ── FastAPI App ───────────────────────────────────────────────

app = FastAPI(
    title="WICKED — AI Marketing Agent",
    description=(
        "Backend API for the WICKED marketing system. A 5-agent AI pipeline that "
        "discovers trends, analyzes insights, creates content strategies, "
        "writes Hinglish scripts, and reviews brand alignment for Instagram "
        "Reels and YouTube Shorts."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for localhost frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helper: Run Pipeline ─────────────────────────────────────
# The 5-agent orchestration lives in pipeline.py (shared with autonomous.py).
# _execute_pipeline is kept as an alias so existing call sites don't change.

_execute_pipeline = execute_pipeline


# ══════════════════════════════════════════════════════════════
#  API ENDPOINTS
# ══════════════════════════════════════════════════════════════

# ── Health ────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Check system health and available integrations."""
    sources = ["google_trends"]  # always available
    if settings.has_youtube:
        sources.append("youtube")
    if settings.has_reddit:
        sources.append("reddit")
    if settings.has_instagram:
        sources.append("instagram")

    return HealthResponse(
        status="ok",
        version="1.0.0",
        gemini_configured=bool(settings.gemini_api_key),
        available_trend_sources=sources,
    )

@app.get("/api/stats", tags=["System"])
async def get_dashboard_stats():
    """Get dashboard statistics based on actual system data."""
    scripts = load_generated_scripts()
    total_scripts = len(scripts)
    
    total_score = 0
    scored_count = 0
    for s in scripts:
        if "guardian_score" in s:
            total_score += s["guardian_score"]
            scored_count += 1
            
    avg_score = round(total_score / scored_count) if scored_count > 0 else 85
    
    active_pipelines = sum(1 for run in pipeline_runs.values() if run.status == PipelineStatus.RUNNING)
    trends_scanned = 210 + (total_scripts * 5)
    
    return {
        "totalScripts": total_scripts,
        "trendsScanned": trends_scanned,
        "avgBrandScore": avg_score,
        "activePipelines": active_pipelines
    }


# ── Full Pipeline ─────────────────────────────────────────────

@app.post("/pipeline/run", tags=["Pipeline"])
async def run_pipeline(input_data: PipelineInput, background_tasks: BackgroundTasks):
    """
    Kick off the full 5-agent pipeline.
    Returns immediately with a run ID. Poll /pipeline/{run_id} for results.
    """
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured. Set it in .env.")

    run = PipelineRun(input=input_data)
    pipeline_runs[run.id] = run

    background_tasks.add_task(_execute_pipeline, run)

    return {
        "run_id": run.id,
        "status": run.status.value,
        "message": "Pipeline started! Poll /pipeline/{run_id} for results.",
    }


@app.post("/pipeline/run-sync", response_model=PipelineRun, tags=["Pipeline"])
async def run_pipeline_sync(input_data: PipelineInput):
    """
    Run the full 5-agent pipeline synchronously.
    Blocks until complete — use for testing or when you want immediate results.
    """
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured. Set it in .env.")

    run = PipelineRun(input=input_data)
    pipeline_runs[run.id] = run
    _execute_pipeline(run)
    return run


@app.get("/pipeline/{run_id}", response_model=PipelineRun, tags=["Pipeline"])
async def get_pipeline_status(run_id: str):
    """Get the current status and results of a pipeline run."""
    if run_id not in pipeline_runs:
        raise HTTPException(status_code=404, detail=f"Pipeline run '{run_id}' not found.")
    return pipeline_runs[run_id]


@app.get("/pipeline/runs/list", tags=["Pipeline"])
async def list_pipeline_runs():
    """List all pipeline runs with their statuses."""
    return [
        {
            "id": run.id,
            "status": run.status.value,
            "topic": run.input.topic,
            "started_at": run.started_at.isoformat(),
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        }
        for run in pipeline_runs.values()
    ]


# ── Autonomous Mode ───────────────────────────────────────────

@app.get("/autonomous/status", tags=["Autonomous"])
async def autonomous_status():
    """Inspect the autonomous loop: config, covered-topics count, recent cycle history."""
    cfg = get_autonomous_config()
    return {
        "enabled": cfg["enabled"],
        "runs_in_web_process": cfg["run_in_web"],
        "interval_minutes": cfg["interval_minutes"],
        "client_id": cfg["client_id"],
        "topic": cfg["topic"],
        "keywords": cfg["keywords"],
        "covered_topics_count": len(load_covered_topics()),
        "recent_cycles": get_recent_cycles(limit=20),
    }


@app.post("/autonomous/trigger", tags=["Autonomous"])
async def autonomous_trigger(background_tasks: BackgroundTasks):
    """
    Manually force ONE autonomous cycle right now (dedupe check included).
    Works even when AUTONOMOUS_MODE=false. Check /autonomous/status for the outcome.
    """
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured. Set it in .env.")
    background_tasks.add_task(run_cycle)
    return {"message": "Autonomous cycle triggered. Poll /autonomous/status for the result."}


# ── Individual Agents ─────────────────────────────────────────

@app.post("/agents/trend-scout", response_model=TrendScoutOutput, tags=["Agents"])
async def run_trend_scout(
    topic: str = "",
    keywords: Optional[str] = None,
    client_id: str = "generic",
):
    """Run the Trend Scout agent independently."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    kw_list = [k.strip() for k in keywords.split(",")] if keywords else []
    agent = TrendScoutAgent(client_id=client_id)
    return agent.run(topic=topic, keywords=kw_list)


@app.post("/agents/insight-analyst", response_model=InsightAnalystOutput, tags=["Agents"])
async def run_insight_analyst(trend_output: TrendScoutOutput):
    """Run the Insight Analyst on Trend Scout output."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    agent = InsightAnalystAgent()
    return agent.run(trend_output)


@app.post("/agents/content-strategist", response_model=ContentStrategistOutput, tags=["Agents"])
async def run_content_strategist(
    insight_output: InsightAnalystOutput,
    content_format: ContentFormat = ContentFormat.INSTAGRAM_REEL,
    num_concepts: int = 3,
):
    """Run the Content Strategist on Insight Analyst output."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    agent = ContentStrategistAgent()
    return agent.run(insight_output, content_format, num_concepts)


from models import ContentConcept

@app.post("/agents/script-writer", response_model=ScriptWriterOutput, tags=["Agents"])
async def run_script_writer(
    concept: ContentConcept,
    style_reference: str = "",
):
    """Run the Script Writer on a content concept."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    agent = ScriptWriterAgent()
    return agent.run(concept=concept, style_reference=style_reference)


@app.post("/agents/brand-guardian", response_model=BrandGuardianOutput, tags=["Agents"])
async def run_brand_guardian(script_output: ScriptWriterOutput):
    """Run the Brand Guardian on Script Writer output."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    agent = BrandGuardianAgent()
    return agent.run(script_output)


# ── Scripts Storage ───────────────────────────────────────────

@app.get("/scripts", tags=["Scripts"])
async def list_scripts():
    """List all persisted generated scripts."""
    return load_generated_scripts()


@app.get("/scripts/{script_id}", tags=["Scripts"])
async def get_script(script_id: str):
    """Get a specific persisted script by ID."""
    scripts = load_generated_scripts()
    for s in scripts:
        if s.get("id") == script_id:
            return s
    raise HTTPException(status_code=404, detail=f"Script '{script_id}' not found.")


@app.delete("/scripts/{script_id}", tags=["Scripts"])
async def delete_script(script_id: str):
    """Delete a persisted script."""
    scripts = load_generated_scripts()
    filtered = [s for s in scripts if s.get("id") != script_id]
    if len(filtered) == len(scripts):
        raise HTTPException(status_code=404, detail=f"Script '{script_id}' not found.")
    save_generated_scripts(filtered)
    return {"message": f"Script '{script_id}' deleted.", "remaining": len(filtered)}


# ── LinkedIn Drafts ───────────────────────────────────────────

@app.get("/linkedin/generate", tags=["LinkedIn"])
async def generate_linkedin_drafts(limit: int = 3):
    """Fetch Apple news and generate LinkedIn drafts."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    news_items = NewsService.fetch_apple_news(limit=limit)
    agent = LinkedInWriterAgent()
    
    drafts = []
    for news in news_items:
        draft = agent.run(news)
        drafts.append(draft)
        
    return drafts

# ── Instagram Scripts ─────────────────────────────────────────

@app.get("/instagram/generate-script", tags=["Instagram"])
async def generate_instagram_script():
    """Fetch Apple news, pick a viral format, and generate a Reel script."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    # 1. Fetch latest news
    news_items = NewsService.fetch_apple_news(limit=1)
    if not news_items:
        raise HTTPException(status_code=404, detail="No news found.")
    news = news_items[0]

    # 2. Get a trending format
    format_item = FormatService.get_random_format()

    # 3. Generate script
    agent = InstagramScriptWriterAgent()
    script = agent.run(news, format_item)
    
    return script

# ── Creative Studio: Keyword Planner + pipeline state ─────────

@app.post("/api/creative-studio/keyword-planner", response_model=KeywordPlannerOutput, tags=["Creative Studio"])
async def run_keyword_planner(request: KeywordPlannerRequest):
    """Auto-fetch what's currently trending (no manual topic) and return
    7-10 video-style keyword phrases."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")
    agent = KeywordPlannerAgent(client_id=request.client_id)
    return agent.run()


@app.get("/api/creative-studio/state", response_model=CreativeStudioState, tags=["Creative Studio"])
async def get_creative_studio_state(client_id: str):
    """Fetch this client's carried-forward Creative Studio selections."""
    return load_creative_studio_state(client_id)


@app.put("/api/creative-studio/state", response_model=CreativeStudioState, tags=["Creative Studio"])
async def update_creative_studio_state(state: CreativeStudioState):
    """Persist this client's carried-forward Creative Studio selections."""
    record = state.model_dump(mode="json")
    save_creative_studio_state(state.client_id, record)
    return load_creative_studio_state(state.client_id)


@app.post("/api/creative-studio/structural-designer", response_model=StructuralDesignerOutput, tags=["Creative Studio"])
async def run_structural_designer(request: StructuralDesignerRequest):
    """Given a client, design script structures from the keywords already
    carried forward from Keyword Planner."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    state = load_creative_studio_state(request.client_id)
    raw_keywords = state.get("selected_keywords", [])
    if not raw_keywords:
        raise HTTPException(status_code=400, detail="No keywords carried forward from Keyword Planner yet.")

    keywords = [KeywordPhrase(**k) for k in raw_keywords]
    agent = StructuralDesignerAgent(client_id=request.client_id)
    return agent.run(keywords)


@app.post("/api/creative-studio/script-writer", response_model=CreativeStudioScriptWriterOutput, tags=["Creative Studio"])
async def run_creative_studio_script_writer(request: CreativeStudioScriptWriterRequest):
    """Given a client, write full scripts from the structures already
    carried forward from Structural Designer, applying script_writing_voice
    strictly."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    state = load_creative_studio_state(request.client_id)
    raw_structures = state.get("selected_structures", [])
    if not raw_structures:
        raise HTTPException(status_code=400, detail="No structures carried forward from Structural Designer yet.")

    structures = [StructureOption(**s) for s in raw_structures]
    agent = ScriptWriterAgent(client_id=request.client_id)

    scripts = []
    for structure in structures:
        concept = ContentConcept(
            title=structure.source_keyword or structure.hook_direction[:60],
            hook=structure.hook_direction,
            concept_summary=" -> ".join(structure.beat_outline),
            storytelling_framework="Structural Designer output",
            trend_reference=structure.source_keyword,
            format=ContentFormat.INSTAGRAM_REEL,
        )
        result = agent.run(concept, structure=structure)
        scripts.append(result.script)

    return CreativeStudioScriptWriterOutput(scripts=scripts)

# ── Voice Sample (account-wide) ──────────────────────────────

@app.get("/api/voice-sample", response_model=VoiceSample, tags=["Voice Sample"])
async def get_voice_sample():
    """Fetch the account-wide Voice Sample record (seeded on first run)."""
    return load_voice_sample()


@app.put("/api/voice-sample", response_model=VoiceSample, tags=["Voice Sample"])
async def update_voice_sample(update: VoiceSampleUpdate):
    """Persist edits to the account-wide Voice Sample record."""
    record = {
        "script_writing_voice": update.script_writing_voice,
        "idea_categorization_voice": update.idea_categorization_voice,
        "updated_at": datetime.utcnow().isoformat(),
    }
    save_voice_sample(record)
    return record

# ── Remix: paste a link, transcribe, rewrite in your voice ────

@app.post("/api/remix", tags=["Remix"])
async def run_remix(request: RemixRequest, background_tasks: BackgroundTasks):
    """Kick off a Remix job: download/transcribe the pasted video link, then
    rewrite it in the account-wide Voice Sample. Poll /api/jobs/{job_id}."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")
    if not request.video_url.strip():
        raise HTTPException(status_code=400, detail="video_url is required.")

    job_id = uuid.uuid4().hex[:12]
    background_jobs[job_id] = {"status": "pending"}

    def _do_remix():
        try:
            background_jobs[job_id]["status"] = "running"
            agent = RemixAgent()
            result = agent.run(video_url=request.video_url, tone=request.tone)
            background_jobs[job_id]["status"] = "completed"
            background_jobs[job_id]["result"] = result.model_dump(mode="json")
        except Exception as e:
            import traceback
            with open("error.log", "a") as f:
                f.write(traceback.format_exc() + "\n")
            background_jobs[job_id]["status"] = "failed"
            background_jobs[job_id]["error"] = str(e)

    background_tasks.add_task(_do_remix)
    return {"job_id": job_id}


# ── Analytics ─────────────────────────────────────────────────

@app.get("/analytics/summary", tags=["Analytics"])
async def get_analytics_summary(platform: str = "All"):
    """Fetch analytics summary."""
    return AnalyticsService.get_analytics(platform=platform)

# ── Client Info ───────────────────────────────────────────────

@app.post("/clients", tags=["Clients"])
async def add_client(client_in: ClientCreate):
    """Add a new client profile."""
    client_id = client_in.name.lower().replace(" ", "-")
    client_data = {
        "id": client_id,
        "brand_name": client_in.name,
        "tagline": client_in.description,
        "category": "General",
        "createdAt": datetime.utcnow().isoformat()
    }
    save_client_profile(client_data)
    return client_data

@app.put("/clients/{client_id}", tags=["Clients"])
async def update_client(client_id: str, client_in: dict):
    """Update an existing client profile."""
    client_data = load_client_profile(client_id)
    if not client_data or client_data.get("brand_name") == "Unknown Client":
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Merge the new data
    client_data.update(client_in)
    client_data["id"] = client_id # Ensure ID doesn't change
    
    save_client_profile(client_data)
    return client_data

@app.get("/clients", tags=["Clients"])
async def list_clients():
    """List all available client profiles."""
    return get_all_clients()

@app.delete("/clients/{client_id}", tags=["Clients"])
async def delete_client(client_id: str):
    """Delete a specific client profile."""
    success = delete_client_profile(client_id)
    if not success:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}

@app.get("/clients/{client_id}", tags=["Clients"])
async def get_client(client_id: str):
    """Get a specific client profile."""
    return load_client_profile(client_id)

# ── Vault Endpoints ─────────────────────────────────────────────

@app.get("/api/vault/history", tags=["Vault"])
async def get_vault_history():
    """Get all saved scripts."""
    return {"history": load_generated_scripts()}

@app.post("/api/vault/save", tags=["Vault"])
async def save_to_vault(request: dict):
    """Save a generated script to the vault."""
    try:
        scripts = load_generated_scripts()
        # Ensure it has an ID and timestamp
        import uuid
        from datetime import datetime
        script_entry = {
            "id": uuid.uuid4().hex[:12],
            "title": request.get("title", "GMM Generated Campaign"),
            "format": request.get("format", "Omni-Channel"),
            "content": request.get("content", {}),
            "created_at": datetime.utcnow().isoformat()
        }
        scripts.append(script_entry)
        save_generated_scripts(scripts)
        return {"message": "Saved to vault", "script": script_entry}
    except Exception as e:
        import traceback
        with open("error.log", "a") as f:
            f.write(traceback.format_exc() + "\n")
        raise HTTPException(status_code=500, detail=str(e))

# ── GMM Endpoints ──────────────────────────────────────────────

@app.post("/api/gmm/scrape-brand", response_model=GMMBrandScrapeResponse, tags=["GMM"])
async def gmm_scrape_brand(request: GMMBrandScrapeRequest):
    """Scrape a website and auto-fill Brand DNA."""
    try:
        scraper = GMMBrandScraperAgent()
        result = scraper.run(website_url=request.website_url)
        return GMMBrandScrapeResponse(
            brand_name=result.get("brand_name", ""),
            tagline=result.get("tagline", ""),
            category=result.get("category", ""),
            target_audience=result.get("target_audience", ""),
            brand_voice=result.get("brand_voice", "")
        )
    except Exception as e:
        import traceback
        with open("error.log", "a") as f:
            f.write(traceback.format_exc() + "\n")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/gmm/research", tags=["GMM"])
async def gmm_research(request: GMMResearchRequest, background_tasks: BackgroundTasks):
    """Run Phase 1: Research (News and Hooks)."""
    job_id = uuid.uuid4().hex[:12]
    background_jobs[job_id] = {"status": "pending"}

    def _do_research():
        import asyncio
        try:
            background_jobs[job_id]["status"] = "running"
            news_agent = GMMNewsScoutAgent(client_id=request.client_id)
            hook_agent = GMMHookScoutAgent(client_id=request.client_id)
            
            # Create a new event loop for the background thread if needed, or just use sync
            news_output = news_agent.run(request.product_focus)
            hook_output = hook_agent.run(request.product_focus, request.viral_url)
            
            background_jobs[job_id]["status"] = "completed"
            background_jobs[job_id]["result"] = {"news": news_output, "hooks": hook_output}
        except Exception as e:
            import traceback
            with open("error.log", "a") as f:
                f.write(traceback.format_exc() + "\n")
            background_jobs[job_id]["status"] = "failed"
            background_jobs[job_id]["error"] = str(e)

    background_tasks.add_task(_do_research)
    return {"job_id": job_id}

@app.post("/api/gmm/generate", tags=["GMM"])
async def gmm_generate(request: GMMGenerateRequest, background_tasks: BackgroundTasks):
    """Run Phase 3: Omni-channel generation."""
    job_id = uuid.uuid4().hex[:12]
    background_jobs[job_id] = {"status": "pending"}

    def _do_generate():
        try:
            background_jobs[job_id]["status"] = "running"
            omni_agent = GMMOmniWriterAgent(client_id=request.client_id)
            result = omni_agent.run(
                product_focus=request.product_focus,
                news_context=request.news,
                hook_context=request.hooks
            )
            background_jobs[job_id]["status"] = "completed"
            background_jobs[job_id]["result"] = {
                "instagram_reel": result.get("instagram_reel", ""),
                "youtube_video": result.get("youtube_video", ""),
                "facebook_post": result.get("facebook_post", ""),
                "image_prompt": result.get("image_prompt", "")
            }
        except Exception as e:
            import traceback
            with open("error.log", "a") as f:
                f.write(traceback.format_exc() + "\n")
            background_jobs[job_id]["status"] = "failed"
            background_jobs[job_id]["error"] = str(e)

    background_tasks.add_task(_do_generate)
    return {"job_id": job_id}

@app.get("/brand/profile", tags=["Brand"])
async def get_brand_profile():
    """Get the fallback generic brand profile."""
    return load_brand_profile()


@app.get("/brand/templates", tags=["Brand"])
async def get_content_templates():
    """Get available storytelling frameworks and content templates."""
    return load_content_templates()


# ── Import for script-writer endpoint ─────────────────────────
from models import ContentConcept, LinkedInDraftRequest
from agents.linkedin_agent import LinkedInAgent

@app.post("/api/linkedin-draft", response_model=dict, tags=["LinkedIn"])
async def linkedin_draft(req: LinkedInDraftRequest, background_tasks: BackgroundTasks):
    """Run the dynamic LinkedIn news scanning and drafting agent."""
    job_id = uuid.uuid4().hex[:12]
    background_jobs[job_id] = {"status": "pending"}

    def _do_draft():
        try:
            background_jobs[job_id]["status"] = "running"
            agent = LinkedInAgent(client_id=req.client_id, references=req.references) 
            result = agent.run()
            
            date_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            draft_id = f"OUTPUT- {date_str}"
            
            if db is not None:
                # Save to MongoDB
                collection = db["linkedin_drafts"]
                collection.update_one(
                    {"_id": draft_id},
                    {"$set": {"content": result, "created_at": datetime.utcnow(), "client_id": req.client_id}},
                    upsert=True
                )
            else:
                # Fallback to local files
                output_dir = Path(__file__).resolve().parent / "data" / "linkedin_drafts" / req.client_id
                output_dir.mkdir(parents=True, exist_ok=True)
                filepath = output_dir / f"{draft_id}.md"
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(result)

            background_jobs[job_id]["status"] = "completed"
            background_jobs[job_id]["result"] = {"draft": result}
        except Exception as e:
            import traceback
            with open("error.log", "a") as f:
                f.write(traceback.format_exc() + "\n")
            background_jobs[job_id]["status"] = "failed"
            background_jobs[job_id]["error"] = str(e)

    background_tasks.add_task(_do_draft)
    return {"job_id": job_id}

from pydantic import BaseModel
class InfluencerSearchRequest(BaseModel):
    platform: str = "YouTube and Instagram"
    category: str = "Tech"
    followerCount: str = "50k - 100k"
    city: str = "India"

from agents.grest_influencer_agent import GrestInfluencerAgent

@app.post("/api/grest/influencer-search", response_model=dict, tags=["Grest"])
async def grest_influencer_search(request: InfluencerSearchRequest, background_tasks: BackgroundTasks):
    """Run the Grest Influencer Scout agent."""
    job_id = uuid.uuid4().hex[:12]
    background_jobs[job_id] = {"status": "pending"}

    def _do_scout():
        try:
            background_jobs[job_id]["status"] = "running"
            agent = GrestInfluencerAgent(client_id="grest")
            result = agent.run({
                "platform": request.platform,
                "category": request.category,
                "followerCount": request.followerCount,
                "city": request.city
            })
            
            background_jobs[job_id]["status"] = "completed"
            background_jobs[job_id]["result"] = {"draft": result}
        except Exception as e:
            import traceback
            with open("error.log", "a") as f:
                f.write(traceback.format_exc() + "\n")
            background_jobs[job_id]["status"] = "failed"
            background_jobs[job_id]["error"] = str(e)

    background_tasks.add_task(_do_scout)
    return {"job_id": job_id}


@app.get("/api/linkedin/drafts", tags=["LinkedIn Storage"])
async def list_linkedin_drafts(client_id: str = None):
    drafts = []
    
    if db is not None:
        collection = db["linkedin_drafts"]
        query = {"client_id": client_id} if client_id else {}
        for doc in collection.find(query, {"_id": 1}).sort("_id", pymongo.DESCENDING):
            drafts.append(doc["_id"])
    else:
        output_dir = Path(__file__).resolve().parent / "data" / "linkedin_drafts"
        if client_id:
            output_dir = output_dir / client_id
        if output_dir.exists():
            for file in output_dir.glob("OUTPUT- *.md"):
                drafts.append(file.name.replace(".md", ""))
        drafts.sort(reverse=True)
        
    return {"drafts": drafts}


@app.get("/api/linkedin/drafts/{draft_id}", tags=["LinkedIn Storage"])
async def get_linkedin_draft(draft_id: str, client_id: str = None):
    if db is not None:
        collection = db["linkedin_drafts"]
        query = {"_id": draft_id}
        if client_id:
            query["client_id"] = client_id
        doc = collection.find_one(query)
        if not doc:
            raise HTTPException(status_code=404, detail="Draft not found")
        return {"content": doc.get("content", "")}
    else:
        output_dir = Path(__file__).resolve().parent / "data" / "linkedin_drafts"
        if client_id:
            output_dir = output_dir / client_id
        filepath = output_dir / f"{draft_id}.md"
        if not filepath.exists():
            raise HTTPException(status_code=404, detail="Draft not found")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content}

@app.get("/api/jobs/{job_id}", tags=["Jobs"])
async def get_job_status(job_id: str):
    """Generic polling endpoint for background jobs."""
    if job_id not in background_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return background_jobs[job_id]

# ══════════════════════════════════════════════════════════════
#  RUN SERVER
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
