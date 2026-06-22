"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { setActiveOrg } from "@/app/(app)/actions";
import type { ShellOrg } from "./types";

function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={
        "grid place-items-center rounded-md bg-primary/15 font-display font-semibold text-brand-strong " +
        (className ?? "size-7 text-sm")
      }
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function OrgSwitcher({
  activeOrg,
  orgs,
}: {
  activeOrg: ShellOrg;
  orgs: ShellOrg[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const select = (id: string) => {
    if (id === activeOrg.id) return;
    startTransition(async () => {
      await setActiveOrg(id);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-card px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Switch workspace"
        >
          <Monogram name={activeOrg.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {activeOrg.name}
            </span>
            <span className="block truncate font-mono text-[11px] text-muted-foreground">
              relay.app/{activeOrg.slug}
            </span>
          </span>
          {isPending ? (
            <Spinner className="size-4 text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[15rem]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {orgs.map((org) => (
          <DropdownMenuItem key={org.id} onSelect={() => select(org.id)}>
            <Monogram name={org.name} className="size-6 text-xs" />
            <span className="min-w-0 flex-1 truncate">{org.name}</span>
            {org.id === activeOrg.id && (
              <Check className="size-4 text-brand-strong" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Plus />
          <span className="flex-1">New workspace</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground/70">
            Soon
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
