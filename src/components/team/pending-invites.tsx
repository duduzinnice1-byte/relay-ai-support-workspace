"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

import { revokeInvitation } from "@/app/(app)/team/actions";
import { ROLE_META } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import type { Invitation } from "@/lib/data/invitations";

export function PendingInvites({ invites }: { invites: Invitation[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (invites.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invitations.</p>;
  }

  function revoke(id: string) {
    startTransition(async () => {
      const res = await revokeInvitation(id);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Invitation revoked");
        router.refresh();
      }
    });
  }

  return (
    <ul className="divide-y divide-border">
      {invites.map((inv) => (
        <li key={inv.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{inv.email}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_META[inv.role].label} · pending
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => revoke(inv.id)}
            disabled={isPending}
            aria-label={`Revoke invitation for ${inv.email}`}
          >
            <X className="size-4 text-muted-foreground" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
