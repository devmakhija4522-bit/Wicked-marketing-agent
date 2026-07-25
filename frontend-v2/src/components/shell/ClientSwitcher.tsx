import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useClient } from "@/context/ClientContext";
import { hashToHsl } from "@/lib/brandColor";
import { Icon } from "@/components/ui/Icon";

export function ClientSwitcher() {
  const { clients, activeClient, switchClient, loading, error, refreshClients } = useClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) {
    return <div className="h-11 w-44 animate-pulse rounded-xl bg-white/5" />;
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={() => refreshClients()}
        className="glass-panel flex min-h-11 items-center gap-2 rounded-xl border-status-error/40 px-3 text-sm text-status-error"
      >
        <Icon name="power" size={14} />
        Backend unreachable — retry
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={activeClient ? `Active client: ${activeClient.brand_name}. Change client` : "Select a client"}
        className="glass-panel flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink transition-shadow hover:shadow-[var(--shadow-glow-cyan)]"
      >
        {activeClient ? (
          <>
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: hashToHsl(activeClient.id), boxShadow: `0 0 8px ${hashToHsl(activeClient.id)}` }}
            />
            <span className="max-w-[10rem] truncate font-medium">{activeClient.brand_name}</span>
          </>
        ) : (
          <span className="text-ink-dim">Select a client</span>
        )}
        <Icon name="chevronRight" className="rotate-90 text-ink-faint" size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Clients"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass-panel absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl p-1.5"
          >
            {clients.map((client) => {
              const isActive = client.id === activeClient?.id;
              return (
                <li key={client.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      switchClient(client.id);
                      setOpen(false);
                    }}
                    className={clsx(
                      "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm transition-colors",
                      isActive ? "bg-crimson/15 text-ink" : "text-ink-dim hover:bg-white/5 hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: hashToHsl(client.id) }}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{client.brand_name}</span>
                      <span className="truncate text-xs text-ink-faint">{client.category}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
