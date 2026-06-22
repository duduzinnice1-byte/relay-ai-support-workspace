/**
 * Returns `path` only when it is a safe internal path, otherwise `fallback`.
 * Must start with a single "/" not followed by "/" or "\" — browsers normalize
 * "\" to "/", so "/\evil.com" would otherwise become protocol-relative
 * "//evil.com" (an open redirect). Used by auth redirects and the OAuth callback.
 */
export function safeInternalPath(
  path: string | null | undefined,
  fallback: string,
): string {
  if (path && /^\/(?![/\\])/.test(path) && !path.includes("\\")) return path;
  return fallback;
}
