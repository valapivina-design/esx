import { cookies, headers } from "next/headers";
import { adminAuth, adminDb, isAdminEmail, isFirebaseConfigured } from "@/lib/firebase/admin";
import { isAdminHostHeader } from "@/lib/hosts";
import type { Profile, UserRole } from "@/lib/types";

/** Client portal session (main site only — host-only cookie). */
export const SESSION_COOKIE = "esc_session";
/** Staff portal session (admin subdomain only — host-only cookie). */
export const ADMIN_SESSION_COOKIE = "esc_admin_session";

const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000; // 5 days
const ADMIN_SESSION_MAX_AGE_MS = 60 * 60 * 8 * 1000; // 8 hours — shorter for staff

async function onAdminHost(): Promise<boolean> {
  const h = await headers();
  return isAdminHostHeader(h.get("x-forwarded-host") ?? h.get("host"));
}

function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
    // No Domain attribute → host-only (won't leak across public ↔ admin subdomains)
  };
}

export async function createSessionCookie(idToken: string) {
  const sessionCookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionCookie, cookieOptions(SESSION_MAX_AGE_MS / 1000));
}

export async function createAdminSessionCookie(idToken: string) {
  const sessionCookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: ADMIN_SESSION_MAX_AGE_MS,
  });
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, sessionCookie, cookieOptions(ADMIN_SESSION_MAX_AGE_MS / 1000));
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function clearAdminSessionCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
}

export async function getSessionUid(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  const jar = await cookies();
  const adminHost = await onAdminHost();
  const session = adminHost
    ? jar.get(ADMIN_SESSION_COOKIE)?.value
    : jar.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function ensureUserProfile(uid: string, email: string, fullName?: string): Promise<Profile> {
  const db = adminDb();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  const now = new Date().toISOString();
  const roles: UserRole[] = isAdminEmail(email) ? ["admin", "buyer"] : ["buyer"];

  if (!snap.exists) {
    const profile: Profile = {
      id: uid,
      full_name: fullName ?? "",
      email,
      phone: null,
      account_status: "active",
      is_verified: false,
      kyc_status: "not_required",
      risk_flags: [],
      two_factor_enabled: false,
      roles,
      created_at: now,
      updated_at: now,
      last_login_at: now,
    };
    await ref.set(profile);
    return profile;
  }

  const data = snap.data() as Profile;
  const nextRoles = Array.from(new Set([...(data.roles ?? []), ...(isAdminEmail(email) ? (["admin"] as UserRole[]) : [])]));
  const updated: Profile = {
    ...data,
    id: uid,
    email,
    roles: nextRoles,
    last_login_at: now,
    updated_at: now,
  };
  await ref.set(updated, { merge: true });
  return updated;
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<Profile, "id">) };
}
