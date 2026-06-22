import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { getActiveOrganization } from "@/lib/data/organizations";
import { getOrgMembers } from "@/lib/data/members";
import {
  getTicket,
  getTicketComments,
  getTicketEvents,
  getTags,
  type TicketTag,
} from "@/lib/data/tickets";
import { getUser, displayName } from "@/lib/auth";
import { TicketId } from "@/components/relay/ticket-id";
import { StatusBadge } from "@/components/relay/status-badge";
import { PriorityBadge } from "@/components/relay/priority-badge";
import { TicketProperties } from "@/components/tickets/ticket-properties";
import { TicketConversation } from "@/components/tickets/ticket-conversation";
import { HistoryTimeline } from "@/components/tickets/history-timeline";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";

export const metadata: Metadata = { title: "Ticket" };

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const org = await getActiveOrganization();
  if (!org) return null;
  const orgId = org.organization.id;

  const ticket = await getTicket(orgId, id);
  if (!ticket) notFound();

  const [comments, events, members, tags, user] = await Promise.all([
    getTicketComments(id),
    getTicketEvents(id),
    getOrgMembers(orgId),
    getTags(orgId),
    getUser(),
  ]);
  if (!user) return null;

  const authors: Record<string, { name: string; avatarUrl: string | null }> = {};
  const nameById = new Map<string, string>();
  for (const m of members) {
    authors[m.userId] = { name: m.name, avatarUrl: m.avatarUrl };
    nameById.set(m.userId, m.name);
  }

  const me = members.find((m) => m.userId === user.id);
  const currentUser = {
    id: user.id,
    name: me?.name ?? displayName(user),
    avatarUrl: me?.avatarUrl ?? null,
  };

  const attachedTags = ticket.ticket_tags
    .map((tt) => tt.tags)
    .filter((t): t is TicketTag => Boolean(t));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to inbox
      </Link>

      <header className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <TicketId number={ticket.number} />
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.category && (
            <span className="text-xs text-muted-foreground">· {ticket.category}</span>
          )}
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight">
          {ticket.subject}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ticket.customers?.name ?? "No customer"} · opened{" "}
          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          {ticket.body && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="whitespace-pre-wrap text-sm">{ticket.body}</p>
            </div>
          )}
          <TicketConversation
            ticketId={id}
            initialComments={comments}
            authors={authors}
            currentUser={currentUser}
          />
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">
              Properties
            </h2>
            <TicketProperties
              ticketId={id}
              status={ticket.status}
              priority={ticket.priority}
              assigneeId={ticket.assignee_id}
              customerName={ticket.customers?.name ?? null}
              members={members.map((m) => ({ userId: m.userId, name: m.name }))}
              attachedTags={attachedTags}
              allTags={tags}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">
              Activity
            </h2>
            <HistoryTimeline events={events} nameById={nameById} />
          </section>
        </aside>
      </div>

      <RealtimeRefresh
        channel={`ticket-${id}`}
        subscriptions={[
          { table: "ticket_comments", filter: `ticket_id=eq.${id}` },
          { table: "ticket_events", filter: `ticket_id=eq.${id}` },
          { table: "tickets", filter: `id=eq.${id}` },
        ]}
      />
    </div>
  );
}
