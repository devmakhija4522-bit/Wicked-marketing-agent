"""
WICKED Backend — FastAPI Server
Main entry point for client account management and the account-wide
Voice Sample backend.
"""

import logging
import sys
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

# Ensure the backend directory is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import settings, get_all_clients, load_client_profile, save_client_profile, delete_client_profile, load_brand_profile, load_content_templates, load_voice_sample, save_voice_sample
from models import (
    ClientCreate,
    HealthResponse,
    VoiceSample,
    VoiceSampleUpdate,
    ReferenceProfileAnalyzeRequest,
    ReferenceProfileApproveRequest,
)
from agents.instagram_script_writer import InstagramScriptWriterAgent
from agents.reference_analyzer import ReferenceAnalyzerAgent
from services.voice_categories import categories_for_api
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

background_jobs: dict[str, dict] = {}

# (MongoDB initialized in config.py)

# ── App Lifespan ──────────────────────────────────────────────

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
    logger.info("API Key Auth:   %s", "✅ Enforced" if settings.api_key else "⏭️  Disabled (no API_KEY set)")
    logger.info("Allowed Origins: %s", settings.allowed_origins)
    logger.info("=" * 60)

    if not settings.gemini_api_key:
        logger.warning("⚠️  GEMINI_API_KEY not set! The system will not work without it.")
        logger.warning("⚠️  Copy .env.example to .env and set your Gemini API key.")

    yield

    logger.info("WICKED Backend shutting down.")


# ── FastAPI App ───────────────────────────────────────────────

app = FastAPI(
    title="WICKED — AI Marketing Agent",
    description="Backend API for the WICKED marketing system: client account management and the account-wide Voice Sample backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Rate limiting (in-memory — no Redis needed at this scale) ─
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── API-key auth gate ──────────────────────────────────────────
# Inert unless API_KEY is set (config.py) — see the plan/README note: this
# ships disabled by default so an unconfigured deployment isn't locked out.
_AUTH_EXEMPT_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/docs/oauth2-redirect"}

@app.middleware("http")
async def api_key_auth(request: Request, call_next):
    if not settings.api_key:
        return await call_next(request)
    if request.method == "OPTIONS" or request.url.path in _AUTH_EXEMPT_PATHS:
        return await call_next(request)
    if request.headers.get("X-API-Key") != settings.api_key:
        return JSONResponse(status_code=401, content={"detail": "Invalid or missing API key."})
    return await call_next(request)

app.add_middleware(SlowAPIMiddleware)

# CORS — outermost middleware so preflight (OPTIONS) requests are always
# answered correctly regardless of the auth/rate-limit layers above.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════
#  API ENDPOINTS
# ══════════════════════════════════════════════════════════════

# ── Health ────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Check system health and available integrations."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        gemini_configured=bool(settings.gemini_api_key),
    )

@app.get("/api/stats", tags=["System"])
async def get_dashboard_stats():
    """Get dashboard statistics. Placeholder zeros — the original pipeline/
    trend-scanning/vault features that used to back these numbers have been
    removed."""
    return {
        "totalScripts": 0,
        "trendsScanned": 0,
        "avgBrandScore": 0,
        "activePipelines": 0,
    }


# ── Instagram Scripts ─────────────────────────────────────────

@app.get("/instagram/generate-script", tags=["Instagram"])
@limiter.limit("10/minute")
async def generate_instagram_script(request: Request):
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

# ── Voice Sample (account-wide) ──────────────────────────────

@app.get("/api/voice-categories", tags=["Voice Sample"])
async def get_voice_categories():
    """The 3 required categories (Satire/EAAS, Emotional/RWIT,
    Infographic/WAAAAS) — label/concept name/description only, the same
    source of truth the agents' prompts are built from."""
    return categories_for_api()


@app.get("/api/voice-sample", response_model=VoiceSample, tags=["Voice Sample"])
async def get_voice_sample():
    """Fetch the account-wide Voice Sample record (seeded on first run)."""
    return load_voice_sample()


@app.put("/api/voice-sample", response_model=VoiceSample, tags=["Voice Sample"])
async def update_voice_sample(update: VoiceSampleUpdate):
    """Persist edits to the account-wide Voice Sample record."""
    current = load_voice_sample()
    record = {
        "satire_notes": update.satire_notes,
        "emotional_notes": update.emotional_notes,
        "infographic_notes": update.infographic_notes,
        "reference_profiles": current.get("reference_profiles", []),
        "updated_at": datetime.utcnow().isoformat(),
    }
    save_voice_sample(record)
    return record


@app.post("/api/voice-sample/analyze-reference", tags=["Voice Sample"])
@limiter.limit("10/minute")
async def analyze_reference_reel(request: Request, body: ReferenceProfileAnalyzeRequest, background_tasks: BackgroundTasks):
    """Transcribe one reference reel and analyze its narrative pattern.
    Returns a job_id — poll GET /api/jobs/{job_id}. Nothing is saved yet;
    the frontend shows the analysis and the user Approves it separately
    via POST /api/voice-sample/approve-reference."""
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured.")
    if not body.video_url.strip():
        raise HTTPException(status_code=400, detail="A video URL is required.")

    job_id = uuid.uuid4().hex[:12]
    background_jobs[job_id] = {"status": "pending"}

    def _do_analyze():
        try:
            background_jobs[job_id]["status"] = "running"
            agent = ReferenceAnalyzerAgent()
            result = agent.analyze(body.video_url)
            background_jobs[job_id]["status"] = "completed"
            background_jobs[job_id]["result"] = result
        except Exception as e:
            import traceback
            with open("error.log", "a") as f:
                f.write(traceback.format_exc() + "\n")
            background_jobs[job_id]["status"] = "failed"
            background_jobs[job_id]["error"] = str(e)

    background_tasks.add_task(_do_analyze)
    return {"job_id": job_id}


@app.post("/api/voice-sample/approve-reference", response_model=VoiceSample, tags=["Voice Sample"])
async def approve_reference_profile(request: ReferenceProfileApproveRequest):
    """Save an analyzed reference reel as a named profile ("Wicked VC1",
    "Wicked VC2", ...) — appends to the accumulating library. Structural
    Designer and Script Writer read this list directly at generation time
    (services/voice_categories.py-adjacent prompt building), so no merge
    into a text blob is needed. No separate manual apply/save step; this
    is the one-click Approve action."""
    current = load_voice_sample()
    profiles = current.get("reference_profiles", [])
    profiles = profiles + [
        {
            "name": request.name,
            "url": request.url,
            "platform": request.platform,
            "analysis": request.analysis,
            "created_at": datetime.utcnow().isoformat(),
        }
    ]

    record = {
        "satire_notes": current.get("satire_notes", ""),
        "emotional_notes": current.get("emotional_notes", ""),
        "infographic_notes": current.get("infographic_notes", ""),
        "reference_profiles": profiles,
        "updated_at": datetime.utcnow().isoformat(),
    }
    save_voice_sample(record)
    return record


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

# ── GMM Endpoints ──────────────────────────────────────────────

@app.get("/brand/profile", tags=["Brand"])
async def get_brand_profile():
    """Get the fallback generic brand profile."""
    return load_brand_profile()


@app.get("/brand/templates", tags=["Brand"])
async def get_content_templates():
    """Get available storytelling frameworks and content templates."""
    return load_content_templates()


@app.get("/api/jobs/{job_id}", tags=["Jobs"])
async def get_job_status(job_id: str):
    """Generic polling endpoint for background jobs — only Voice Sample's
    analyze-reference flow uses this now."""
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
