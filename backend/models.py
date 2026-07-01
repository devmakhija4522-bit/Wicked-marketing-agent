"""
WICKED Pydantic Models
All data structures flowing through the 5-agent pipeline.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Clients ────────────────────────────────────────────────────

class ClientCreate(BaseModel):
    name: str
    description: str


# ── Enums ──────────────────────────────────────────────────────

class TrendSource(str, Enum):
    YOUTUBE = "youtube"
    REDDIT = "reddit"
    GOOGLE_TRENDS = "google_trends"
    INSTAGRAM = "instagram"
    LLM_GENERATED = "llm_generated"


class ContentFormat(str, Enum):
    INSTAGRAM_REEL = "instagram_reel"
    YOUTUBE_SHORT = "youtube_short"


class PipelineStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# ── Trend Scout Models ────────────────────────────────────────

class TrendItem(BaseModel):
    """A single trending topic / content piece discovered by Trend Scout."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    title: str
    description: str = ""
    source: TrendSource
    url: str = ""
    engagement_metrics: dict = Field(default_factory=dict)
    keywords: list[str] = Field(default_factory=list)
    category: str = ""
    discovered_at: datetime = Field(default_factory=datetime.utcnow)
    raw_data: dict = Field(default_factory=dict)


class TrendScoutOutput(BaseModel):
    """Output of the Trend Scout agent."""
    trends: list[TrendItem] = Field(default_factory=list)
    sources_scanned: list[str] = Field(default_factory=list)
    sources_skipped: list[str] = Field(default_factory=list)
    scan_timestamp: datetime = Field(default_factory=datetime.utcnow)
    query_used: str = ""


# ── Insight Analyst Models ────────────────────────────────────

class TrendInsight(BaseModel):
    """Deep analysis of WHY a trend is trending."""
    trend_id: str
    trend_title: str
    why_trending: str
    emotional_drivers: list[str] = Field(default_factory=list)
    psychological_patterns: list[str] = Field(default_factory=list)
    audience_overlap_score: float = Field(default=0.0, ge=0.0, le=1.0)
    cultural_context: str = ""
    virality_factors: list[str] = Field(default_factory=list)
    brand_relevance: str = ""
    recommended_angle: str = ""


class InsightAnalystOutput(BaseModel):
    """Output of the Insight Analyst agent."""
    insights: list[TrendInsight] = Field(default_factory=list)
    top_opportunity: str = ""
    analysis_summary: str = ""


# ── Content Strategist Models ─────────────────────────────────

class ContentConcept(BaseModel):
    """A scored content idea mapped to the brand."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    title: str
    hook: str
    concept_summary: str
    storytelling_framework: str = ""
    trend_reference: str = ""
    brand_angle: str = ""
    target_emotion: str = ""
    format: ContentFormat = ContentFormat.INSTAGRAM_REEL
    estimated_virality_score: float = Field(default=0.0, ge=0.0, le=10.0)
    confidence_score: float = Field(default=0.0, ge=0.0, le=10.0)
    reasoning: str = ""


class ContentStrategistOutput(BaseModel):
    """Output of the Content Strategist agent."""
    concepts: list[ContentConcept] = Field(default_factory=list)
    strategy_rationale: str = ""
    recommended_concept_id: str = ""


# ── Script Writer Models ──────────────────────────────────────

class ScriptSection(BaseModel):
    """A section of the final script."""
    section_name: str
    duration_seconds: str = ""
    dialogue: str
    visual_notes: str = ""
    audio_notes: str = ""


class GeneratedScript(BaseModel):
    """A complete Hinglish script for a reel/short."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    concept_id: str = ""
    title: str
    format: ContentFormat = ContentFormat.INSTAGRAM_REEL
    total_duration_seconds: int = 45
    hook_line: str
    sections: list[ScriptSection] = Field(default_factory=list)
    full_script_text: str = ""
    visual_direction: str = ""
    audio_direction: str = ""
    hashtags: list[str] = Field(default_factory=list)
    caption_suggestion: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ScriptWriterOutput(BaseModel):
    """Output of the Script Writer agent."""
    script: GeneratedScript
    writing_notes: str = ""
    style_applied: str = ""


# ── Brand Guardian Models ─────────────────────────────────────

class BrandIssue(BaseModel):
    """A single issue flagged by the Brand Guardian."""
    severity: str = "low"
    category: str = ""
    description: str
    location_in_script: str = ""
    suggestion: str = ""


class BrandGuardianOutput(BaseModel):
    """Output of the Brand Guardian agent."""
    approved: bool = False
    overall_score: float = Field(default=0.0, ge=0.0, le=100.0)
    issues: list[BrandIssue] = Field(default_factory=list)
    praise: list[str] = Field(default_factory=list)
    revised_script: Optional[GeneratedScript] = None
    review_summary: str = ""


# ── Pipeline / API Models ────────────────────────────────────

class PipelineInput(BaseModel):
    """User-facing input to kick off the full pipeline."""
    client_id: str = Field(default="generic", description="The ID of the client brand profile to use")
    topic: str = Field(default="", description="Optional topic to focus trend scanning on")
    keywords: list[str] = Field(default_factory=list, description="Optional seed keywords")
    format: ContentFormat = ContentFormat.INSTAGRAM_REEL
    style_reference: str = Field(default="", description="Optional: paste a script/text whose writing style to mimic")
    num_concepts: int = Field(default=3, ge=1, le=5)


class PipelineRun(BaseModel):
    """Tracks a full pipeline execution."""
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    status: PipelineStatus = PipelineStatus.PENDING
    input: PipelineInput
    trend_output: Optional[TrendScoutOutput] = None
    insight_output: Optional[InsightAnalystOutput] = None
    strategy_output: Optional[ContentStrategistOutput] = None
    script_output: Optional[ScriptWriterOutput] = None
    guardian_output: Optional[BrandGuardianOutput] = None
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    gemini_configured: bool = False
    available_trend_sources: list[str] = Field(default_factory=list)


class StyleAnalysisResult(BaseModel):
    """Result of analyzing a writing style reference."""
    tone: str = ""
    vocabulary_style: str = ""
    sentence_structure: str = ""
    humor_style: str = ""
    pacing: str = ""
    signature_phrases: list[str] = Field(default_factory=list)
    overall_summary: str = ""

# ── Client Models ─────────────────────────────────────────────

class ClientProfile(BaseModel):
    """A client profile for the marketing agency."""
    id: str
    brand_name: str
    tagline: str = ""
    category: str = ""
    website: str = ""
    target_audience: dict = Field(default_factory=dict)
    usps: list[dict] = Field(default_factory=list)
    brand_voice: dict = Field(default_factory=dict)
    content_philosophy: dict = Field(default_factory=dict)

# ── GMM Models (Grest Marketing Manager) ──────────────────────

class GMMResearchRequest(BaseModel):
    client_id: str
    product_focus: str
    viral_url: Optional[str] = ""

class GMMResearchResponse(BaseModel):
    news: str
    hooks: str

class GMMGenerateRequest(BaseModel):
    client_id: str
    product_focus: str
    news: str
    hooks: str

class GMMGenerateResponse(BaseModel):
    instagram_reel: str
    youtube_video: str
    facebook_post: str
    image_prompt: str = ""

class GMMBrandScrapeRequest(BaseModel):
    website_url: str

class GMMBrandScrapeResponse(BaseModel):
    brand_name: str
    tagline: str
    category: str
    target_audience: str
    brand_voice: str
