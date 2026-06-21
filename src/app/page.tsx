import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RelayMark } from "@/components/relay/relay-mark";
import { TicketId } from "@/components/relay/ticket-id";
import { StatusBadge } from "@/components/relay/status-badge";
import { PriorityBadge } from "@/components/relay/priority-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import type { TicketStatus, TicketPriority } from "@/lib/domain";

const previewRows: {
  number: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  sla: string;
}[] = [
  {
    number: 2041,
    subject: "Webhook retries spiking after the 4.2 deploy",
    status: "open",
    priority: "urgent",
    sla: "00:12:48",
  },
  {
    number: 2038,
    subject: "Refund isn't reflected on the latest invoice",
    status: "pending",
    priority: "high",
    sla: "01:47:10",
  },
  {
    number: 2033,
    subject: "SSO login loops on mobile Safari",
    status: "open",
    priority: "normal",
    sla: "03:20:55",
  },
  {
    number: 2027,
    subject: "CSV export is missing the tax columns",
    status: "resolved",
    priority: "low",
    sla: "—",
  },
];

const capabilities = [
  "Realtime queue",
  "Roles & permissions",
  "AI copilot",
  "Full audit trail",
];

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Ambient: faint signal grid + a single warm beacon glow (no template gradient) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_4%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_4%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full opacity-50 blur-3xl [background:radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_30%,transparent),transparent)]"
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <RelayMark className="size-6 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Relay
          </span>
        </div>
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Start free</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <section className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            AI copilot built into the queue
          </span>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Run support like an
            <br />
            operations desk.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            Relay turns a noisy inbox into a calm, fast queue. Triage, assign and
            resolve — while an AI copilot drafts the first reply, suggests tags,
            and summarizes long threads so your team never reads the same
            conversation twice.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start free <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Open the demo workspace</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {capabilities.map((c) => (
              <span
                key={c}
                className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Console preview — the signature: monospaced signal readouts */}
        <section className="lg:justify-self-end">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-status-open" />
                <span className="text-sm font-medium">Live queue</span>
              </div>
              <span
                data-signal
                className="font-mono text-xs text-muted-foreground"
              >
                4 open · SLA on track
              </span>
            </div>
            <ul className="divide-y divide-border">
              {previewRows.map((row) => (
                <li
                  key={row.number}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60"
                >
                  <PriorityBadge priority={row.priority} withLabel={false} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <TicketId number={row.number} />
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="mt-0.5 truncate text-sm">{row.subject}</p>
                  </div>
                  <span
                    data-signal
                    className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground"
                  >
                    <Clock className="size-3" />
                    {row.sla}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 border-t border-border bg-secondary/40 px-4 py-3">
              <Sparkles className="size-4 text-primary" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Copilot</span>{" "}
                drafted a reply for{" "}
                <span className="font-mono text-foreground">RLY-2041</span> —
                ready to review.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8">
        <Separator className="mb-6" />
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Relay — AI Support Workspace</span>
          <span className="font-mono">
            Portfolio-grade demo · built with Next.js
          </span>
        </div>
      </footer>
    </div>
  );
}
