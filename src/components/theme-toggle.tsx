"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes: read the resolved theme only after mount to avoid a hydration
  // mismatch. This one-shot mount flag is the intended pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="relative inline-flex size-4 items-center justify-center">
        <motion.span
          className="absolute inset-0 inline-flex items-center justify-center"
          initial={false}
          animate={{ opacity: isDark ? 1 : 0, rotate: isDark ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Sun />
        </motion.span>
        <motion.span
          className="absolute inset-0 inline-flex items-center justify-center"
          initial={false}
          animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Moon />
        </motion.span>
      </span>
    </Button>
  );
}
