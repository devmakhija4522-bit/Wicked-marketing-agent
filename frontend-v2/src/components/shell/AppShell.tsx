import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { JobsTray } from "./JobsTray";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen bg-void text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-void-panel focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to main content
      </a>

      <AmbientBackdrop />

      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      <JobsTray />
    </div>
  );
}
