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
    category: str = ""  # "satire" | "emotional" | "infographic" | "" (no category selected)
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
    linkedin_references: list[str] = Field(default_factory=list)

# ── Voice Sample (account-wide, not per-client) ───────────────

class ReferenceVoiceProfile(BaseModel):
    """A single approved reference-reel analysis, saved as a named library
    entry — accumulates alongside previous profiles rather than replacing
    them (e.g. "Wicked VC1", "Wicked VC2", ...)."""
    name: str
    url: str
    platform: str = "unknown"
    analysis: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VoiceSample(BaseModel):
    """Account-wide creative voice reference used by Structural Designer
    and Script Writer, alongside (not instead of) each client's own
    brand profile. The three *_notes fields are optional user tuning
    layered on top of each category's fixed concept mechanic (defined in
    services/voice_categories.py, not stored here)."""
    satire_notes: str = ""
    emotional_notes: str = ""
    infographic_notes: str = ""
    reference_profiles: list[ReferenceVoiceProfile] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class VoiceSampleUpdate(BaseModel):
    satire_notes: str = ""
    emotional_notes: str = ""
    infographic_notes: str = ""


# ── Remix: transcribe + rewrite a video link in the account's voice ──

class CreativeStudioRemixRequest(BaseModel):
    """A pasted Instagram Reel / TikTok / YouTube link to remix, scoped to
    a specific client so it applies that client's brand context."""
    client_id: str
    video_url: str
    tone: str = ""  # optional override, e.g. "punchy", "story-driven", "educational"
    category: str = ""  # "satire" | "emotional" | "infographic" — required by the frontend


class CreativeStudioRemixOutput(BaseModel):
    """Remix result — a full GeneratedScript (same shape Script Writer
    produces) plus the derived structure and source transcript, so the
    frontend can Add+Move this straight to Vault in the same bundle format
    Content Generator uses."""
    script: Optional[GeneratedScript] = None
    structure: Optional[StructureOption] = None
    transcript: str = ""
    platform: str = ""
    summary: str = ""
    note: str = ""


# ── Voice Sample: Reference Reel Analysis ─────────────────────
# One link at a time: analyze -> review -> Approve saves it as its own
# named, accumulating profile (Wicked VC1, VC2, ...) rather than a single
# blob that gets overwritten on every run.

class ReferenceProfileAnalyzeRequest(BaseModel):
    video_url: str


class ReferenceProfileAnalyzeOutput(BaseModel):
    url: str
    platform: str = "unknown"
    transcribed: bool = False
    duration_seconds: Optional[int] = None
    note: str = ""
    pattern_analysis: str = ""
    suggested_name: str = ""


class ReferenceProfileApproveRequest(BaseModel):
    name: str
    url: str
    platform: str = "unknown"
    analysis: str


# ── Creative Studio: Keyword Planner (Phase 2) ────────────────

class KeywordPhrase(BaseModel):
    """A single video-search-style keyword phrase suggested for a topic."""
    phrase: str
    source_note: str = ""


class KeywordPlannerRequest(BaseModel):
    client_id: str


class KeywordPlannerOutput(BaseModel):
    keywords: list[KeywordPhrase] = Field(default_factory=list)
    sources_used: list[str] = Field(default_factory=list)
    sources_skipped: list[str] = Field(default_factory=list)
    note: str = ""


# ── Creative Studio: Structural Designer (Phase 3) ────────────

class StructureOption(BaseModel):
    """A script structure option — hook direction + beat outline, not a
    full script yet."""
    hook_direction: str
    beat_outline: list[str] = Field(default_factory=list)
    source_keyword: str = ""
    category: str = ""  # "satire" | "emotional" | "infographic" | ""


class StructuralDesignerRequest(BaseModel):
    client_id: str
    category: str = ""  # "satire" | "emotional" | "infographic" — required by the frontend, defaults to the neutral fallback if omitted


class StructuralDesignerOutput(BaseModel):
    structures: list[StructureOption] = Field(default_factory=list)
    note: str = ""


# ── Creative Studio: Script Writer (Phase 4) ──────────────────

class CreativeStudioScriptWriterRequest(BaseModel):
    client_id: str
    category: str = ""  # "satire" | "emotional" | "infographic"


class CreativeStudioScriptWriterOutput(BaseModel):
    scripts: list[GeneratedScript] = Field(default_factory=list)
    note: str = ""


# ── Creative Studio: AI Idea Chat (alternative to Keyword Planner) ────
# A genuine back-and-forth brainstorming chat, not a single-shot keyword
# box — the agent converses, then once ready, returns a distilled topic
# the user can move to Structural Designer, exactly like a fetched
# keyword. It does not generate a structure/script itself, since that
# now requires an explicit category chosen in the UI first.

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class IdeaChatRequest(BaseModel):
    client_id: str
    messages: list[ChatMessage] = Field(default_factory=list)


# ── Creative Studio: per-client pipeline state ────────────────
# Carries selections forward between Keyword Planner -> Structural
# Designer -> Script Writer within a client's Creative Studio tab.

class CreativeStudioState(BaseModel):
    client_id: str
    selected_keywords: list[KeywordPhrase] = Field(default_factory=list)
    selected_structures: list[dict] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ── GMM Models (Grest Marketing Manager) ──────────────────────

class GMMResearchRequest(BaseModel):
    client_id: str
    product_focus: Optional[str] = "General Brand Marketing"
    viral_url: Optional[str] = ""

class LinkedInDraftRequest(BaseModel):
    client_id: str
    references: Optional[str] = ""

class GMMResearchResponse(BaseModel):
    news: str
    hooks: str

class GMMGenerateRequest(BaseModel):
    client_id: str
    product_focus: Optional[str] = "General Brand Marketing"
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
