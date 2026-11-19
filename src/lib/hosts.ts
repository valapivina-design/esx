/**
 * Public site vs staff admin subdomain.
 *
 * Production:  https://101escrowservices.net  +  https://admin.101escrowservices.net
 * Local:       http://localhost:3100          +  http://admin.localhost:3100
 */

import { safePublicUrl } from "@/lib/urls";

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

export function publicSiteUrl() {
  return stripTrailingSlash(safePublicUrl(process.env.NEXT_PUBLIC_SITE_URL, "https://101escrowservices.net"));
}

export function adminSiteUrl() {
  return stripTrailingSlash(
    safePublicUrl(process.env.NEXT_PUBLIC_ADMIN_URL, "https://admin.101escrowservices.net")
  );
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return "";
  }
}

export function hostnameOnly(hostHeader: string | null | undefined): string {
  if (!hostHeader) return "";
  return hostHeader.split(":")[0].toLowerCase();
}

export function isAdminHostHeader(hostHeader: string | null | undefined): boolean {
  const incoming = hostnameOnly(hostHeader);
  if (!incoming) return false;
  const adminHost = hostnameOnly(hostFromUrl(adminSiteUrl()));
  if (adminHost && incoming === adminHost) return true;
  // Local: admin.localhost resolves to loopback in modern browsers
  if (incoming === "admin.localhost") return true;
  return false;
}

export function isLocalDevHost(hostHeader: string | null | undefined): boolean {
  const h = hostnameOnly(hostHeader);
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost");
}

/** Absolute URL on the admin portal (path should start with /). */
export function adminAbsoluteUrl(path = "/") {
  const base = adminSiteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Absolute URL on the public site. */
export function publicAbsoluteUrl(path = "/") {
  const base = publicSiteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
