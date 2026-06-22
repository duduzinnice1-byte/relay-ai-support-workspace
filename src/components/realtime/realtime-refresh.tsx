"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Subscription = { table: string; filter?: string };

/**
 * Subscribes to Postgres changes and refreshes the current route when data
 * changes. RLS is enforced on the realtime stream, so only authorized rows
 * trigger a refresh. Render once per page with a stable `channel` key.
 */
export function RealtimeRefresh({
  channel,
  subscriptions,
}: {
  channel: string;
  subscriptions: Subscription[];
}) {
  const router = useRouter();
  const key = JSON.stringify(subscriptions);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(channel);
    for (const sub of JSON.parse(key) as Subscription[]) {
      ch.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: sub.table,
          ...(sub.filter ? { filter: sub.filter } : {}),
        },
        () => router.refresh(),
      );
    }
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [channel, key, router]);

  return null;
}
