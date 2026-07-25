import { GlassPanel } from "@/components/ui/GlassPanel";
import { Icon, type IconName } from "@/components/ui/Icon";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: IconName;
}

/** On-brand placeholder for screens landing in Phase 2 — every sidebar route resolves to something, never a dead link. */
export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GlassPanel tilt={false} glow="violet" className="max-w-md p-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet/10 text-violet">
          <Icon name={icon} size={28} />
        </span>
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-dim">{description}</p>
        <p className="mt-4 text-xs uppercase tracking-wider text-ink-faint">Phase 2 — coming online next</p>
      </GlassPanel>
    </div>
  );
}
