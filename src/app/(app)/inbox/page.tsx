import type { Metadata } from "next";
import { Inbox as InboxIcon } from "lucide-react";

import { getActiveOrganization } from "@/lib/data/organizations";
import { getOrgMembers } from "@/lib/data/members";
import {
  listTickets,
  getStatusCounts,
  getTags,
  getCustomers,
  type TicketFilters,
} from "@/lib/data/tickets";
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/domain";
import { FilterBar } from "@/components/tickets/filter-bar";
import { TicketRow } from "@/components/tickets/ticket-row";
import { NewTicketDialog } from "@/components/tickets/new-ticket-dialog";
import { EmptyState } from "@/components/app/empty-state";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";

export const metadata: Metadata = { title: "Inbox" };

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseFilters(sp: SearchParams): TicketFilters {
  const status = str(sp.status);
  const priority = str(sp.priority);
  const sort = str(sp.sort);
  return {
    status: TICKET_STATUSES.includes(status as TicketStatus)
      ? (status as TicketStatus)
      : undefined,
    priority: TICKET_PRIORITIES.includes(priority as TicketPriority)
      ? (priority as TicketPriority)
      : undefined,
    assignee: str(sp.assignee),
    tag: str(sp.tag),
    q: str(sp.q),
    sort:
      sort === "oldest" || sort === "priority" ? sort : "newest",
  };
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const org = await getActiveOrganization();
  if (!org) return null;
  const orgId = org.organization.id;

  const filters = parseFilters(await searchParams);

  const [tickets, counts, members, tags, customers] = await Promise.all([
    listTickets(orgId, filters),
    getStatusCounts(orgId),
    getOrgMembers(orgId),
    getTags(orgId),
    getCustomers(orgId),
  ]);

  const memberMap = new Map(members.map((m) => [m.userId, m]));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            {counts.open} open · {counts.all} total
          </p>
        </div>
        <NewTicketDialog customers={customers} />
      </header>

      <FilterBar
        counts={counts}
        members={members.map((m) => ({ userId: m.userId, name: m.name }))}
        tags={tags}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {tickets.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={InboxIcon}
              title="No tickets here"
              description="Nothing matches these filters yet. Create a ticket or clear the filters to see the full queue."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((t) => (
              <li key={t.id}>
                <TicketRow
                  ticket={t}
                  assignee={
                    t.assignee_id ? memberMap.get(t.assignee_id) ?? null : null
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <RealtimeRefresh
        channel={`inbox-${orgId}`}
        subscriptions={[
          { table: "tickets", filter: `organization_id=eq.${orgId}` },
        ]}
      />
    </div>
  );
}
