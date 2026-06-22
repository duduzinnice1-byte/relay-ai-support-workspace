"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { seedSampleData } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SeedButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="gap-2"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await seedSampleData();
          if ("error" in res) toast.error(res.error);
          else {
            toast.success("Sample data loaded");
            router.refresh();
          }
        })
      }
    >
      {isPending ? <Spinner /> : <Sparkles className="size-4" />}
      Load sample data
    </Button>
  );
}
