import { NextResponse } from "next/server";
import { safePublicUrl } from "@/lib/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL ?? null;
  const adminRaw = process.env.NEXT_PUBLIC_ADMIN_URL ?? null;
  const siteUrl = safePublicUrl(siteRaw ?? undefined, "https://101escrowservices.net");
  const adminUrl = safePublicUrl(adminRaw ?? undefined, "https://admin.101escrowservices.net");

  let siteUrlParseOk = true;
  try {
    // eslint-disable-next-line no-new
    new URL((siteRaw ?? "").trim() || siteUrl);
  } catch {
    siteUrlParseOk = false;
  }

  return NextResponse.json({
    ok: true,
    siteUrl,
    adminUrl,
    siteUrlRawLength: siteRaw?.length ?? 0,
    siteUrlHasNewline: Boolean(siteRaw?.includes("\n")),
    adminUrlHasNewline: Boolean(adminRaw?.includes("\n")),
    siteUrlParseOk,
    hasServiceAccountJson: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()),
    hasFirebaseApiKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()),
    emulatorEnabled: process.env.USE_FIREBASE_EMULATOR === "1",
  });
}
