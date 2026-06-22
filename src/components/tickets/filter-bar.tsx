"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import {
  TICKET_STATUSES,
  STATUS_META,
  TICKET_PRIORITIES,
  PRIORITY_META,
  type TicketStatus,
} from "@/lib/domain";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Counts = Record<TicketStatus, number> & { all: number };
type Member = { userId: string; name: string };
type Tag = { id: string; name: string };

export function FilterBar({
  counts,
  members,
  tags,
}: {
  counts: Counts;
  members: Member[];
  tags: Tag[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const status = params.get("status") ?? "";
  const priority = params.get("priority") ?? "";
  const assignee = params.get("assignee") ?? "";
  const tag = params.get("tag") ?? "";
  const q = params.get("q") ?? "";

  const [search, setSearch] = useState(q);

  // Resync the input when the URL query changes externally (back/forward),
  // using React's render-time adjustment pattern (no effect, no cascade).
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setSearch(q);
  }

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== q) update({ q: search || null });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const tabs = [
    { key: "", label: "All", count: counts.all },
    ...TICKET_STATUSES.map((s) => ({
      key: s,
      label: STATUS_META[s].label,
      count: counts[s],
    })),
  ];

  const hasFilters = Boolean(status || priority || assignee || tag || q);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => {
          const active = status === t.key;
          return (
            <button
              key={t.key || "all"}
              onClick={() => update({ status: t.key || null })}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {t.label}
              <span className="font-mono text-[11px] text-muted-foreground">{t.count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects…"
            className="pl-8"
            aria-label="Search tickets"
          />
        </div>

        <Select
          value={priority || "any"}
          onValueChange={(v) => update({ priority: v === "any" ? null : v })}
        >
          <SelectTrigger className="w-[8.5rem]" aria-label="Filter by priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any priority</SelectItem>
            {TICKET_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_META[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={assignee || "any"}
          onValueChange={(v) => update({ assignee: v === "any" ? null : v })}
        >
          <SelectTrigger className="w-[9.5rem]" aria-label="Filter by assignee">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Anyone</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {tags.length > 0 && (
          <Select
            value={tag || "any"}
            onValueChange={(v) => update({ tag: v === "any" ? null : v })}
          >
            <SelectTrigger className="w-[8.5rem]" aria-label="Filter by tag">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any tag</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setSearch("");
              startTransition(() => router.push(pathname));
            }}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
