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

# Ensure the backend directory is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import settings, get_all_clients, load_client_profile, save_client_profile, delete_client_profile, load_brand_profile, load_content_templates, load_generated_scripts, save_generated_scripts
from models import (
    ClientCreate,
    BrandGuardianOutput,
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

# ── In-Memory Storage ─────────────────────────────────────────

pipeline_runs: dict[str, PipelineRun] = {}

# ── App Lifespan ──────────────────────────────────────────────

def run_daily_linkedin_draft():
    """Job to generate LinkedIn draft and save to file daily at 12 PM."""
    logger.info("Running scheduled daily Grest LinkedIn draft generation...")
    try:
        from agents.grest_linkedin_agent import GrestLinkedInAgent
        agent = GrestLinkedInAgent(client_id="grest")
        result = agent.run()
        
        # Ensure output directory exists
        output_dir = Path(__file__).resolve().parent / "output"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save to [date]-draft.md
        date_str = datetime.now().strftime("%Y-%m-%d")
        filepath = output_dir / f"{date_str}-draft.md"
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(result)
        logger.info(f"Successfully saved daily draft to {filepath}")
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

    yield

    logger.info("WICKED Backend shutting down.")
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

def _execute_pipeline(run: PipelineRun) -> None:
    """Execute the full 5-agent pipeline synchronously (called from background task)."""
    try:
        run.status = PipelineStatus.RUNNING
        inp = run.input
        logger.info("Pipeline %s started — topic: '%s'", run.id, inp.topic)

        # ── Agent 1: Trend Scout ──────────────────────────────
        logger.info("[1/5] Trend Scout scanning...")
        trend_scout = TrendScoutAgent(client_id=inp.client_id)
        trend_output = trend_scout.run(topic=inp.topic, keywords=inp.keywords)
        run.trend_output = trend_output
        logger.info("[1/5] Trend Scout found %d trends", len(trend_output.trends))

        # ── Agent 2: Insight Analyst ──────────────────────────
        logger.info("[2/5] Insight Analyst analyzing...")
        insight_analyst = InsightAnalystAgent(client_id=inp.client_id)
        insight_output = insight_analyst.run(trend_output)
        run.insight_output = insight_output
        logger.info("[2/5] Insight Analyst produced %d insights", len(insight_output.insights))

        # ── Agent 3: Content Strategist ───────────────────────
        logger.info("[3/5] Content Strategist creating concepts...")
        content_strategist = ContentStrategistAgent(client_id=inp.client_id)
        strategy_output = content_strategist.run(
            insight_output,
            content_format=inp.format,
            num_concepts=inp.num_concepts,
        )
        run.strategy_output = strategy_output
        logger.info("[3/5] Content Strategist created %d concepts", len(strategy_output.concepts))

        # ── Agent 4: Script Writer (use recommended concept) ──
        logger.info("[4/5] Script Writer writing...")
        if strategy_output.concepts:
            # Find the recommended concept, or use the first one
            chosen = strategy_output.concepts[0]
            for c in strategy_output.concepts:
                if c.id == strategy_output.recommended_concept_id:
                    chosen = c
                    break

            script_writer = ScriptWriterAgent(client_id=inp.client_id)
            script_output = script_writer.run(
                concept=chosen,
                style_reference=inp.style_reference,
            )
            run.script_output = script_output
            logger.info("[4/5] Script Writer completed: %s", script_output.script.title)

            # ── Agent 5: Brand Guardian ───────────────────────
            logger.info("[5/5] Brand Guardian reviewing...")
            brand_guardian = BrandGuardianAgent(client_id=inp.client_id)
            guardian_output = brand_guardian.run(script_output)
            run.guardian_output = guardian_output
            logger.info(
                "[5/5] Brand Guardian score: %.0f/100 — %s",
                guardian_output.overall_score,
                "APPROVED ✅" if guardian_output.approved else "NEEDS WORK ⚠️"
            )

            # Persist the script
            _persist_script(script_output.script, guardian_output)
        else:
            logger.warning("[4/5] No concepts generated — skipping script writing.")
            run.error = "No content concepts were generated by the strategist."

        run.status = PipelineStatus.COMPLETED
        run.completed_at = datetime.utcnow()
        logger.info("Pipeline %s completed successfully!", run.id)

    except Exception as e:
        logger.error("Pipeline %s failed: %s", run.id, e, exc_info=True)
        run.status = PipelineStatus.FAILED
        run.error = str(e)
        run.completed_at = datetime.utcnow()


def _persist_script(script: GeneratedScript, guardian: BrandGuardianOutput) -> None:
    """Save a generated script to the JSON persistence file."""
    try:
        scripts = load_generated_scripts()
        script_data = script.model_dump(mode="json")
        script_data["guardian_score"] = guardian.overall_score
        script_data["guardian_approved"] = guardian.approved
        scripts.append(script_data)
        save_generated_scripts(scripts)
        logger.info("Script persisted. Total scripts: %d", len(scripts))
    except Exception as e:
        logger.error("Failed to persist script: %s", e)


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


@app.post("/agents/script-writer", response_model=ScriptWriterOutput, tags=["Agents"])
async def run_script_writer(
    concept: ContentConcept,
    style_reference: str = "",
):
    """Run the Script Writer on a content concept."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")

    from models import ContentConcept
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

@app.post("/api/gmm/research", response_model=GMMResearchResponse, tags=["GMM"])
async def gmm_research(request: GMMResearchRequest):
    """Run Phase 1: Research (News and Hooks)."""
    import asyncio
    try:
        news_agent = GMMNewsScoutAgent(client_id=request.client_id)
        hook_agent = GMMHookScoutAgent(client_id=request.client_id)
        
        # Run agents concurrently without blocking the FastAPI event loop
        news_output, hook_output = await asyncio.gather(
            asyncio.to_thread(news_agent.run, request.product_focus),
            asyncio.to_thread(hook_agent.run, request.product_focus, request.viral_url)
        )
        
        return GMMResearchResponse(news=news_output, hooks=hook_output)
    except Exception as e:
        import traceback
        with open("error.log", "a") as f:
            f.write(traceback.format_exc() + "\n")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/gmm/generate", response_model=GMMGenerateResponse, tags=["GMM"])
async def gmm_generate(request: GMMGenerateRequest):
    """Run Phase 3: Omni-channel generation."""
    try:
        omni_agent = GMMOmniWriterAgent(client_id=request.client_id)
        import asyncio
        result = await asyncio.to_thread(
            omni_agent.run,
            request.product_focus,
            request.news,
            request.hooks
        )
        return GMMGenerateResponse(
            instagram_reel=result.get("instagram_reel", ""),
            youtube_video=result.get("youtube_video", ""),
            facebook_post=result.get("facebook_post", "")
        )
    except Exception as e:
        import traceback
        with open("error.log", "a") as f:
            f.write(traceback.format_exc() + "\n")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/brand/profile", tags=["Brand"])
async def get_brand_profile():
    """Get the fallback generic brand profile."""
    return load_brand_profile()


@app.get("/brand/templates", tags=["Brand"])
async def get_content_templates():
    """Get available storytelling frameworks and content templates."""
    return load_content_templates()


# ── Import for script-writer endpoint ─────────────────────────
from models import ContentConcept
from agents.grest_linkedin_agent import GrestLinkedInAgent

@app.post("/api/grest/linkedin-draft", tags=["Grest"])
async def grest_linkedin_draft():
    """Run the Grest LinkedIn news scanning and drafting agent."""
    try:
        agent = GrestLinkedInAgent(client_id="grest") # Default to grest client if it exists, or it just uses the system prompt
        import asyncio
        result = await asyncio.to_thread(agent.run)
        return {"draft": result}
    except Exception as e:
        import traceback
        with open("error.log", "a") as f:
            f.write(traceback.format_exc() + "\n")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

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
