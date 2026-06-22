import type { Metadata } from "next";

import { getActiveOrganization } from "@/lib/data/organizations";
import { getOrgMembers } from "@/lib/data/members";
import { getPendingInvitations, type Invitation } from "@/lib/data/invitations";
import { getUser } from "@/lib/auth";
import { ROLE_META } from "@/lib/domain";
import { Avatar } from "@/components/ui/avatar";
import { MemberRoleControl } from "@/components/team/member-role-control";
import { InviteDialog } from "@/components/team/invite-dialog";
import { PendingInvites } from "@/components/team/pending-invites";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const [org, user] = await Promise.all([getActiveOrganization(), getUser()]);
  if (!org || !user) return null;

  const orgId = org.organization.id;
  const ownerId = org.organization.owner_id;
  const isAdmin = org.role === "admin";

  const [members, invites] = await Promise.all([
    getOrgMembers(orgId),
    isAdmin
      ? getPendingInvitations(orgId)
      : Promise.resolve([] as Invitation[]),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Team
          </h1>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>
        {isAdmin && <InviteDialog />}
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {members.map((m) => {
            const isOwner = m.userId === ownerId;
            const isSelf = m.userId === user.id;
            return (
              <li key={m.userId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={m.name} src={m.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.name}
                    {isSelf && (
                      <span className="font-normal text-muted-foreground"> · You</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email ?? "—"}
                    {isOwner && " · Owner"}
                  </p>
                </div>
                {isAdmin && !isOwner ? (
                  <MemberRoleControl
                    userId={m.userId}
                    role={m.role}
                    canRemove={!isSelf}
                  />
                ) : (
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {ROLE_META[m.role].label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {isAdmin && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">
            Pending invitations
          </h2>
          <PendingInvites invites={invites} />
        </section>
      )}
    </div>
  );
}
