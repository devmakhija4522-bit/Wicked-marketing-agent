import { Icon } from "@/components/ui/Icon";
import { ClientSwitcher } from "./ClientSwitcher";
import { JobsTrayToggle } from "./JobsTray";

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  return (
    <header className="glass-panel sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-dim hover:text-ink md:hidden"
      >
        <Icon name="menu" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        <JobsTrayToggle />
        <ClientSwitcher />
      </div>
    </header>
  );
}
