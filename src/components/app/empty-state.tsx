import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
