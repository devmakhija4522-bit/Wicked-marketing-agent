// Mirrors backend Pydantic models (backend/models.py). Keep field names identical
// to the Python models so fixtures/api stay swappable without remapping.

/**
 * The Pydantic ClientProfile model declares target_audience/usps/brand_voice/
 * content_philosophy/linkedin_references, but the live POST /clients handler
 * bypasses that model and only ever persists {id, brand_name, tagline,
 * category, createdAt} — so every field beyond the first four is optional in
 * practice and UI must degrade gracefully when they're absent. `usps` is
 * typed as `list[dict]` on the backend, not list[str], and is never actually
 * populated by the observed flow, so treat its shape as unknown too.
 */
export interface ClientProfile {
  id: string;
  brand_name: string;
  tagline: string;
  category: string;
  createdAt?: string;
  website?: string;
  target_audience?: Record<string, unknown>;
  usps?: unknown[];
  brand_voice?: Record<string, unknown>;
  content_philosophy?: Record<string, unknown>;
  linkedin_references?: string[];
}

export interface ClientCreate {
  name: string;
  description: string;
}

export type JobState = "pending" | "running" | "completed" | "failed";

/** Exact shape GET /api/jobs/{job_id} returns — no job_id/label/timestamp server-side. */
export interface JobStatus {
  status: JobState;
  result?: unknown;
  error?: string;
}

/** JobStatus plus the bookkeeping the server doesn't track, added client-side by JobsContext. */
export interface TrackedJob extends JobStatus {
  job_id: string;
  label: string;
  created_at: string;
}

export interface StatsResponse {
  totalScripts: number;
  trendsScanned: number;
  avgBrandScore: number;
  activePipelines: number;
}

// --- Voice Sample (account-wide creative reference) ---
// Mirrors GET /api/voice-categories, GET/PUT /api/voice-sample,
// POST /api/voice-sample/analyze-reference, POST /api/voice-sample/approve-reference.

export type VoiceCategoryKey = "satire" | "emotional" | "infographic";

export interface VoiceCategory {
  key: VoiceCategoryKey;
  label: string;
  concept_name: string;
  short_description: string;
}

export interface ReferenceVoiceProfile {
  name: string;
  url: string;
  platform: string;
  analysis: string;
  created_at: string;
}

export interface VoiceSample {
  satire_notes: string;
  emotional_notes: string;
  infographic_notes: string;
  reference_profiles: ReferenceVoiceProfile[];
  updated_at: string;
}

export interface VoiceSampleUpdate {
  satire_notes: string;
  emotional_notes: string;
  infographic_notes: string;
}

/** Shape of a completed analyze-reference job's `result` field. */
export interface ReferenceAnalysisResult {
  url: string;
  platform: string;
  transcribed: boolean;
  duration_seconds: number | null;
  note: string;
  pattern_analysis: string;
  suggested_name: string;
}

// --- Instagram Reel script generation ---
// Mirrors GET /instagram/generate-script.

export interface InstagramScriptOutput {
  title: string;
  script: string;
  visual_cues: string[];
  suggested_audio: string;
  source_news_title: string;
  format_used: string;
}

// --- Analytics ---
// Mirrors GET /analytics/summary.

/** platform is a free string on the backend — live values are title-case: "YouTube" / "Instagram". */
export type AnalyticsPlatform = "All" | "YouTube" | "Instagram";

export interface AnalyticsVideo {
  id: string;
  thumbnail_url: string;
  title: string;
  platform: string;
  posted_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface AnalyticsSummary {
  total_views: number;
  total_likes: number;
  total_comments: number;
  videos: AnalyticsVideo[];
}
