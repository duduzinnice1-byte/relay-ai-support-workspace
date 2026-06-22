import { reportError } from "@/lib/monitoring";

// Next.js calls this for uncaught server-side errors (Server Components, Route
// Handlers, Server Actions). This is the integration point for a monitoring
// provider such as Sentry.
export function onRequestError(
  error: unknown,
  request: unknown,
  context: unknown,
): void {
  reportError(error, { request, context });
}
