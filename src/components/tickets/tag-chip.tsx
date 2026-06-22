import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TicketTag } from "@/lib/data/tickets";

export function TagChip({
  tag,
  onRemove,
  className,
}: {
  tag: Pick<TicketTag, "name" | "color">;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ backgroundColor: tag.color || "var(--brand)" }}
      />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${tag.name}`}
          onClick={onRemove}
          className="text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
