import Link from "next/link";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Inbox,
  Ticket,
  Timer,
  UserPlus,
} from "lucide-react";

import { getUser, displayName } from "@/lib/auth";
import { ticketRef } from "@/lib/domain";
import {
  getActiveOrganization,
  getDashboardStats,
} from "@/lib/data/organizations";
import {
  getAvgFirstResponseMinutes,
  getVolumeByCategory,
  getRecentActivity,
} from "@/lib/data/dashboard";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/empty-state";
import { SeedButton } from "@/components/app/seed-button";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default async function DashboardPage() {
  const [org, user] = await Promise.all([getActiveOrganization(), getUser()]);
  if (!org || !user) return null;
  const orgId = org.organization.id;

  const [stats, avgMinutes, volume, activity] = await Promise.all([
    getDashboardStats(orgId),
    getAvgFirstResponseMinutes(orgId),
    getVolumeByCategory(orgId),
    getRecentActivity(orgId),
  ]);

  const name = displayName(user);
  const totalTickets =
    stats.openTickets + stats.pendingTickets + stats.resolvedTickets;
  const isEmpty = totalTickets === 0;
  const maxVolume = Math.max(...volume.map((v) => v.count), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {greeting()}, {name}.
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in{" "}
            <span className="font-medium text-foreground">
              {org.organization.name}
            </span>
            .
          </p>
        </div>
        <div className="flex gap-2 self-start">
          {isEmpty && org.role === "admin" && <SeedButton />}
          <Button asChild className="gap-2">
            <Link href="/inbox">
              <Inbox className="size-4" />
              Open inbox
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open tickets"
          value={String(stats.openTickets)}
          hint="Awaiting first response"
          icon={Ticket}
          accent="var(--status-open)"
        />
        <StatCard
          label="Pending"
          value={String(stats.pendingTickets)}
          hint="Waiting on the customer"
          icon={Clock}
        />
        <StatCard
          label="Resolved"
          value={String(stats.resolvedTickets)}
          hint="Closed or resolved"
          icon={CheckCircle2}
          accent="var(--status-resolved)"
        />
        <StatCard
          label="Avg. first response"
          value={formatDuration(avgMinutes)}
          hint={avgMinutes == null ? "No data yet" : "Across replied tickets"}
          icon={Timer}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="font-display text-base font-semibold tracking-tight">
              Volume by category
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              {totalTickets} tickets
            </span>
          </div>
          <div className="p-5">
            {volume.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No tickets yet"
                description="Once conversations start arriving, you'll see how volume breaks down by category here."
              />
            ) : (
              <div className="space-y-3">
                {volume.map((v) => (
                  <div key={v.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{v.category}</span>
                      <span
                        data-signal
                        className="font-mono text-xs text-muted-foreground"
                      >
                        {v.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(v.count / maxVolume) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="font-display text-base font-semibold tracking-tight">
              Your team
            </h2>
            <span data-signal className="font-mono text-xs text-muted-foreground">
              {stats.members} member{stats.members === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <Avatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">You</p>
              </div>
              <span className="inline-flex items-center rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-brand-strong">
                {org.role}
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full gap-2">
              <Link href="/team">
                <UserPlus className="size-4" />
                Manage team
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Recent activity
          </h2>
        </div>
        <div className="p-5">
          {activity.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nothing here yet"
              description="As your team triages and replies to tickets, the latest activity shows up here."
            />
          ) : (
            <ul className="space-y-2.5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-border" />
                  <span className="min-w-0 flex-1 truncate">{a.description}</span>
                  {a.ticketNumber != null && (
                    <Link
                      href={`/inbox/${a.ticketId}`}
                      className="shrink-0 font-mono text-xs text-brand-strong hover:underline"
                    >
                      {ticketRef(a.ticketNumber)}
                    </Link>
                  )}
                  <time
                    className="shrink-0 font-mono text-[11px] text-muted-foreground"
                    dateTime={a.createdAt}
                  >
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
