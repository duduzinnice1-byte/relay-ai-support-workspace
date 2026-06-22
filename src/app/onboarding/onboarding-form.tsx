"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight } from "lucide-react";

import {
  createOrganizationSchema,
  slugify,
  type CreateOrganizationInput,
} from "@/lib/validation/organization";
import { createOrganization } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: "", slug: "" },
  });

  const nameReg = register("name");
  const slugReg = register("slug");

  const onSubmit = (values: CreateOrganizationInput) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createOrganization(values);
      if (result?.error) setFormError(result.error);
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
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          autoComplete="organization"
          placeholder="Acme Support"
          aria-invalid={errors.name ? true : undefined}
          {...nameReg}
          onChange={(e) => {
            nameReg.onChange(e);
            if (!slugEdited) {
              setValue("slug", slugify(e.target.value), {
                shouldValidate: true,
              });
            }
          }}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Workspace URL</Label>
        <div
          className={cn(
            "flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-card text-sm shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
            errors.slug && "border-destructive",
          )}
        >
          <span className="select-none pl-3 font-mono text-muted-foreground">
            relay.app/
          </span>
          <input
            id="slug"
            className="h-full flex-1 bg-transparent pr-3 font-mono outline-none placeholder:text-muted-foreground"
            placeholder="acme-support"
            aria-invalid={errors.slug ? true : undefined}
            {...slugReg}
            onChange={(e) => {
              setSlugEdited(true);
              slugReg.onChange(e);
            }}
          />
        </div>
        {errors.slug && (
          <p className="text-xs text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Spinner /> : null}
        Create workspace
        {!isPending && <ArrowRight />}
      </Button>
    </form>
  );
}
