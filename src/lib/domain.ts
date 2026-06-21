/**
 * Shared domain vocabulary for tickets, priorities and roles.
 * Kept framework-agnostic so the DB schema, API validation (Zod) and UI all
 * speak the same language. CSS var names map each value to a design token.
 */

export const TICKET_STATUSES = [
  "open",
  "pending",
  "on_hold",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const USER_ROLES = ["admin", "manager", "agent"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const STATUS_META: Record<
  TicketStatus,
  { label: string; varName: string }
> = {
  open: { label: "Open", varName: "--status-open" },
  pending: { label: "Pending", varName: "--status-pending" },
  on_hold: { label: "On hold", varName: "--status-hold" },
  resolved: { label: "Resolved", varName: "--status-resolved" },
  closed: { label: "Closed", varName: "--status-closed" },
};

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; varName: string; level: 1 | 2 | 3 | 4 }
> = {
  low: { label: "Low", varName: "--priority-low", level: 1 },
  normal: { label: "Normal", varName: "--priority-normal", level: 2 },
  high: { label: "High", varName: "--priority-high", level: 3 },
  urgent: { label: "Urgent", varName: "--priority-urgent", level: 4 },
};

export const ROLE_META: Record<UserRole, { label: string; blurb: string }> = {
  admin: { label: "Admin", blurb: "Full access, billing and workspace settings" },
  manager: { label: "Manager", blurb: "Manages the team, assigns and reports" },
  agent: { label: "Agent", blurb: "Works the queue, replies to customers" },
};

/** Display a ticket's public reference, e.g. 1042 -> "RLY-1042". */
export function ticketRef(num: number): string {
  return `RLY-${num}`;
}
