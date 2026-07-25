import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Icon } from "@/components/ui/Icon";
import * as api from "@/lib/api";
import { staggerContainer, fadeIn } from "@/lib/motion";
import type { InstagramScriptOutput } from "@/lib/types";

/** Viewfinder corner brackets — frames the script like it's mid-take, not just a text card. */
function ViewfinderCorners() {
  const corner = "pointer-events-none absolute h-4 w-4 border-crimson/70";
  return (
    <>
      <span className={clsx(corner, "left-3 top-3 border-l-2 border-t-2")} aria-hidden="true" />
      <span className={clsx(corner, "right-3 top-3 border-r-2 border-t-2")} aria-hidden="true" />
      <span className={clsx(corner, "bottom-3 left-3 border-b-2 border-l-2")} aria-hidden="true" />
      <span className={clsx(corner, "bottom-3 right-3 border-b-2 border-r-2")} aria-hidden="true" />
    </>
  );
}

export function InstagramScriptStudio() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<InstagramScriptOutput | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generateInstagramScript();
      setScript(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate a script.";
      setError(
        /429|rate limit/i.test(message)
          ? "Slow down — you can generate again in a minute."
          : message,
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col gap-6">
      <motion.div variants={fadeIn} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Instagram Script Studio</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-dim">
            Pulls the latest Apple news, pairs it with a trending viral format, and writes a Reel script —
            one take per click.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="min-h-11 shrink-0 rounded-lg bg-crimson px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "Rolling…" : script ? "Generate another" : "Generate script"}
        </button>
      </motion.div>

      {error && (
        <GlassPanel tilt={false} glow="none" className="p-4 text-sm text-status-error">
          {error}
        </GlassPanel>
      )}

      {generating && (
        <div className="flex flex-col gap-3">
          <div className="h-8 w-1/2 animate-pulse rounded bg-white/5" />
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {!generating && script && (
          <motion.div
            key={script.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-2 font-data text-xs text-ink-faint">
              <span className="rounded-full border border-white/10 px-2 py-0.5">{script.format_used}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">from &ldquo;{script.source_news_title}&rdquo;</span>
            </div>

            <div className="relative">
              <ViewfinderCorners />
              <GlassPanel tilt={false} glow="crimson" className="p-6">
                <div className="flex items-center gap-2 pb-3 text-crimson">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-crimson" />
                  </span>
                  <span className="font-data text-[11px] font-semibold uppercase tracking-widest">Rec</span>
                </div>
                <h2 className="font-display text-xl font-bold text-ink">{script.title}</h2>
                <div className="glass-panel--recessed mt-4 whitespace-pre-wrap rounded-lg p-4 font-data text-sm leading-relaxed text-ink-dim">
                  {script.script}
                </div>
              </GlassPanel>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <GlassPanel tilt={false} glow="cyan" className="p-4">
                <h3 className="mb-2 font-display text-sm font-semibold text-ink">Visual cues</h3>
                <ul className="flex flex-wrap gap-2">
                  {script.visual_cues.map((cue, i) => (
                    <li key={i} className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-xs text-cyan">
                      {cue}
                    </li>
                  ))}
                </ul>
              </GlassPanel>
              <GlassPanel tilt={false} glow="violet" className="p-4">
                <h3 className="mb-2 font-display text-sm font-semibold text-ink">Suggested audio</h3>
                <p className="flex items-center gap-2 text-sm text-ink-dim">
                  <Icon name="sparkles" size={16} className="text-violet" />
                  {script.suggested_audio}
                </p>
              </GlassPanel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!generating && !script && !error && (
        <GlassPanel tilt={false} glow="none" className="flex flex-col items-center gap-2 p-10 text-center">
          <Icon name="clapper" size={28} className="text-ink-faint" />
          <p className="text-sm text-ink-dim">Nothing rolled yet — hit generate to write today's take.</p>
        </GlassPanel>
      )}
    </motion.div>
  );
}
