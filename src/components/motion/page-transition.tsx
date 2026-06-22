"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Entrance-only content fade, replayed on route change via `motionKey`
 * (usePathname). Never animates the surrounding chrome; no exit transition. */
export function PageTransition({
  children,
  motionKey,
}: {
  children: ReactNode;
  motionKey?: string;
}) {
  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
