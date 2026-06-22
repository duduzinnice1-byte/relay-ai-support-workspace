"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/app/(auth)/actions";
import type { ShellUser } from "./types";

export function UserMenu({ user, role }: { user: ShellUser; role: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Open account menu"
        >
          <Avatar name={user.name} src={user.avatarUrl} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <span className="mt-1.5 inline-flex items-center rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-brand-strong">
            {role}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserIcon />
          <span className="flex-1">Profile</span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground/70">
            Soon
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings />
          <span className="flex-1">Settings</span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground/70">
            Soon
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
