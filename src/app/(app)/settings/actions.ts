"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/data/organizations";
import { profileSchema, workspaceSchema } from "@/lib/validation/settings";

type Result = { error: string } | { ok: true };

export async function updateProfile(input: unknown): Promise<Result> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile." };
  }

  const user = await getUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout"); // name/avatar appear in the shell
  return { ok: true };
}

export async function updateWorkspace(input: unknown): Promise<Result> {
  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid workspace." };
  }

  const org = await getActiveOrganization();
  if (!org) return { error: "Not authenticated." };
  if (org.role !== "admin") {
    return { error: "Only admins can edit the workspace." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name: parsed.data.name })
    .eq("id", org.organization.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { ok: true };
}
