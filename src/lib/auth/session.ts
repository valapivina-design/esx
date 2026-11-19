import { redirect } from "next/navigation";
import { ensureUserProfile, getProfile, getSessionUid } from "@/lib/firebase/session";
import { adminAuth, isFirebaseConfigured } from "@/lib/firebase/admin";
import type { Profile, UserRole } from "@/lib/types";

export async function getCurrentUser() {
  if (!isFirebaseConfigured()) return null;
  const uid = await getSessionUid();
  if (!uid) return null;

  let profile = await getProfile(uid);
  if (!profile) {
    try {
      const user = await adminAuth().getUser(uid);
      profile = await ensureUserProfile(uid, user.email ?? "", user.displayName ?? undefined);
    } catch {
      return null;
    }
  }

  return {
    authId: uid,
    profile: profile as Profile,
    roles: (profile.roles ?? []) as UserRole[],
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin-login");
  if (!user.roles.includes("admin")) redirect("/admin-login");
  return user;
}
