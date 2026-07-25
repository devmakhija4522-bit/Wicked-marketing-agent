import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useClient } from "@/context/ClientContext";
import * as api from "@/lib/api";
import { staggerContainer, fadeIn, fadeSlideUp } from "@/lib/motion";

export function BrandSettings() {
  const { activeClient, refreshClients } = useClient();
  const [tagline, setTagline] = useState("");
  const [tone, setTone] = useState("");
  const [persona, setPersona] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeClient) return;
    setTagline(activeClient.tagline);
    setTone((activeClient.brand_voice?.tone as string) ?? "");
    setPersona((activeClient.brand_voice?.persona as string) ?? "");
    setSaved(false);
    setError(null);
  }, [activeClient]);

  if (!activeClient) {
    return (
      <GlassPanel tilt={false} className="p-5 text-sm text-ink-dim">
        Select a client to edit their brand profile.
      </GlassPanel>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!activeClient) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateClient(activeClient.id, {
        tagline,
        brand_voice: { ...(activeClient.brand_voice ?? {}), tone, persona },
      });
      await refreshClients();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const usps = (activeClient.usps ?? []).filter((u): u is string => typeof u === "string");

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col gap-6">
      <motion.div variants={fadeIn}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Brand & Settings</h1>
        <p className="mt-1 text-sm text-ink-dim">Editing {activeClient.brand_name}'s voice profile.</p>
      </motion.div>

      <motion.div variants={fadeSlideUp}>
        <GlassPanel tilt={false} glow="crimson" className="p-5">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-dim">Tagline</span>
              <textarea
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                rows={3}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink outline-none focus-visible:border-cyan"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-dim">Tone</span>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g. confident, no-nonsense, a little cheeky"
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-ink outline-none focus-visible:border-cyan"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-dim">Persona</span>
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                rows={3}
                placeholder="e.g. the smart friend who never overpays"
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink outline-none focus-visible:border-cyan"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 min-w-11 rounded-lg bg-crimson px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {saved && <span className="text-xs text-status-running">Saved.</span>}
              {error && <span className="text-xs text-status-error">{error}</span>}
            </div>
          </form>
        </GlassPanel>
      </motion.div>

      <motion.div variants={fadeSlideUp}>
        <GlassPanel tilt={false} glow="none" className="p-5">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">USPs</h2>
          {usps.length === 0 ? (
            <p className="text-sm text-ink-dim">No structured USPs on file for this client yet.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {usps.map((usp) => (
                <li key={usp} className="text-sm text-ink-dim">
                  • {usp}
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </motion.div>
    </motion.div>
  );
}
