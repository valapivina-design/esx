/** Normalize public site URLs so a bad host env (missing https, quotes, spaces) cannot crash SSR. */
export function safePublicUrl(raw: string | undefined, fallback: string): string {
  const fallbackClean = fallback.replace(/\/$/, "");
  if (!raw) return fallbackClean;
  let value = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!value) return fallbackClean;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallbackClean;
    return url.origin;
  } catch {
    return fallbackClean;
  }
}
