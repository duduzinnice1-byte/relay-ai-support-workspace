"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/data/organizations";
import { USER_ROLES } from "@/lib/domain";
import { inviteSchema } from "@/lib/validation/team";

type Result = { error: string } | { ok: true };

export async function updateMemberRole(
  userId: string,
  role: string,
): Promise<Result> {
  const parsedRole = z.enum(USER_ROLES).safeParse(role);
  if (!parsedRole.success) return { error: "Invalid role." };

  const org = await getActiveOrganization();
  if (!org) return { error: "Not authenticated." };
  if (userId === org.organization.owner_id) {
    return { error: "The workspace owner's role can't be changed." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ role: parsedRole.data })
    .eq("organization_id", org.organization.id)
    .eq("user_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/team");
  return { ok: true };
}

export async function removeMember(userId: string): Promise<Result> {
  const org = await getActiveOrganization();
  if (!org) return { error: "Not authenticated." };
  if (userId === org.organization.owner_id) {
    return { error: "You can't remove the workspace owner." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", org.organization.id)
    .eq("user_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/team");
  return { ok: true };
}

export async function inviteMember(input: unknown): Promise<Result> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invite." };
  }

  const [org, user] = await Promise.all([getActiveOrganization(), getUser()]);
  if (!org || !user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase.from("invitations").insert({
    organization_id: org.organization.id,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    invited_by: user.id,
  });
  if (error) {
    if (error.code === "23505") return { error: "That email is already invited." };
    return { error: error.message };
  }

  revalidatePath("/team");
  return { ok: true };
}

export async function revokeInvitation(id: string): Promise<Result> {
  const org = await getActiveOrganization();
  if (!org) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("organization_id", org.organization.id)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/team");
  return { ok: true };
}
