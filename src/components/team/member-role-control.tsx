"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { USER_ROLES, ROLE_META, type UserRole } from "@/lib/domain";
import { updateMemberRole, removeMember } from "@/app/(app)/team/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function MemberRoleControl({
  userId,
  role,
  canRemove,
}: {
  userId: string;
  role: UserRole;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeRole(value: string) {
    startTransition(async () => {
      const res = await updateMemberRole(userId, value);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Role updated");
        router.refresh();
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await removeMember(userId);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Member removed");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select value={role} onValueChange={changeRole} disabled={isPending}>
        <SelectTrigger className="h-8 w-[7.5rem] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {USER_ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_META[r].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={remove}
          disabled={isPending}
          aria-label="Remove member"
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
