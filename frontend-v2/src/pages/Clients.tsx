import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Icon } from "@/components/ui/Icon";
import { useClient } from "@/context/ClientContext";
import { hashToHsl } from "@/lib/brandColor";
import { staggerContainer, fadeIn } from "@/lib/motion";

export function Clients() {
  const { clients, activeClient, switchClient, addClient, removeClient, loading, error } = useClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await addClient({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add client.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, brandName: string) {
    if (!confirm(`Delete ${brandName}? This can't be undone.`)) return;
    setDeletingId(id);
    try {
      await removeClient(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col gap-6">
      <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Clients</h1>
          <p className="mt-1 text-sm text-ink-dim">Every brand under management.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="min-h-11 min-w-11 rounded-lg bg-crimson px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Cancel" : "Add Client"}
        </button>
      </motion.div>

      {error && (
        <GlassPanel tilt={false} glow="none" className="p-4 text-sm text-status-error">
          {error}
        </GlassPanel>
      )}

      {showForm && (
        <GlassPanel tilt={false} glow="crimson" className="p-5">
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-dim">Brand name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-ink outline-none focus-visible:border-cyan"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-dim">Description / tagline</span>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-ink outline-none focus-visible:border-cyan"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 min-w-11 rounded-lg bg-crimson px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add"}
            </button>
          </form>
          {formError && <p className="mt-2 text-xs text-status-error">{formError}</p>}
        </GlassPanel>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const isActive = client.id === activeClient?.id;
            const color = hashToHsl(client.id);
            return (
              <GlassPanel
                key={client.id}
                glow={isActive ? "crimson" : "none"}
                className={clsx("flex flex-col items-start gap-3 p-5", isActive && "ring-1 ring-crimson/40")}
              >
                <div className="flex w-full items-start justify-between">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 items-center justify-center rounded-xl font-display text-lg font-bold text-void"
                    style={{ background: color }}
                  >
                    {client.brand_name.charAt(0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(client.id, client.brand_name)}
                    disabled={deletingId === client.id}
                    aria-label={`Delete ${client.brand_name}`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-faint transition-colors hover:text-status-error disabled:opacity-50"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <span className="font-display text-base font-semibold text-ink">{client.brand_name}</span>
                <span className="line-clamp-3 text-sm text-ink-dim">{client.tagline}</span>
                <span className="text-xs text-ink-faint">{client.category}</span>
                <button
                  type="button"
                  onClick={() => switchClient(client.id)}
                  className="mt-1 min-h-11 rounded-lg border border-crimson/40 px-3 text-xs font-medium text-crimson transition-colors hover:bg-crimson/10"
                >
                  {isActive ? (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="check" size={12} /> Active
                    </span>
                  ) : (
                    "Set active"
                  )}
                </button>
              </GlassPanel>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
