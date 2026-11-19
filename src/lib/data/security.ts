"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { nowIso, setDoc } from "@/lib/firebase/db";

export async function toggleTwoFactorAction(formData: FormData) {
  const { authId, profile } = await requireUser();
  const enabled = String(formData.get("enabled") ?? "") === "true";
  await setDoc("users", authId, {
    two_factor_enabled: enabled,
    updated_at: nowIso(),
  });
  void profile;
  redirect("/dashboard/security");
}
