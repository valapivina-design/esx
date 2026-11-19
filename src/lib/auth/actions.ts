"use server";

import { redirect } from "next/navigation";
import { isNextRedirectError } from "@/lib/auth/redirect-error";
import { signInWithPassword, signUpWithPassword, sendPasswordReset, resetPasswordWithOob } from "@/lib/firebase/auth-rest";
import {
  clearAdminSessionCookie,
  clearSessionCookie,
  createAdminSessionCookie,
  createSessionCookie,
  ensureUserProfile,
} from "@/lib/firebase/session";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { adminAuth } from "@/lib/firebase/admin";
import { safeNextPath } from "@/lib/auth/paths";
import { siteConfig } from "@/lib/site";

function requireConfigured() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured. Add keys to .env.local (see .env.example) or set USE_FIREBASE_EMULATOR=1.");
  }
}

export async function signInAction(formData: FormData) {
  requireConfigured();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  try {
    const result = await signInWithPassword(email, password);
    await createSessionCookie(result.idToken);
    await ensureUserProfile(result.localId, result.email);
    // Admins use the separate admin subdomain — never open staff UI from the public site.
    redirect(next);
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const message = e instanceof Error ? e.message : "Sign in failed";
    redirect(`/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }
}

export async function adminSignInAction(formData: FormData) {
  requireConfigured();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const result = await signInWithPassword(email, password);
    const profile = await ensureUserProfile(result.localId, result.email);
    if (!profile.roles.includes("admin")) {
      await clearAdminSessionCookie();
      redirect(`/admin-login?error=${encodeURIComponent("This account does not have admin access.")}`);
    }
    await createAdminSessionCookie(result.idToken);
    redirect("/admin");
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const message = e instanceof Error ? e.message : "Sign in failed";
    redirect(`/admin-login?error=${encodeURIComponent(message)}`);
  }
}

export async function signUpAction(formData: FormData) {
  requireConfigured();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const next = safeNextPath(formData.get("next"));

  try {
    const result = await signUpWithPassword(email, password);
    if (fullName) {
      try {
        await adminAuth().updateUser(result.localId, { displayName: fullName });
      } catch {
        // Emulator may not support all admin user updates; profile still stores the name.
      }
    }
    await createSessionCookie(result.idToken);
    await ensureUserProfile(result.localId, result.email, fullName);
    redirect(next);
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const message = e instanceof Error ? e.message : "Sign up failed";
    redirect(`/register?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }
}

export async function signOutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function adminSignOutAction() {
  await clearAdminSessionCookie();
  redirect("/admin-login");
}

export async function forgotPasswordAction(formData: FormData) {
  requireConfigured();
  const email = String(formData.get("email") ?? "");
  try {
    await sendPasswordReset(email);
  } catch {
    // Always show success to avoid email enumeration.
  }
  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  requireConfigured();
  const oobCode = String(formData.get("oobCode") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!oobCode || password.length < 6) {
    redirect(`/reset-password?error=${encodeURIComponent("Invalid reset link or password.")}`);
  }

  try {
    await resetPasswordWithOob(oobCode, password);
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const message = e instanceof Error ? e.message : "Reset failed";
    redirect(
      `/reset-password?error=${encodeURIComponent(message)}&oobCode=${encodeURIComponent(oobCode)}`
    );
  }
  redirect("/login?reset=1");
}

/** Used only for docs / password-reset email template configuration. */
export async function passwordResetContinueUrl() {
  return `${siteConfig.url}/reset-password`;
}
