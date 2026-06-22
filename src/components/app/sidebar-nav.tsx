"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  ready: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/inbox", label: "Inbox", icon: Inbox, ready: false },
  { href: "/customers", label: "Customers", icon: Users, ready: false },
  { href: "/team", label: "Team", icon: UsersRound, ready: false },
  { href: "/reports", label: "Reports", icon: BarChart3, ready: false },
  { href: "/settings", label: "Settings", icon: Settings, ready: false },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
      {NAV.map(({ href, label, icon: Icon, ready }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        if (!ready) {
          return (
            <span
              key={href}
              aria-disabled
              className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground/60"
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                Soon
              </span>
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-brand-strong" : "text-muted-foreground",
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
