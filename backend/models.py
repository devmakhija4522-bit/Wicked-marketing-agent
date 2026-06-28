from pydantic import BaseModel
from typing import Optional, List

class Trend(BaseModel):
    title: str
    source: str  # youtube, google_trends, reddit
    category: str
    engagement_signal: str
    raw_data: dict

class TrendInsight(BaseModel):
    trend: Trend
    why_trending: str
    emotion: str
    audience: str
    content_type: str  # humor, emotional, suspense, educational, relatable

class ContentConcept(BaseModel):
    insight: TrendInsight
    angle: str
    grest_hook: str
    virality_score: int
    brand_fit_score: int
    originality_score: int

class Script(BaseModel):
    concept: ContentConcept
    language: str
    hook: str
    body: str
    grest_moment: str
    cta: str
    visual_notes: str
    full_script: str

class ScriptReview(BaseModel):
    script: Script
    brand_alignment_score: int
    approved: bool
    feedback: str
    flags: List[str]

class PipelineRequest(BaseModel):
    language: Optional[str] = "hinglish"
    custom_topic: Optional[str] = None
    style_samples: Optional[List[str]] = []
