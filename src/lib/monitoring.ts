type ErrorContext = Record<string, unknown>;

/**
 * Central error reporter — the single seam for error monitoring.
 *
 * Defaults to structured console logging. To wire Sentry (or any provider):
 * install `@sentry/nextjs`, init it in `src/instrumentation.ts`, and forward
 * here, e.g. `Sentry.captureException(error, { extra: context })`. No call site
 * changes needed — the error boundaries and `onRequestError` already route here.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  if (process.env.NODE_ENV === "test") return;
  console.error("[monitoring]", error, context ?? {});
}
