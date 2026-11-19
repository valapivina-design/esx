import { NextResponse } from "next/server";
import { isNextRedirectError } from "@/lib/auth/redirect-error";

/** Run a server action from a Route Handler and turn Next redirects into HTTP 303s. */
export async function runAuthFormAction(
  request: Request,
  action: (formData: FormData) => Promise<void>,
  fallbackPath: string
) {
  const formData = await request.formData();
  try {
    await action(formData);
    return NextResponse.redirect(new URL(fallbackPath, request.url), 303);
  } catch (e) {
    if (isNextRedirectError(e)) {
      const digest = String((e as { digest?: string }).digest ?? "");
      // digest shape: NEXT_REDIRECT;replace;/path;303;
      const parts = digest.split(";");
      const href = parts[2] || fallbackPath;
      const target = href.startsWith("http") ? href : new URL(href, request.url).toString();
      return NextResponse.redirect(target, 303);
    }
    throw e;
  }
}
