import clsx from "clsx";

export type StatusKind = "running" | "paused" | "error" | "pending" | "completed";

const CONFIG: Record<StatusKind, { color: string; label: string; pulse: boolean; icon: string }> = {
  running: { color: "var(--color-status-running)", label: "Running", pulse: true, icon: "●" },
  paused: { color: "var(--color-status-paused)", label: "Paused", pulse: false, icon: "‖" },
  error: { color: "var(--color-status-error)", label: "Error", pulse: false, icon: "⚠" },
  pending: { color: "var(--color-status-pending)", label: "Pending", pulse: true, icon: "○" },
  completed: { color: "var(--color-status-running)", label: "Completed", pulse: false, icon: "✓" },
};

interface StatusPillProps {
  status: StatusKind;
  text?: string;
  /** Marks this pill as reflecting live async state so a screen reader announces changes. */
  live?: boolean;
  className?: string;
}

/**
 * Status pills always pair color with an icon + text label — never color
 * alone — so state reads correctly for color-blind users and screen readers.
 */
export function StatusPill({ status, text, live = false, className }: StatusPillProps) {
  const cfg = CONFIG[status];
  return (
    <span
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
      className={clsx(
        "glass-panel inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-data font-medium",
        className,
      )}
      style={{ borderColor: `color-mix(in srgb, ${cfg.color} 45%, transparent)`, color: cfg.color }}
    >
      <span
        aria-hidden="true"
        className={clsx("inline-block text-[10px] leading-none", cfg.pulse && "animate-pulse")}
      >
        {cfg.icon}
      </span>
      {text ?? cfg.label}
    </span>
  );
}
