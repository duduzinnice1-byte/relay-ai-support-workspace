"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { signIn } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signIn({ ...values, redirectTo });
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Spinner />}
        Sign in
      </Button>
    </form>
  );
}
