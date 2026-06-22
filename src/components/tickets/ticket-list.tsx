"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Renders the inbox ticket list with a capped mount stagger. Server-rendered
 * TicketRow nodes are passed in (rows stay server components); keyed by ticket
 * id so a realtime-inserted ticket mounts fresh and animates exactly once,
 * while existing rows keep identity and never re-stagger on refresh. */
export function TicketList({
  items,
}: {
  items: { id: string; node: ReactNode }[];
}) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item, i) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
            delay: Math.min(i, 12) * 0.04,
          }}
        >
          {item.node}
        </motion.li>
      ))}
    </ul>
  );
}
