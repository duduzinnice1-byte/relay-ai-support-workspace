import { redirect } from "next/navigation";

import { requireUser, displayName } from "@/lib/auth";
import {
  getUserOrganizations,
  getActiveOrganization,
} from "@/lib/data/organizations";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const memberships = await getUserOrganizations();
  if (memberships.length === 0) redirect("/onboarding");

  const active = await getActiveOrganization();
  if (!active) redirect("/onboarding");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", user.id)
    .single();

  const shellUser = {
    name: profile?.full_name || displayName(user),
    email: profile?.email || user.email || "",
    avatarUrl: profile?.avatar_url ?? null,
  };

  const orgs = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));

  const activeOrg = {
    id: active.organization.id,
    name: active.organization.name,
    slug: active.organization.slug,
    role: active.role,
  };

  return (
    <AppShell
      user={shellUser}
      role={active.role}
      activeOrg={activeOrg}
      orgs={orgs}
    >
      {children}
    </AppShell>
  );
}
