"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Renders the inbox ticket list with a capped mount stagger. Server-rendered
 * TicketRow elements are passed in as `items`, so the rows stay server
 * components. Delay is capped so long lists don't crawl. */
export function TicketList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
            delay: Math.min(i, 12) * 0.04,
          }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
