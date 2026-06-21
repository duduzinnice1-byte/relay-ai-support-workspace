import { cn } from "@/lib/utils";
import { PRIORITY_META, type TicketPriority } from "@/lib/domain";

/** Signature element: priority drawn as rising signal bars (1–4 strength). */
export function PriorityBadge({
  priority,
  withLabel = true,
  className,
}: {
  priority: TicketPriority;
  withLabel?: boolean;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  const emphasized = priority === "high" || priority === "urgent";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={`Priority: ${meta.label}`}
    >
      <span aria-hidden className="flex items-end gap-[2px]">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className="w-[3px] rounded-[1px]"
            style={{
              height: `${3 + bar * 2}px`,
              backgroundColor:
                bar <= meta.level ? `var(${meta.varName})` : "var(--border)",
            }}
          />
        ))}
      </span>
      {withLabel && (
        <span
          className="text-xs font-medium"
          style={emphasized ? { color: `var(${meta.varName})` } : undefined}
        >
          {meta.label}
        </span>
      )}
      <span className="sr-only">Priority {meta.label}</span>
    </span>
  );
}
