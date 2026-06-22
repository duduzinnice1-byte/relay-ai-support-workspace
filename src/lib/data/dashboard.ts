import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/data/members";
import { describeEvent } from "@/lib/tickets/describe-event";

export async function getAvgFirstResponseMinutes(
  orgId: string,
): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("created_at, first_response_at")
    .eq("organization_id", orgId)
    .not("first_response_at", "is", null)
    .limit(500);

  if (!data || data.length === 0) return null;

  let total = 0;
  let n = 0;
  for (const t of data) {
    if (t.first_response_at) {
      total += new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime();
      n += 1;
    }
  }
  if (n === 0) return null;
  return Math.round(total / n / 60_000);
}

export async function getVolumeByCategory(
  orgId: string,
): Promise<{ category: string; count: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("category")
    .eq("organization_id", orgId)
    .limit(2000);

  const map = new Map<string, number>();
  for (const t of data ?? []) {
    const c = t.category?.trim() || "Uncategorized";
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export type RecentActivity = {
  id: string;
  description: string;
  ticketId: string;
  ticketNumber: number | null;
  createdAt: string;
};

export async function getRecentActivity(
  orgId: string,
): Promise<RecentActivity[]> {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("ticket_events")
    .select("id, type, data, created_at, actor_id, ticket_id")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (!events?.length) return [];

  const ticketIds = [...new Set(events.map((e) => e.ticket_id))];
  const [{ data: tks }, members] = await Promise.all([
    supabase.from("tickets").select("id, number").in("id", ticketIds),
    getOrgMembers(orgId),
  ]);
  const numById = new Map((tks ?? []).map((t) => [t.id, t.number]));
  const nameById = new Map(members.map((m) => [m.userId, m.name]));

  return events.map((e) => ({
    id: e.id,
    description: describeEvent(e, nameById),
    ticketId: e.ticket_id,
    ticketNumber: numById.get(e.ticket_id) ?? null,
    createdAt: e.created_at,
  }));
}
