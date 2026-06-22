"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** One-shot mount entrance for page chrome (fade + small slide-up). Restrained:
 * 250ms, ease-out, transform+opacity only. MotionConfig handles reduced-motion. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
