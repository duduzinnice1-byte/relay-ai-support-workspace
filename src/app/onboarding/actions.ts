"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createOrganizationSchema } from "@/lib/validation/organization";

export async function createOrganization(input: {
  name: string;
  slug: string;
}): Promise<{ error: string } | void> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
  });

  if (error) {
    // RPC raises friendly messages, e.g. "The workspace URL ... is already taken".
    return { error: error.message };
  }

  redirect("/dashboard");
}
