import Link from "next/link";
import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Start with Relay</CardTitle>
        <CardDescription>
          Create your account — you&apos;ll set up your workspace next.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignupForm />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-strong hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to the demo terms. This is a portfolio
          project.
        </p>
      </CardContent>
    </Card>
  );
}
