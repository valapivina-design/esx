import { NextResponse, type NextRequest } from "next/server";
import { adminAbsoluteUrl, isAdminHostHeader } from "@/lib/hosts";

const ADMIN_SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store",
};

function withAdminHeaders(res: NextResponse) {
  for (const [k, v] of Object.entries(ADMIN_SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

/**
 * Host-based isolation:
 * - Public site (localhost / apex): client portal only; /admin* → admin subdomain
 * - Admin subdomain (admin.localhost / admin.*): staff portal only; marketing/dashboard blocked
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const { pathname } = request.nextUrl;
  const adminHost = isAdminHostHeader(host);

  if (adminHost) {
    // Staff host: only admin UI + login + next assets
    const allowed =
      pathname === "/admin-login" ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico" ||
      pathname.startsWith("/images");

    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return withAdminHeaders(NextResponse.rewrite(url));
    }

    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      return withAdminHeaders(NextResponse.redirect(url));
    }

    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      url.search = "";
      return withAdminHeaders(NextResponse.redirect(url));
    }

    return withAdminHeaders(NextResponse.next());
  }

  // Public host: never serve the staff portal here
  if (pathname === "/admin-login" || pathname === "/admin" || pathname.startsWith("/admin/")) {
    const targetPath = pathname === "/admin-login" ? "/admin-login" : pathname;
    return NextResponse.redirect(adminAbsoluteUrl(targetPath));
  }

  // Soft hint header for debugging deployments
  const res = NextResponse.next();
  res.headers.set("X-Escrow-Portal", "public");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
