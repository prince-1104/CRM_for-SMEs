"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { Topbar } from "./topbar";
import { useUIStore } from "@/stores/ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  // Close mobile drawer on route change (resize)
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // On mobile, auto-collapse sidebar state
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static, mobile: slide-over drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <DashboardSidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-content w-full p-3 sm:p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
