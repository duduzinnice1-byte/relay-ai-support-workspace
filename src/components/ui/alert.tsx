import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary/50 text-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive [&_svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  );
}

export { Alert };
