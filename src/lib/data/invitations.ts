import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/data/organizations";

export type Invitation = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
};

/** Pending (not yet accepted) invitations for an organization. */
export async function getPendingInvitations(
  orgId: string,
): Promise<Invitation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select("id, email, role, created_at")
    .eq("organization_id", orgId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}
