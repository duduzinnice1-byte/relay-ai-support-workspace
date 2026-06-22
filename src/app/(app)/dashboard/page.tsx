import type { Metadata } from "next";
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
import {
  getActiveOrganization,
  getDashboardStats,
} from "@/lib/data/organizations";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const SoonTag = () => (
  <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide opacity-70 dark:bg-white/10">
    Soon
  </span>
);

export default async function DashboardPage() {
  const [org, user] = await Promise.all([getActiveOrganization(), getUser()]);
  if (!org || !user) return null;

  const stats = await getDashboardStats(org.organization.id);
  const name = displayName(user);

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
        <Button disabled className="gap-2 self-start">
          <Ticket />
          New ticket
          <SoonTag />
        </Button>
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
          value="—"
          hint="No data yet"
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
              last 30 days
            </span>
          </div>
          <div className="p-5">
            <EmptyState
              icon={BarChart3}
              title="No tickets yet"
              description="Once conversations start arriving, you'll see how volume breaks down by category here."
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="font-display text-base font-semibold tracking-tight">
              Your team
            </h2>
            <span
              data-signal
              className="font-mono text-xs text-muted-foreground"
            >
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
            <Button variant="outline" size="sm" disabled className="w-full gap-2">
              <UserPlus />
              Invite teammates
              <SoonTag />
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Inbox
          </h2>
        </div>
        <div className="p-5">
          <EmptyState
            icon={Inbox}
            title="Your queue is empty"
            description="When customers reach out, their tickets land here — triage, assign and resolve them with an AI copilot at your side."
            action={
              <Button variant="outline" disabled className="gap-2">
                Connect a channel
                <SoonTag />
              </Button>
            }
          />
        </div>
      </section>
    </div>
  );
}
