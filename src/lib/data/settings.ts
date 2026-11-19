"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { nowIso, setDoc } from "@/lib/firebase/db";
import { logAdminAction } from "@/lib/data/audit";

export async function updateSettingAction(key: string, formData: FormData) {
  const { authId } = await requireAdmin();
  const value = String(formData.get("value") ?? "");
  await setDoc("settings", key, {
    key,
    value,
    updated_at: nowIso(),
    updated_by: authId,
  });
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action: "edit_contract",
    entityType: "platform_setting",
    entityId: key,
    newValue: { value },
    reason: "Updated platform setting",
  });
  redirect("/admin/settings");
}
