/** Avoid importing Next internals (`next/dist/...`) which can break serverless bundles. */
export function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";
  return digest.startsWith("NEXT_REDIRECT");
}
