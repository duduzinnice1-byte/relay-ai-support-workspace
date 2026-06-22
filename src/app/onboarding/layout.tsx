import Link from "next/link";

import { RelayMark } from "@/components/relay/relay-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_4%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_4%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl [background:radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_28%,transparent),transparent)]"
      />

      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <RelayMark className="size-6 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Relay
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
