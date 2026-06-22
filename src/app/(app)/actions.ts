"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ACTIVE_ORG_COOKIE, getUserOrganizations } from "@/lib/data/organizations";

/** Switch the active workspace. Validates membership before persisting. */
export async function setActiveOrg(orgId: string): Promise<void> {
  const memberships = await getUserOrganizations();
  const isMember = memberships.some((m) => m.organization.id === orgId);
  if (!isMember) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
