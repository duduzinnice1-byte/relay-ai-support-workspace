"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Lock, Send, Sparkles, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

import { addComment, createTag, setTicketTag } from "@/app/(app)/inbox/actions";
import {
  summarizeTicket,
  draftTicketReply,
  suggestTicketTags,
} from "@/app/(app)/inbox/[id]/ai-actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ConvComment = {
  id: string;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
  pending?: boolean;
};

type Author = { name: string; avatarUrl: string | null };

export function TicketConversation({
  ticketId,
  initialComments,
  authors,
  currentUser,
}: {
  ticketId: string;
  initialComments: ConvComment[];
  authors: Record<string, Author>;
  currentUser: { id: string; name: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const [comments, addOptimistic] = useOptimistic(
    initialComments,
    (state, next: ConvComment) => [...state, next],
  );

  const [summary, setSummary] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [busy, setBusy] = useState<null | "summary" | "draft" | "tags">(null);

  function send() {
    const text = body.trim();
    if (!text) return;
    startTransition(async () => {
      addOptimistic({
        id: `temp-${text.length}-${comments.length}`,
        author_id: currentUser.id,
        body: text,
        is_internal: isInternal,
        created_at: new Date().toISOString(),
        pending: true,
      });
      setBody("");
      const res = await addComment({ ticketId, body: text, isInternal });
      if ("error" in res) toast.error(res.error);
      else router.refresh();
    });
  }

  function runSummary() {
    setBusy("summary");
    startTransition(async () => {
      try {
        const res = await summarizeTicket(ticketId);
        if ("error" in res) toast.error(res.error);
        else setSummary(res.summary);
      } finally {
        setBusy(null);
      }
    });
  }

  function runDraft() {
    setBusy("draft");
    startTransition(async () => {
      try {
        const res = await draftTicketReply(ticketId);
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        setBody(res.draft);
        setIsInternal(false);
        toast.success("Draft inserted — review before sending");
      } finally {
        setBusy(null);
      }
    });
  }

  function runSuggestTags() {
    setBusy("tags");
    startTransition(async () => {
      try {
        const res = await suggestTicketTags(ticketId);
        if ("error" in res) toast.error(res.error);
        else if (res.tags.length === 0) toast.info("No new tags to suggest");
        else setSuggested(res.tags);
      } finally {
        setBusy(null);
      }
    });
  }

  function applyTag(name: string) {
    startTransition(async () => {
      const created = await createTag({ name });
      if ("error" in created) {
        toast.error(created.error);
        return;
      }
      await setTicketTag(ticketId, created.id, true);
      setSuggested((s) => s.filter((t) => t !== name));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No messages yet. Reply to the customer or leave an internal note.
          </li>
        )}
        {comments.map((c) => {
          const author = c.author_id ? authors[c.author_id] : undefined;
          const name = author?.name ?? "Agent";
          return (
            <li
              key={c.id}
              className={cn(
                "rounded-lg border p-3",
                c.is_internal
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card",
                c.pending && "opacity-60",
              )}
            >
              <div className="flex items-center gap-2">
                <Avatar name={name} src={author?.avatarUrl ?? null} className="size-6" />
                <span className="text-sm font-medium">{name}</span>
                {c.is_internal && (
                  <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-strong">
                    <Lock className="size-3" />
                    Internal
                  </span>
                )}
                <span
                  data-signal
                  className="ml-auto font-mono text-[11px] text-muted-foreground"
                >
                  {c.pending
                    ? "sending…"
                    : formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
            </li>
          );
        })}
      </ul>

      {/* Copilot */}
      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Copilot
          </span>
          <Button size="sm" variant="outline" onClick={runSummary} disabled={isPending}>
            {busy === "summary" ? <Spinner /> : null}
            Summarize
          </Button>
          <Button size="sm" variant="outline" onClick={runDraft} disabled={isPending}>
            {busy === "draft" ? <Spinner /> : null}
            Draft reply
          </Button>
          <Button size="sm" variant="outline" onClick={runSuggestTags} disabled={isPending}>
            {busy === "tags" ? <Spinner /> : <TagIcon className="size-3.5" />}
            Suggest tags
          </Button>
        </div>

        {summary && (
          <div className="mt-3 rounded-md border border-border bg-card p-2.5 text-sm">
            <p className="text-muted-foreground">{summary}</p>
          </div>
        )}

        {suggested.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Suggested:</span>
            {suggested.map((t) => (
              <button
                key={t}
                onClick={() => applyTag(t)}
                className="inline-flex items-center gap-1 rounded border border-dashed border-border px-1.5 py-0.5 text-[11px] font-medium transition-colors hover:border-primary hover:text-brand-strong"
              >
                + {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="rounded-lg border border-border bg-card p-3">
        <Tabs
          value={isInternal ? "internal" : "reply"}
          onValueChange={(v) => setIsInternal(v === "internal")}
        >
          <TabsList>
            <TabsTrigger value="reply">Reply to customer</TabsTrigger>
            <TabsTrigger value="internal">
              <Lock className="size-3.5" />
              Internal note
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder={
            isInternal
              ? "Add an internal note for your team…"
              : "Write a reply to the customer…"
          }
          className="mt-3 min-h-24"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</span>
          <Button onClick={send} disabled={isPending || !body.trim()} className="gap-2">
            {isPending ? <Spinner /> : <Send className="size-4" />}
            {isInternal ? "Add note" : "Send reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
