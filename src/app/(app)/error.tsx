"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "app-route", digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We hit an error loading this view. You can try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
