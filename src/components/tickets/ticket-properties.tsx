"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
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
import { TagChip } from "@/components/tickets/tag-chip";
import type { TicketTag } from "@/lib/data/tickets";

type Member = { userId: string; name: string };

/** Flashes a "signal gold" ring on the field that just changed (optimistic
 * write confirmation). Only the active field remounts and replays. */
function FieldFlash({
  active,
  flashId,
  children,
}: {
  active: boolean;
  flashId: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={active ? flashId : "base"}
      className="rounded-md"
      initial={
        active
          ? { boxShadow: "0 0 0 2px color-mix(in oklab, var(--primary) 45%, transparent)" }
          : false
      }
      animate={{ boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

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
  const [flashField, setFlashField] = useState<string | null>(null);
  const [flashId, setFlashId] = useState(0);

  function apply(patch: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string | null;
  }) {
    const field = Object.keys(patch)[0] ?? null;
    setFlashField(field);
    setFlashId((n) => n + 1);
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
        <FieldFlash active={flashField === "status"} flashId={flashId}>
          <Select
            value={optimistic.status}
            onValueChange={(v) => apply({ status: v as TicketStatus })}
          >
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
        </FieldFlash>
      </div>

      <div className="space-y-1.5">
        <Label>Priority</Label>
        <FieldFlash active={flashField === "priority"} flashId={flashId}>
          <Select
            value={optimistic.priority}
            onValueChange={(v) => apply({ priority: v as TicketPriority })}
          >
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
        </FieldFlash>
      </div>

      <div className="space-y-1.5">
        <Label>Assignee</Label>
        <FieldFlash active={flashField === "assigneeId"} flashId={flashId}>
          <Select
            value={optimistic.assigneeId ?? "unassigned"}
            onValueChange={(v) =>
              apply({ assigneeId: v === "unassigned" ? null : v })
            }
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
        </FieldFlash>
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
            <TagChip key={t.id} tag={t} onRemove={() => detach(t.id)} />
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
