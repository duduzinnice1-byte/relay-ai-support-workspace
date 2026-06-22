"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  TICKET_STATUSES,
  STATUS_META,
  TICKET_PRIORITIES,
  PRIORITY_META,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/domain";
import { updateTicket, setTicketTag, createTag } from "@/app/(app)/inbox/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TicketTag } from "@/lib/data/tickets";

type Member = { userId: string; name: string };

export function TicketProperties({
  ticketId,
  status,
  priority,
  assigneeId,
  customerName,
  members,
  attachedTags,
  allTags,
}: {
  ticketId: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  customerName: string | null;
  members: Member[];
  attachedTags: TicketTag[];
  allTags: TicketTag[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic({
    status,
    priority,
    assigneeId,
  });
  const [newTag, setNewTag] = useState("");

  function apply(patch: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string | null;
  }) {
    startTransition(async () => {
      setOptimistic((prev) => ({ ...prev, ...patch }));
      const res = await updateTicket(ticketId, patch);
      if ("error" in res) toast.error(res.error);
    });
  }

  const attachedIds = new Set(attachedTags.map((t) => t.id));
  const unattached = allTags.filter((t) => !attachedIds.has(t.id));

  function attach(tagId: string) {
    startTransition(async () => {
      const r = await setTicketTag(ticketId, tagId, true);
      if ("error" in r) toast.error(r.error);
      else router.refresh();
    });
  }
  function detach(tagId: string) {
    startTransition(async () => {
      const r = await setTicketTag(ticketId, tagId, false);
      if ("error" in r) toast.error(r.error);
      else router.refresh();
    });
  }
  function create() {
    const name = newTag.trim();
    if (!name) return;
    startTransition(async () => {
      const r = await createTag({ name });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      await setTicketTag(ticketId, r.id, true);
      setNewTag("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={optimistic.status} onValueChange={(v) => apply({ status: v as TicketStatus })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={optimistic.priority} onValueChange={(v) => apply({ priority: v as TicketPriority })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_META[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Assignee</Label>
        <Select
          value={optimistic.assigneeId ?? "unassigned"}
          onValueChange={(v) => apply({ assigneeId: v === "unassigned" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Customer</Label>
        <p className="text-sm text-muted-foreground">{customerName ?? "—"}</p>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {attachedTags.length === 0 && (
            <span className="text-sm text-muted-foreground">No tags</span>
          )}
          {attachedTags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] font-medium"
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ backgroundColor: t.color || "var(--brand)" }}
              />
              {t.name}
              <button
                type="button"
                aria-label={`Remove ${t.name}`}
                onClick={() => detach(t.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>

        {unattached.length > 0 && (
          <Select value="" onValueChange={(v) => v && attach(v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Add existing tag" />
            </SelectTrigger>
            <SelectContent>
              {unattached.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex gap-1.5">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                create();
              }
            }}
            placeholder="New tag…"
            className="h-8 text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={create}
            disabled={isPending || !newTag.trim()}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
