"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getDoc, nowIso, queryCollection, setDoc } from "@/lib/firebase/db";
import { logAdminAction } from "@/lib/data/audit";
import type { AdminActionType, KycStatus, Profile } from "@/lib/types";

const ACCOUNT_ACTIONS: Partial<Record<AdminActionType, Profile["account_status"]>> = {
  enable_user: "active",
  reactivate_user: "active",
  disable_user: "disabled",
  suspend_user: "suspended",
};

const KYC_STATUS_ACTIONS: Partial<Record<AdminActionType, KycStatus>> = {
  approve_kyc: "approved",
  reject_kyc: "rejected",
  request_more_kyc_info: "needs_more_info",
};

export async function performUserActionAction(userId: string, action: AdminActionType, formData: FormData) {
  const { authId } = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    redirect(`/admin/users/${userId}?error=${encodeURIComponent("A reason is required for this action.")}`);
  }

  const before = await getDoc<Profile>("users", userId);
  const update: Record<string, unknown> = { updated_at: nowIso() };

  if (ACCOUNT_ACTIONS[action]) update.account_status = ACCOUNT_ACTIONS[action];
  if (action === "verify_user") update.is_verified = true;
  if (action === "unverify_user") update.is_verified = false;
  if (KYC_STATUS_ACTIONS[action]) {
    update.kyc_status = KYC_STATUS_ACTIONS[action];
    const subs = await queryCollection<{ id: string }>("kycSubmissions", (ref) =>
      ref.where("user_id", "==", userId).orderBy("submitted_at", "desc").limit(1)
    );
    if (subs[0]) {
      await setDoc("kycSubmissions", subs[0].id, {
        status: KYC_STATUS_ACTIONS[action],
        reviewed_by: authId,
        reviewed_at: nowIso(),
        compliance_notes: reason,
        updated_at: nowIso(),
      });
    }
  }

  await setDoc("users", userId, update);
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action,
    entityType: "profile",
    entityId: userId,
    oldValue: before,
    newValue: update,
    reason,
  });
  redirect(`/admin/users/${userId}`);
}
