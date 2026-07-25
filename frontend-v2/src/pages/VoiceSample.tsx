import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Icon } from "@/components/ui/Icon";
import { useJobs } from "@/context/JobsContext";
import * as api from "@/lib/api";
import { staggerContainer, fadeIn, fadeSlideUp } from "@/lib/motion";
import type { VoiceCategory, VoiceCategoryKey, ReferenceVoiceProfile, ReferenceAnalysisResult } from "@/lib/types";

type Glow = "crimson" | "violet" | "cyan";

const CATEGORY_GLOW: Record<VoiceCategoryKey, Glow> = {
  satire: "crimson",
  emotional: "violet",
  infographic: "cyan",
};

const GLOW_TEXT: Record<Glow, string> = {
  crimson: "text-crimson",
  violet: "text-violet",
  cyan: "text-cyan",
};

const GLOW_BG: Record<Glow, string> = {
  crimson: "bg-crimson",
  violet: "bg-violet",
  cyan: "bg-cyan",
};

/**
 * Each category gets its own small mechanic diagram — a miniature visual
 * performance of the storytelling technique itself (escalation / hidden
 * layer / confusion resolving to clarity), not a generic category icon.
 */
function MechanicGlyph({ category, className }: { category: VoiceCategoryKey; className?: string }) {
  if (category === "satire") {
    return (
      <svg viewBox="0 0 48 28" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M4 24h34" strokeOpacity={0.3} />
        <path d="M4 24V19 M15 24V13 M26 24V7 M37 24V2" />
      </svg>
    );
  }
  if (category === "emotional") {
    return (
      <svg viewBox="0 0 48 28" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="16" y="3" width="26" height="19" rx="4" opacity={0.35} />
        <rect x="6" y="7" width="26" height="19" rx="4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 28" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14q4-11 8 0t8 0t8 0" />
      <path d="M32 14h10" />
      <path d="M38 9l4 5-4 5" />
    </svg>
  );
}

export function VoiceSample() {
  const { startJob } = useJobs();

  const [categories, setCategories] = useState<VoiceCategory[]>([]);
  const [notes, setNotes] = useState<Record<VoiceCategoryKey, string>>({
    satire: "",
    emotional: "",
    infographic: "",
  });
  const [referenceProfiles, setReferenceProfiles] = useState<ReferenceVoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [referenceUrl, setReferenceUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ReferenceAnalysisResult | null>(null);
  const [profileName, setProfileName] = useState("");
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getVoiceCategories(), api.getVoiceSample()])
      .then(([cats, sample]) => {
        setCategories(cats);
        setNotes({
          satire: sample.satire_notes,
          emotional: sample.emotional_notes,
          infographic: sample.infographic_notes,
        });
        setReferenceProfiles(sample.reference_profiles);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load Voice Sample."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const data = await api.updateVoiceSample({
        satire_notes: notes.satire,
        emotional_notes: notes.emotional,
        infographic_notes: notes.infographic,
      });
      setSavedAt(data.updated_at);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze() {
    const url = referenceUrl.trim();
    if (!url) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setApproveError(null);
    setJustApproved(null);
    try {
      const { job_id } = await api.analyzeReferenceReel(url);
      startJob(job_id, "Analyze reference reel");
      const status = await api.awaitJob(job_id);
      if (status.status === "completed") {
        const result = status.result as ReferenceAnalysisResult;
        setAnalysisResult(result);
        setProfileName(result.suggested_name ?? "");
      } else {
        setAnalysisError(status.error ?? "Analysis failed.");
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Failed to analyze that link.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleApprove() {
    if (!analysisResult?.pattern_analysis || !profileName.trim()) return;
    setApproving(true);
    setApproveError(null);
    try {
      const data = await api.approveReferenceProfile({
        name: profileName.trim(),
        url: analysisResult.url,
        platform: analysisResult.platform,
        analysis: analysisResult.pattern_analysis,
      });
      setReferenceProfiles(data.reference_profiles);
      setSavedAt(data.updated_at);
      setJustApproved(profileName.trim());
      setReferenceUrl("");
      setAnalysisResult(null);
      setProfileName("");
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : "Failed to approve.");
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col gap-6">
      <motion.div variants={fadeIn}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Voice Sample</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-dim">
          The account-wide creative reference every script is written through. Pick a category's mechanic
          at generation time, tuned by the notes below and layered on top of each client's own brand
          profile.
        </p>
      </motion.div>

      {loadError && (
        <GlassPanel tilt={false} glow="none" className="p-4 text-sm text-status-error">
          {loadError}
        </GlassPanel>
      )}

      <motion.div variants={fadeSlideUp}>
        <GlassPanel tilt={false} glow="violet" className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="font-display text-sm font-semibold text-ink">Learn From Reference Reels</h2>
            <p className="mt-1 text-sm text-ink-dim">
              Paste one reel, TikTok, or YouTube link at a time. It's transcribed and analyzed for its
              narrative technique — approve it to file it as its own named profile, then paste the next one.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              disabled={analyzing}
              placeholder="Paste a Reel, TikTok, or YouTube link…"
              className="min-h-11 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-ink outline-none focus-visible:border-cyan"
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !referenceUrl.trim()}
              className="min-h-11 shrink-0 rounded-lg bg-crimson px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {analyzing ? "Analyzing…" : "Analyze"}
            </button>
          </div>

          {analysisError && <p className="text-sm text-status-error">{analysisError}</p>}

          {analyzing && (
            <div className="flex flex-col gap-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="h-24 animate-pulse rounded-lg bg-white/5" />
            </div>
          )}

          <AnimatePresence>
            {!analyzing && analysisResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {!analysisResult.transcribed || !analysisResult.pattern_analysis ? (
                  <p className="glass-panel--recessed rounded-lg p-3 text-sm text-status-error">
                    {analysisResult.note || "Could not get a usable analysis from that link."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="glass-panel--recessed whitespace-pre-wrap rounded-lg p-4 font-data text-sm leading-relaxed text-ink-dim">
                      {analysisResult.pattern_analysis}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        disabled={approving}
                        placeholder="Save as…"
                        className="min-h-11 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-ink outline-none focus-visible:border-cyan"
                      />
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={approving || !profileName.trim()}
                        className="min-h-11 shrink-0 rounded-lg bg-violet px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {approving ? "Approving…" : "Approve"}
                      </button>
                    </div>
                    {approveError && <p className="text-sm text-status-error">{approveError}</p>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {justApproved && (
            <p className="flex items-center gap-1.5 text-sm text-status-running">
              <Icon name="check" size={14} /> Approved as {justApproved} — filed below.
            </p>
          )}

          {referenceProfiles.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Filed profiles ({referenceProfiles.length})
              </p>
              <ul className="flex flex-col gap-1">
                {referenceProfiles.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 font-data text-xs text-ink-dim hover:bg-white/[0.03]"
                  >
                    <span className="font-semibold text-ink">{p.name}</span>
                    <span className="truncate text-ink-faint">{p.url}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassPanel>
      </motion.div>

      <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {categories.map((cat) => {
          const glow = CATEGORY_GLOW[cat.key];
          return (
            <motion.div key={cat.key} variants={fadeSlideUp}>
              <GlassPanel tilt={false} glow={glow} className="flex h-full flex-col gap-3 p-5">
                <MechanicGlyph category={cat.key} className={clsx("h-6 w-12", GLOW_TEXT[glow])} />
                <div>
                  <p className="font-display text-base font-semibold text-ink">{cat.label}</p>
                  <p className={clsx("mt-0.5 font-data text-xs font-medium uppercase tracking-wide", GLOW_TEXT[glow])}>
                    {cat.concept_name}
                  </p>
                </div>
                <p className="text-sm text-ink-dim">{cat.short_description}</p>
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-faint">Your notes (optional)</span>
                  <textarea
                    value={notes[cat.key]}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                    rows={5}
                    placeholder="Brand-specific tuning, examples, reminders…"
                    className="glass-panel--recessed flex-1 resize-none rounded-lg px-3 py-2 text-sm text-ink outline-none focus-visible:border-cyan"
                  />
                </label>
              </GlassPanel>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={clsx(
            "min-h-11 rounded-lg px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50",
            GLOW_BG.crimson,
          )}
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        {saveError && <span className="text-sm text-status-error">{saveError}</span>}
        {savedAt && !saving && !saveError && (
          <span className="text-xs text-ink-faint">Saved {new Date(savedAt).toLocaleTimeString()}</span>
        )}
      </motion.div>
    </motion.div>
  );
}
