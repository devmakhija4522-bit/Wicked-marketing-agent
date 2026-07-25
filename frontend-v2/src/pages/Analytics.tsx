import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CountUp } from "@/components/ui/CountUp";
import { ViewsBarChart } from "@/components/ui/ViewsBarChart";
import { useClient } from "@/context/ClientContext";
import * as api from "@/lib/api";
import { staggerContainer, fadeIn, fadeSlideUp } from "@/lib/motion";
import type { AnalyticsPlatform, AnalyticsSummary } from "@/lib/types";

export function Analytics() {
  const { activeClient } = useClient();
  const [platform, setPlatform] = useState<AnalyticsPlatform>("All");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeClient) return;
    setLoading(true);
    setError(null);
    api
      .getAnalyticsSummary(platform)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analytics."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id, platform]);

  if (!activeClient) {
    return (
      <GlassPanel tilt={false} className="p-5 text-sm text-ink-dim">
        Select a client to view analytics.
      </GlassPanel>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col gap-6">
      <motion.div variants={fadeIn}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-ink-dim">Performance across every published platform.</p>
      </motion.div>

      {error && (
        <GlassPanel tilt={false} glow="none" className="p-4 text-sm text-status-error">
          {error}
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassPanel className="p-4" tilt={false} glow="none">
          <p className="text-xs text-ink-dim">Total views</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">
            {summary ? <CountUp value={summary.total_views} /> : "—"}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4" tilt={false} glow="none">
          <p className="text-xs text-ink-dim">Total likes</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">
            {summary ? <CountUp value={summary.total_likes} /> : "—"}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4" tilt={false} glow="none">
          <p className="text-xs text-ink-dim">Total comments</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">
            {summary ? <CountUp value={summary.total_comments} /> : "—"}
          </p>
        </GlassPanel>
      </div>

      <motion.div variants={fadeSlideUp} className="flex flex-wrap gap-2">
        {(["All", "YouTube", "Instagram"] as AnalyticsPlatform[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPlatform(value)}
            aria-pressed={platform === value}
            className={clsx(
              "min-h-11 rounded-full border px-4 text-sm transition-colors",
              platform === value
                ? "border-crimson/50 bg-crimson/15 text-ink"
                : "border-white/10 text-ink-dim hover:text-ink",
            )}
          >
            {value}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      ) : summary && summary.videos.length > 0 ? (
        <>
          <motion.div variants={fadeSlideUp}>
            <GlassPanel tilt={false} glow="cyan" className="p-5">
              <h2 className="mb-4 font-display text-sm font-semibold text-ink">Views by post</h2>
              <ViewsBarChart data={summary.videos.map((v) => ({ label: v.title, value: v.views }))} />
            </GlassPanel>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.videos.map((video) => (
              <GlassPanel key={video.id} className="flex flex-col gap-2 p-4" glow="cyan">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan">
                    {video.platform}
                  </span>
                  <span className="text-xs text-ink-faint">{new Date(video.posted_at).toLocaleDateString()}</span>
                </div>
                <p className="font-display text-sm font-semibold text-ink">{video.title}</p>
                <dl className="mt-1 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <dt className="text-[10px] text-ink-faint">Views</dt>
                    <dd className="text-sm font-semibold text-ink">{video.views.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-ink-faint">Likes</dt>
                    <dd className="text-sm font-semibold text-ink">{video.likes.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-ink-faint">Comments</dt>
                    <dd className="text-sm font-semibold text-ink">{video.comments.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-ink-faint">Shares</dt>
                    <dd className="text-sm font-semibold text-ink">{video.shares.toLocaleString()}</dd>
                  </div>
                </dl>
              </GlassPanel>
            ))}
          </motion.div>
        </>
      ) : (
        <GlassPanel tilt={false} className="p-6 text-center text-sm text-ink-dim">
          No posts for this platform yet.
        </GlassPanel>
      )}
    </motion.div>
  );
}
