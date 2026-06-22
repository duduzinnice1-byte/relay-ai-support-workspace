import { formatDistanceToNow } from "date-fns";

import { describeEvent } from "@/lib/tickets/describe-event";
import type { TicketEvent } from "@/lib/data/tickets";

export function HistoryTimeline({
  events,
  nameById,
}: {
  events: TicketEvent[];
  nameById: Map<string, string>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3 text-sm">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
          <div className="min-w-0">
            <p className="text-foreground">{describeEvent(event, nameById)}</p>
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
