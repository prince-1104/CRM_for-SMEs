"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  FileCheck,
  Settings,
  BarChart3,
  CreditCard,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUIStore } from "@/stores/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/clients", label: "Clients", icon: Users, hasDropdown: true },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, badge: 120 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/help", label: "Help", icon: HelpCircle },
];

const secondaryNav = [
  { href: "/dashboard/quotations", label: "Quotations", icon: FileCheck },
  { href: "/dashboard/catalogue", label: "Products / Catalogue", icon: Package },
];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[52px] lg:w-[52px]" : "w-64 lg:w-56"
      )}
    >
      {/* Logo + collapse */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 border-sidebar-accent/20 border-b">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold text-sidebar-foreground"
            onClick={onNavigate}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25">
              S
            </span>
            <span className="text-base tracking-tight">Star Uniform</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/10 hidden lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-0.5">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          const content = (
            <>
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.hasDropdown && <ChevronDown className="h-3.5 w-3.5 text-sidebar-muted" />}
                  {item.badge != null && (
                    <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </>
          );

          if (item.hasDropdown && !collapsed) {
            return (
              <DropdownMenu key={item.href}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-emerald-500/20"
                        : "text-sidebar-muted hover:bg-white/8 hover:text-sidebar-foreground"
                    )}
                  >
                    {content}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={item.href} onClick={onNavigate}>View clients</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/clients/new" onClick={onNavigate}>Add client</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href === "/dashboard/help" ? "/dashboard/settings" : item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                collapsed && "justify-center px-2",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-emerald-500/20"
                  : "text-sidebar-muted hover:bg-white/8 hover:text-sidebar-foreground"
              )}
              title={collapsed ? item.label : undefined}
              onClick={onNavigate}
            >
              {content}
            </Link>
          );
        })}

        <div className="my-3 h-px bg-white/10" />

        {secondaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
              collapsed && "justify-center px-2",
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-emerald-500/20"
                : "text-sidebar-muted hover:bg-white/8 hover:text-sidebar-foreground"
            )}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom: theme + log out */}
      <div className="border-t border-white/10 p-2 lg:p-3 space-y-0.5">
        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-between px-2 py-1")}>
          {!collapsed && <span className="text-xs text-sidebar-muted">Theme</span>}
          <ThemeToggle variant="ghost" size="icon" className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/10" />
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2.5 text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground",
            collapsed && "w-9 justify-center px-0"
          )}
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Log out"}
        </Button>
      </div>
    </aside>
  );
}
