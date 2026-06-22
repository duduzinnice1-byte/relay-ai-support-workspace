import Link from "next/link";
import type { Metadata } from "next";
import { MailCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; check_email?: string }>;
}) {
  const sp = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Relay workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sp.check_email && (
          <Alert>
            <MailCheck />
            <span>
              Check your inbox to confirm your account, then sign in here.
            </span>
          </Alert>
        )}

        <LoginForm redirectTo={sp.redirect} />

        <p className="text-center text-sm text-muted-foreground">
          New to Relay?{" "}
          <Link
            href="/signup"
            className="font-medium text-brand-strong hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
