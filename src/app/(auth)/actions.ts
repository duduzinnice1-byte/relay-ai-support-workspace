"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation/auth";

type ActionResult = { error: string } | void;

/** Only allow redirects to internal paths to avoid open-redirects. Must start
 * with a single "/" not followed by "/" or "\" — browsers normalize "\" to "/",
 * so "/\evil.com" would otherwise become the protocol-relative "//evil.com". */
function safePath(path: string | undefined, fallback: string): string {
  if (path && /^\/(?![/\\])/.test(path) && !path.includes("\\")) return path;
  return fallback;
}

export async function signIn(input: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Wrong email or password. Try again." };
  }

  redirect(safePath(input.redirectTo, "/dashboard"));
}

export async function signUp(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is enabled there is no session yet.
  if (!data.session) {
    redirect("/login?check_email=1");
  }

  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
