import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CountUp } from "@/components/ui/CountUp";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useClient } from "@/context/ClientContext";
import { useJobs } from "@/context/JobsContext";
import * as api from "@/lib/api";
import { staggerContainer, fadeIn } from "@/lib/motion";
import type { StatsResponse } from "@/lib/types";

interface ActionCard {
  to: string;
  title: string;
  description: string;
  icon: IconName;
  glow: "crimson" | "cyan" | "violet";
}

const ACTION_CARDS: ActionCard[] = [
  { to: "/voice", title: "Voice Sample", description: "Tune the three narrative mechanics and grow the reference-reel library.", icon: "mic", glow: "violet" },
  { to: "/instagram-script", title: "Instagram Script Studio", description: "Turn the latest Apple news into a Reel script, one click at a time.", icon: "clapper", glow: "crimson" },
  { to: "/clients", title: "Clients", description: "Manage the agency's roster of brand accounts.", icon: "users", glow: "cyan" },
  { to: "/analytics", title: "Analytics", description: "Track views, likes, and comments across platforms.", icon: "chart", glow: "cyan" },
];

const STATS: { key: keyof StatsResponse; label: string }[] = [
  { key: "totalScripts", label: "Scripts generated" },
  { key: "trendsScanned", label: "Trends scanned" },
  { key: "avgBrandScore", label: "Avg. brand score" },
  { key: "activePipelines", label: "Active pipelines" },
];

function ActivityFeed() {
  const { jobs } = useJobs();

  const entries = jobs
    .map((j) => ({
      timestamp: j.created_at,
      text: `[job ${j.job_id}] ${j.label} — ${j.status}`,
      tone: j.status === "failed" ? "error" : j.status === "completed" ? "ok" : "dim",
    }))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  return (
    <GlassPanel className="p-5" glow="cyan">
      <h2 className="mb-3 font-display text-sm font-semibold text-ink">System Log</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-ink-dim">Nothing logged yet — analyze a reference reel in Voice Sample to see activity here.</p>
      ) : (
        <ul className="flex flex-col gap-2 font-mono text-xs">
          {entries.map((e, i) => (
            <li key={i} className="flex gap-3 text-ink-dim">
              <span className="shrink-0 text-ink-faint">
                {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span
                className={
                  e.tone === "error" ? "text-status-error" : e.tone === "ok" ? "text-status-running" : "text-ink-dim"
                }
              >
                {e.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

function UspTicker() {
  const { activeClient } = useClient();

  if (!activeClient) {
    return (
      <GlassPanel className="px-5 py-3 text-sm text-ink-dim" tilt={false}>
        Select a client to see their brand USPs.
      </GlassPanel>
    );
  }

  const usps = (activeClient.usps ?? []).filter((u): u is string => typeof u === "string");

  // Real client records rarely have structured usps — fall back to the tagline as a single static line.
  if (usps.length === 0) {
    return (
      <GlassPanel className="px-5 py-3 text-sm text-ink-dim" tilt={false}>
        {activeClient.tagline || "No brand USPs on file for this client yet."}
      </GlassPanel>
    );
  }

  const loop = [...usps, ...usps];

  return (
    <GlassPanel className="overflow-hidden px-0 py-3" tilt={false} glow="crimson">
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap px-5 font-data text-sm text-ink-dim"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((usp, i) => (
          <span key={i} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-crimson">
              ✦
            </span>
            {usp}
          </span>
        ))}
      </motion.div>
    </GlassPanel>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { activeClient } = useClient();
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col gap-6">
      <motion.div variants={fadeIn}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Command Deck{activeClient ? ` — ${activeClient.brand_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink-dim">
          {activeClient ? activeClient.tagline : "Select a client to bring the fleet online."}
        </p>
      </motion.div>

      <UspTicker />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {STATS.map((stat) => (
          <GlassPanel key={stat.key} className="p-4" tilt={false} glow="none">
            <p className="font-display text-2xl font-bold text-ink sm:text-3xl">
              {stats ? <CountUp value={stats[stat.key]} /> : "—"}
            </p>
            <p className="mt-1 text-xs text-ink-dim">{stat.label}</p>
          </GlassPanel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACTION_CARDS.map((card) => (
          <GlassPanel
            key={card.to}
            as="button"
            glow={card.glow}
            onClick={() => navigate(card.to)}
            className="flex flex-col items-start gap-3 p-5"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background:
                  card.glow === "crimson"
                    ? "rgba(233,69,96,0.15)"
                    : card.glow === "cyan"
                      ? "rgba(78,225,255,0.15)"
                      : "rgba(157,107,255,0.15)",
                color: card.glow === "crimson" ? "var(--color-crimson)" : card.glow === "cyan" ? "var(--color-cyan)" : "var(--color-violet)",
              }}
            >
              <Icon name={card.icon} size={22} />
            </span>
            <span className="font-display text-base font-semibold text-ink">{card.title}</span>
            <span className="text-sm text-ink-dim">{card.description}</span>
          </GlassPanel>
        ))}
      </div>

      <ActivityFeed />
    </motion.div>
  );
}
