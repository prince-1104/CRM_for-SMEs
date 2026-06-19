"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, Bell, ChevronDown, User, Settings, LogOut, ArrowRight, SlidersHorizontal, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Topbar({ className, onMenuClick }: { className?: string; onMenuClick?: () => void }) {
  const { data: session } = useSession();

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 sm:gap-3 border-b bg-card px-3 sm:px-4",
        className
      )}
    >
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search — Invoize style */}
      <div className="flex flex-1 max-w-xl items-center gap-2">
        <div className="relative flex flex-1 items-center rounded-xl border bg-muted/50 px-3 py-2 sm:py-2.5 text-sm text-muted-foreground transition-colors focus-within:bg-background focus-within:text-foreground focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="h-4 w-4 shrink-0 mr-2" />
          <span className="flex-1 truncate hidden sm:inline">Search invoices or clients</span>
          <span className="flex-1 truncate sm:hidden">Search</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/70 hidden sm:block" />
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 hidden sm:flex" aria-label="Filter or sort">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg">
          <Link href="/dashboard/invoices/new" className="inline-flex items-center gap-1 sm:gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Invoice</span>
          </Link>
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" aria-label="Settings" asChild className="hidden sm:flex">
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-1 rounded-full"
              aria-label="User menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-xs font-bold shadow-sm">
                {(session?.user?.name ?? session?.user?.email ?? "U").charAt(0).toUpperCase()}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm md:inline">
                {session?.user?.name ?? session?.user?.email ?? "Account"}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-medium">
              {session?.user?.name ?? "User"}
            </div>
            {session?.user?.email && (
              <div className="px-2 py-0.5 text-xs text-muted-foreground">
                {session.user.email}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
