import { cache } from "react";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { Tables, Database } from "@/lib/database.types";

export type Organization = Tables<"organizations">;
export type UserRole = Database["public"]["Enums"]["user_role"];
export type OrgMembership = { role: UserRole; organization: Organization };

export const ACTIVE_ORG_COOKIE = "relay.active_org";

/** All organizations the current user belongs to, with their role in each. */
export const getUserOrganizations = cache(async (): Promise<OrgMembership[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(*)")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data
    .filter((row): row is typeof row & { organizations: Organization } =>
      Boolean(row.organizations),
    )
    .map((row) => ({ role: row.role, organization: row.organizations }));
});

/**
 * The membership the user is currently acting under. Honors the active-org
 * cookie when it points at a real membership, otherwise the first org.
 */
export async function getActiveOrganization(): Promise<OrgMembership | null> {
  const memberships = await getUserOrganizations();
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  return (
    memberships.find((m) => m.organization.id === activeId) ?? memberships[0]
  );
}

export type DashboardStats = {
  openTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  customers: number;
  members: number;
};

/** Headline counts for the dashboard, scoped to one organization (RLS-safe). */
export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const [open, pending, resolved, customers, members] = await Promise.all([
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "open"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["resolved", "closed"]),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  return {
    openTickets: open.count ?? 0,
    pendingTickets: pending.count ?? 0,
    resolvedTickets: resolved.count ?? 0,
    customers: customers.count ?? 0,
    members: members.count ?? 0,
  };
}
