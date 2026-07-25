import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useEffect } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: "Overview", items: [{ to: "/", label: "Dashboard", icon: "grid" }] },
  {
    label: "Content",
    items: [
      { to: "/voice", label: "Voice Sample", icon: "mic" },
      { to: "/instagram-script", label: "Instagram Script Studio", icon: "clapper" },
    ],
  },
  { label: "Growth", items: [{ to: "/analytics", label: "Analytics", icon: "chart" }] },
  {
    label: "System",
    items: [
      { to: "/settings", label: "Brand & Settings", icon: "settings" },
      { to: "/clients", label: "Clients", icon: "users" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {mobileOpen && (
        // Pointer-only dismiss surface — not a tab stop. The real close
        // affordance is the X button below (and Escape), so this stays out
        // of the AT tree instead of duplicating that button's label.
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={clsx(
          "glass-panel z-50 flex flex-col border-y-0 border-l-0 transition-[width,transform] duration-300",
          "fixed inset-y-0 left-0 w-72 rounded-none md:sticky md:top-0 md:h-screen md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-20" : "md:w-64",
        )}
      >
        <div className="flex items-center justify-between px-4 py-5">
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-wide text-ink">
              WICKED
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-dim transition-colors hover:text-cyan md:flex"
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} />
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-dim md:hidden"
          >
            <Icon name="x" />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              {!collapsed && (
                <h2 className="mb-2 px-3 font-data text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  {group.label}
                </h2>
              )}
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        clsx(
                          "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-data transition-colors",
                          isActive ? "text-ink" : "text-ink-dim hover:text-ink",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="nav-active-pill"
                              className="absolute inset-0 rounded-xl border border-crimson/40 bg-crimson/15"
                              style={{ boxShadow: "var(--shadow-glow-crimson)" }}
                              transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            />
                          )}
                          <span className="relative z-10 flex shrink-0 items-center justify-center">
                            <Icon name={item.icon} />
                          </span>
                          <span className={clsx("relative z-10 truncate", collapsed && "sr-only")}>
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
