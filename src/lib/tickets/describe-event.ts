import { STATUS_META, PRIORITY_META } from "@/lib/domain";
import type { Json } from "@/lib/database.types";

type EventLike = { type: string; actor_id: string | null; data: Json };

function statusLabel(v: unknown): string {
  return STATUS_META[v as keyof typeof STATUS_META]?.label ?? String(v ?? "");
}
function priorityLabel(v: unknown): string {
  return PRIORITY_META[v as keyof typeof PRIORITY_META]?.label ?? String(v ?? "");
}

/** Human-readable description of a ticket event, shared by the history
 * timeline and the dashboard activity feed. */
export function describeEvent(
  event: EventLike,
  nameById: Map<string, string>,
): string {
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
    case "tagged":
      return `${actor} added a tag`;
    case "untagged":
      return `${actor} removed a tag`;
    default:
      return `${actor} updated the ticket`;
  }
}
