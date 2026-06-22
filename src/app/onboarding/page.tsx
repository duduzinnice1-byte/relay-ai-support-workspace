import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/data/organizations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Create your workspace" };

export default async function OnboardingPage() {
  await requireUser();

  // Already has a workspace? Skip onboarding.
  const orgs = await getUserOrganizations();
  if (orgs.length > 0) redirect("/dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your workspace</CardTitle>
        <CardDescription>
          This is where your team triages and resolves support. You become its
          first admin — invite the rest of the team once you&apos;re in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingForm />
      </CardContent>
    </Card>
  );
}
