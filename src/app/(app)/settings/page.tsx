import type { Metadata } from "next";

import { requireUser, displayName } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/data/organizations";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { WorkspaceForm } from "./workspace-form";

export const metadata: Metadata = { title: "Settings" };

const NOTIFICATIONS = [
  "New ticket assigned to me",
  "New reply on a ticket I follow",
  "Daily queue summary",
];

export default async function SettingsPage() {
  const user = await requireUser();
  const org = await getActiveOrganization();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile?.full_name || displayName(user);
  const email = profile?.email || user.email || "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, workspace and notifications.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={fullName} email={email} />
        </CardContent>
      </Card>

      {org && (
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>
              Settings for {org.organization.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceForm
              name={org.organization.name}
              slug={org.organization.slug}
              canEdit={org.role === "admin"}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what we email you about.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {NOTIFICATIONS.map((label) => (
              <li
                key={label}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span>{label}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Soon
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
