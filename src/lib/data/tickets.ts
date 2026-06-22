import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import type { TicketStatus, TicketPriority } from "@/lib/domain";

export type TicketTag = { id: string; name: string; color: string | null };

export type TicketListItem = Pick<
  Tables<"tickets">,
  | "id"
  | "number"
  | "subject"
  | "status"
  | "priority"
  | "category"
  | "assignee_id"
  | "customer_id"
  | "created_at"
  | "updated_at"
> & {
  customers: { id: string; name: string } | null;
  ticket_tags: { tags: TicketTag | null }[];
};

export type TicketDetail = Tables<"tickets"> & {
  customers: { id: string; name: string; email: string | null } | null;
  ticket_tags: { tags: TicketTag | null }[];
};

export type TicketComment = Tables<"ticket_comments">;
export type TicketEvent = Tables<"ticket_events">;

export type TicketFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string; // user id or "unassigned"
  tag?: string; // tag id
  q?: string;
  sort?: "newest" | "oldest" | "priority";
};

export async function listTickets(
  orgId: string,
  filters: TicketFilters = {},
): Promise<TicketListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("tickets")
    .select(
      "id, number, subject, status, priority, category, assignee_id, customer_id, created_at, updated_at, customers(id, name), ticket_tags(tags(id, name, color))",
    )
    .eq("organization_id", orgId);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.assignee === "unassigned") query = query.is("assignee_id", null);
  else if (filters.assignee) query = query.eq("assignee_id", filters.assignee);
  if (filters.q) query = query.ilike("subject", `%${filters.q}%`);

  if (filters.sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (filters.sort === "priority")
    query = query.order("priority", { ascending: false }).order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(100).returns<TicketListItem[]>();
  if (error || !data) return [];

  // Tag filter is applied here to avoid PostgREST inner-join filter complexity.
  if (filters.tag) {
    return data.filter((t) =>
      t.ticket_tags.some((tt) => tt.tags?.id === filters.tag),
    );
  }
  return data;
}

export async function getStatusCounts(
  orgId: string,
): Promise<Record<TicketStatus, number> & { all: number }> {
  const supabase = await createClient();
  const base = () =>
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

  // Exact counts regardless of volume (no client-side row cap).
  const [all, open, pending, onHold, resolved, closed] = await Promise.all([
    base(),
    base().eq("status", "open"),
    base().eq("status", "pending"),
    base().eq("status", "on_hold"),
    base().eq("status", "resolved"),
    base().eq("status", "closed"),
  ]);

  return {
    all: all.count ?? 0,
    open: open.count ?? 0,
    pending: pending.count ?? 0,
    on_hold: onHold.count ?? 0,
    resolved: resolved.count ?? 0,
    closed: closed.count ?? 0,
  };
}

export async function getTicket(
  orgId: string,
  ticketId: string,
): Promise<TicketDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "*, customers(id, name, email), ticket_tags(tags(id, name, color))",
    )
    .eq("organization_id", orgId)
    .eq("id", ticketId)
    .maybeSingle<TicketDetail>();

  if (error) return null;
  return data;
}

export async function getTicketComments(
  ticketId: string,
): Promise<TicketComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getTicketEvents(
  ticketId: string,
): Promise<TicketEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ticket_events")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getTags(orgId: string): Promise<TicketTag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id, name, color")
    .eq("organization_id", orgId)
    .order("name");
  return data ?? [];
}

export async function getCustomers(
  orgId: string,
): Promise<{ id: string; name: string; email: string | null; created_at: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, email, created_at")
    .eq("organization_id", orgId)
    .order("name");
  return data ?? [];
}
