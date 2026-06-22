"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { workspaceSchema, type WorkspaceInput } from "@/lib/validation/settings";
import { updateWorkspace } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export function WorkspaceForm({
  name,
  slug,
  canEdit,
}: {
  name: string;
  slug: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkspaceInput>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name },
  });

  const onSubmit = (values: WorkspaceInput) => {
    setFormError(null);
    startTransition(async () => {
      const res = await updateWorkspace(values);
      if ("error" in res) setFormError(res.error);
      else {
        toast.success("Workspace updated");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertCircle />
          <span>{formError}</span>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input
          id="ws-name"
          disabled={!canEdit}
          aria-invalid={errors.name ? true : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ws-slug">Workspace URL</Label>
        <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
          <span className="font-mono">relay.app/{slug}</span>
        </div>
      </div>
      {canEdit ? (
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner />}
          Save workspace
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only admins can change workspace settings.
        </p>
      )}
    </form>
  );
}
