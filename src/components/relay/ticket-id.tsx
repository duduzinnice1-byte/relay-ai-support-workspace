import { cn } from "@/lib/utils";
import { ticketRef } from "@/lib/domain";

/** Signature element: a ticket's public reference as a monospaced signal readout. */
export function TicketId({
  number,
  className,
}: {
  number: number;
  className?: string;
}) {
  return (
    <span
      data-signal
      className={cn(
        "font-mono text-xs font-medium tracking-tight text-muted-foreground",
        className,
      )}
    >
      {ticketRef(number)}
    </span>
  );
}
