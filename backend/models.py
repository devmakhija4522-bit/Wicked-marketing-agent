"""
WICKED Pydantic Models
Data structures for client account management and the account-wide
Voice Sample backend.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Clients ────────────────────────────────────────────────────

class ClientCreate(BaseModel):
    name: str
    description: str = ""


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    gemini_configured: bool = False


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
# NOTE: the feature is currently disabled in the frontend (no route/nav
# entry), but this backend surface is kept intentionally intact.

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
