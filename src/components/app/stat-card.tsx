import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-console transition-colors before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border before:to-transparent hover:border-border/80"
      style={
        accent
          ? { boxShadow: `inset 2px 0 0 ${accent}, var(--shadow-console)` }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon
          className="size-4 text-muted-foreground"
          style={accent ? { color: accent } : undefined}
        />
      </div>
      <p
        data-signal
        className="mt-2.5 font-mono text-[1.75rem] font-semibold leading-none tabular-nums"
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
