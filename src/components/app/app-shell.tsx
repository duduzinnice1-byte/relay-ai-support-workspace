"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

import { RelayMark } from "@/components/relay/relay-mark";
import { PageTransition } from "@/components/motion/page-transition";
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
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Move focus into the drawer on open, and back to the trigger on close.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (mobileOpen) closeRef.current?.focus();
    else triggerRef.current?.focus();
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-dvh overflow-y-auto">
          <Sidebar activeOrg={activeOrg} orgs={orgs} />
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="drawer-overlay"
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <motion.div
              key="drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col border-r border-sidebar-border bg-sidebar shadow-xl lg:hidden"
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -16, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex justify-end p-2">
                <Button
                  ref={closeRef}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col" inert={mobileOpen || undefined}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent">
          <Button
            ref={triggerRef}
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

        <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_3%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_3%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]"
          />
          <PageTransition motionKey={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
