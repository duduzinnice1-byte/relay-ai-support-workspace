import { cn } from "@/lib/utils";
import { STATUS_META, type TicketStatus } from "@/lib/domain";

/** A ticket status rendered as a labelled signal dot. */
export function StatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ backgroundColor: `var(${meta.varName})` }}
      />
      {meta.label}
    </span>
  );
}
