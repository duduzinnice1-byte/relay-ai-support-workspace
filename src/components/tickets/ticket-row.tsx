import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { TicketId } from "@/components/relay/ticket-id";
import { StatusBadge } from "@/components/relay/status-badge";
import { PriorityBadge } from "@/components/relay/priority-badge";
import { Avatar } from "@/components/ui/avatar";
import { TagChip } from "@/components/tickets/tag-chip";
import type { TicketListItem } from "@/lib/data/tickets";

export function TicketRow({
  ticket,
  assignee,
}: {
  ticket: TicketListItem;
  assignee: { name: string; avatarUrl: string | null } | null;
}) {
  const tags = ticket.ticket_tags
    .map((tt) => tt.tags)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <Link
      href={`/inbox/${ticket.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
    >
      <PriorityBadge priority={ticket.priority} withLabel={false} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <TicketId number={ticket.number} />
          <StatusBadge status={ticket.status} />
          {tags.map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
        </div>
        <p className="mt-0.5 truncate text-sm font-medium">{ticket.subject}</p>
        <p className="truncate text-xs text-muted-foreground">
          {ticket.customers?.name ?? "No customer"}
          {ticket.category ? ` · ${ticket.category}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {assignee ? (
          <Avatar name={assignee.name} src={assignee.avatarUrl} className="size-6" />
        ) : (
          <span className="text-[11px] text-muted-foreground">Unassigned</span>
        )}
        <span data-signal className="font-mono text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
