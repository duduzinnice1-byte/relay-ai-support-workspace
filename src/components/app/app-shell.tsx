"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { RelayMark } from "@/components/relay/relay-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";
import { SidebarNav } from "./sidebar-nav";
import type { ShellOrg, ShellUser } from "./types";

function Sidebar({
  activeOrg,
  orgs,
  onNavigate,
}: {
  activeOrg: ShellOrg;
  orgs: ShellOrg[];
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-4 bg-sidebar p-3">
      <div className="flex items-center gap-2 px-1 pt-1">
        <RelayMark className="size-6 text-primary" />
        <span className="font-display text-base font-semibold tracking-tight">
          Relay
        </span>
      </div>
      <OrgSwitcher activeOrg={activeOrg} orgs={orgs} />
      <div className="px-1">
        <SidebarNav onNavigate={onNavigate} />
      </div>
      <div className="mt-auto rounded-lg border border-sidebar-border bg-card p-3">
        <p className="text-xs font-medium">Free plan</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Billing &amp; limits arrive with the Stripe milestone.
        </p>
      </div>
    </div>
  );
}

export function AppShell({
  activeOrg,
  orgs,
  user,
  role,
  children,
}: {
  activeOrg: ShellOrg;
  orgs: ShellOrg[];
  user: ShellUser;
  role: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-dvh overflow-y-auto">
          <Sidebar activeOrg={activeOrg} orgs={orgs} />
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Sidebar
                activeOrg={activeOrg}
                orgs={orgs}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
          <UserMenu user={user} role={role} />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
