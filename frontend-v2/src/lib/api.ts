// Typed client for the real FastAPI backend (backend/main.py). Every function
// here was checked against the live route — param names, query-vs-body, and
// response shapes are confirmed, not guessed.
import type {
  AnalyticsSummary,
  ClientCreate,
  ClientProfile,
  InstagramScriptOutput,
  JobStatus,
  StatsResponse,
  VoiceCategory,
  VoiceSample,
  VoiceSampleUpdate,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Backend's X-API-Key gate (main.py's api_key_auth middleware) is inert
// unless the server sets API_KEY — this header is a no-op against an
// unconfigured backend and only matters once a deployment turns auth on.
const API_KEY = import.meta.env.VITE_API_KEY;

interface HealthResponse {
  status: string;
  version: string;
  gemini_configured: boolean;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isBodyObject = options.body !== undefined && typeof options.body !== "string";
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        ...options.headers,
      },
      ...options,
      body: isBodyObject ? JSON.stringify(options.body) : options.body,
    });
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Unable to connect to the WICKED backend. Is it running?");
    }
    throw err;
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail || `API Error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// ── System ──────────────────────────────────────────────────

export function getHealth() {
  return apiRequest<HealthResponse>("/health");
}

export function getStats() {
  return apiRequest<StatsResponse>("/api/stats");
}

// ── Clients ─────────────────────────────────────────────────
// GET /clients returns whatever raw dict was persisted — commonly just
// {id, brand_name, tagline, category, createdAt}, never the full
// ClientProfile shape. Treat every field beyond those four as absent.

export function getClients() {
  return apiRequest<ClientProfile[]>("/clients");
}

export function getClient(id: string) {
  return apiRequest<ClientProfile>(`/clients/${id}`);
}

export function addClient(client: ClientCreate) {
  return apiRequest<ClientProfile>("/clients", { method: "POST", body: client as unknown as string });
}

export function updateClient(id: string, patch: Record<string, unknown>) {
  return apiRequest<ClientProfile>(`/clients/${id}`, { method: "PUT", body: patch as unknown as string });
}

export function deleteClient(id: string) {
  return apiRequest<{ message: string }>(`/clients/${id}`, { method: "DELETE" });
}

// ── Jobs ────────────────────────────────────────────────────
// Only Voice Sample's analyze-reference flow uses this now.

export function getJobStatus(jobId: string) {
  return apiRequest<JobStatus>(`/api/jobs/${jobId}`);
}

/**
 * For flows that need a job's result to feed the next step (Voice Sample's
 * analyze → show pattern-analysis → approve chain) rather than just watching
 * it in the Jobs Tray. The Tray polls independently via JobsContext.startJob
 * — this is a second, separate poll for flow control, not a shared subscription.
 */
export async function awaitJob(
  jobId: string,
  { intervalMs = 2000, timeoutMs = 180_000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<JobStatus> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const status = await getJobStatus(jobId);
    if (status.status === "completed" || status.status === "failed") return status;
    if (Date.now() - start > timeoutMs) throw new Error("Timed out waiting for the job to finish.");
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

// ── Voice Sample (account-wide) ────────────────────────────

export function getVoiceCategories() {
  return apiRequest<VoiceCategory[]>("/api/voice-categories");
}

export function getVoiceSample() {
  return apiRequest<VoiceSample>("/api/voice-sample");
}

export function updateVoiceSample(update: VoiceSampleUpdate) {
  return apiRequest<VoiceSample>("/api/voice-sample", { method: "PUT", body: update as unknown as string });
}

/** Returns immediately with a job_id — poll/await via getJobStatus/awaitJob. */
export function analyzeReferenceReel(videoUrl: string) {
  return apiRequest<{ job_id: string }>("/api/voice-sample/analyze-reference", {
    method: "POST",
    body: { video_url: videoUrl } as unknown as string,
  });
}

export function approveReferenceProfile(body: { name: string; url: string; platform: string; analysis: string }) {
  return apiRequest<VoiceSample>("/api/voice-sample/approve-reference", {
    method: "POST",
    body: body as unknown as string,
  });
}

// ── Instagram ───────────────────────────────────────────────
// Rate-limited 10/min server-side (slowapi) — callers should show a
// friendly message on a 429 rather than the raw error text.

export function generateInstagramScript() {
  return apiRequest<InstagramScriptOutput>("/instagram/generate-script");
}

// ── Analytics ───────────────────────────────────────────────
// Not client-scoped — the backend service returns the same account-wide
// mock dataset regardless of client_id (see services/analytics_service.py).

export function getAnalyticsSummary(platform: "All" | "YouTube" | "Instagram" = "All") {
  const qs = new URLSearchParams({ platform });
  return apiRequest<AnalyticsSummary>(`/analytics/summary?${qs.toString()}`);
}
