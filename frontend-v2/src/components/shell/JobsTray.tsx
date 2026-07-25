import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useJobs } from "@/context/JobsContext";
import { Icon } from "@/components/ui/Icon";
import { StatusPill, type StatusKind } from "@/components/ui/StatusPill";
import type { TrackedJob } from "@/lib/types";

export function JobsTrayToggle() {
  const { jobs, isOpen, toggle } = useJobs();
  const activeCount = jobs.filter((j) => j.status === "running" || j.status === "pending").length;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={`Background jobs${activeCount ? `, ${activeCount} in progress` : ""}`}
      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-dim transition-colors hover:text-cyan"
    >
      <Icon name="bell" />
      {activeCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-status-running"
        />
      )}
    </button>
  );
}

const STATUS_MAP: Record<TrackedJob["status"], StatusKind> = {
  pending: "pending",
  running: "running",
  completed: "completed",
  failed: "error",
};

function JobRow({ job }: { job: TrackedJob }) {
  const kind = STATUS_MAP[job.status];
  const indeterminate = job.status === "running" || job.status === "pending";
  return (
    <li className="glass-panel rounded-xl p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink">{job.label}</p>
        <StatusPill status={kind} live />
      </div>
      {job.status === "failed" && job.error && (
        <p className="text-xs text-status-error">{job.error}</p>
      )}
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
        {indeterminate ? (
          <motion.div
            className="h-full w-1/3 rounded-full bg-cyan"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <div
            className="h-full rounded-full"
            style={{
              width: "100%",
              background: job.status === "failed" ? "var(--color-status-error)" : "var(--color-status-running)",
            }}
          />
        )}
      </div>
    </li>
  );
}

export function JobsTray() {
  const { jobs, isOpen, close } = useJobs();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Pointer-only dismiss surface — the real close button below (plus Escape) handles keyboard. */}
          <div aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-black/50" />
          <motion.div
            role="dialog"
            aria-label="Background jobs"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass-panel fixed right-4 top-20 z-50 max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-ink">Jobs</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close jobs panel"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-dim hover:text-ink"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            {jobs.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-dim">No background jobs running.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {jobs.map((job) => (
                  <JobRow key={job.job_id} job={job} />
                ))}
              </ul>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
