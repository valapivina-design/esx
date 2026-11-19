/** Only allow same-origin relative paths for post-login redirects. */
export function safeNextPath(raw: unknown, fallback = "/dashboard"): string {
  if (typeof raw !== "string") return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://") || path.includes("\\")) {
    return fallback;
  }
  return path;
}
