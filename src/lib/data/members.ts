import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/data/organizations";

export type OrgMember = {
  userId: string;
  role: UserRole;
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

/** Members of an organization with their profile, joined in app code
 * (organization_members.user_id and profiles.id both point at auth.users,
 * so PostgREST can't embed them directly). */
export const getOrgMembers = cache(async (orgId: string): Promise<OrgMember[]> => {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (!members?.length) return [];

  const ids = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", ids);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => {
    const p = byId.get(m.user_id);
    return {
      userId: m.user_id,
      role: m.role,
      name: p?.full_name || p?.email?.split("@")[0] || "Member",
      email: p?.email ?? null,
      avatarUrl: p?.avatar_url ?? null,
    };
  });
});
