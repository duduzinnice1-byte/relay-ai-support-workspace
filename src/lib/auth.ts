import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/** Current authenticated user (deduped per request), or null. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Like getUser, but redirects to /login when there is no session. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** A friendly display name for a user, falling back to the email handle. */
export function displayName(user: {
  email?: string | null;
  user_metadata?: { full_name?: string | null };
}): string {
  return (
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "there"
  );
}
