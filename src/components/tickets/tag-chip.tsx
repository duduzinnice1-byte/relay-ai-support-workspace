import { cn } from "@/lib/utils";
import type { TicketTag } from "@/lib/data/tickets";

export function TagChip({
  tag,
  className,
}: {
  tag: Pick<TicketTag, "name" | "color">;
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
    </span>
  );
}
