import { formatDistanceToNow } from "date-fns";

import { STATUS_META, PRIORITY_META } from "@/lib/domain";
import type { TicketEvent } from "@/lib/data/tickets";

function statusLabel(v: unknown): string {
  return STATUS_META[v as keyof typeof STATUS_META]?.label ?? String(v ?? "");
}
function priorityLabel(v: unknown): string {
  return PRIORITY_META[v as keyof typeof PRIORITY_META]?.label ?? String(v ?? "");
}

function describe(event: TicketEvent, nameById: Map<string, string>): string {
  const actor = event.actor_id ? nameById.get(event.actor_id) ?? "Someone" : "System";
  const data = (event.data ?? {}) as Record<string, unknown>;

  switch (event.type) {
    case "created":
      return `${actor} created the ticket`;
    case "status_changed":
      return `${actor} moved status from ${statusLabel(data.from)} to ${statusLabel(data.to)}`;
    case "priority_changed":
      return `${actor} set priority to ${priorityLabel(data.to)}`;
    case "assigned":
      return `${actor} assigned this to ${
        typeof data.to === "string" ? nameById.get(data.to) ?? "a teammate" : "a teammate"
      }`;
    case "unassigned":
      return `${actor} unassigned this ticket`;
    case "commented":
      return `${actor} ${data.internal ? "added an internal note" : "replied to the customer"}`;
    default:
      return `${actor} updated the ticket`;
  }
}

export function HistoryTimeline({
  events,
  nameById,
}: {
  events: TicketEvent[];
  nameById: Map<string, string>;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3 text-sm">
          <span
            aria-hidden
            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border"
          />
          <div className="min-w-0">
            <p className="text-foreground">{describe(event, nameById)}</p>
            <time
              data-signal
              className="font-mono text-[11px] text-muted-foreground"
              dateTime={event.created_at}
            >
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
