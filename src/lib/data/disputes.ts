"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth/session";
import { addDoc, nowIso, setDoc } from "@/lib/firebase/db";
import { logAdminAction, addTimelineEvent } from "@/lib/data/audit";

export async function sendDisputeMessageAction(disputeId: string, formData: FormData) {
  const { authId, roles } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await addDoc("disputeMessages", {
    dispute_id: disputeId,
    sender_id: authId,
    body,
    is_staff: roles.includes("admin"),
    created_at: nowIso(),
  });
  revalidatePath(`/admin/disputes/${disputeId}`);
}

export async function proposeSettlementAction(disputeId: string, contractId: string, formData: FormData) {
  const { authId } = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect(`/admin/disputes/${disputeId}?error=${encodeURIComponent("A reason is required.")}`);
  const proposal = String(formData.get("proposal") ?? "");
  await addDoc("settlementProposals", {
    dispute_id: disputeId,
    proposed_by: authId,
    proposal,
    status: "pending",
    created_at: nowIso(),
  });
  await setDoc("disputes", disputeId, { status: "settlement_proposed" });
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action: "propose_settlement",
    entityType: "dispute",
    entityId: disputeId,
    reason,
  });
  redirect(`/admin/disputes/${disputeId}`);
}

export async function respondSettlementAction(disputeId: string, formData: FormData) {
  await requireUser();
  const response = String(formData.get("response") ?? "");
  await setDoc("disputes", disputeId, { party_response: response });
  redirect(`/admin/disputes/${disputeId}`);
}

export async function closeDisputeAction(disputeId: string, contractId: string, formData: FormData) {
  const { authId } = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect(`/admin/disputes/${disputeId}?error=${encodeURIComponent("A reason is required.")}`);
  const resolution = String(formData.get("resolution") ?? reason);
  await setDoc("disputes", disputeId, {
    status: "closed",
    resolution,
    closed_at: nowIso(),
  });
  await setDoc("contracts", contractId, { status: "resolved", updated_at: nowIso() });
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action: "close_dispute",
    entityType: "dispute",
    entityId: disputeId,
    reason,
  });
  await addTimelineEvent({
    contractId,
    actorId: authId,
    eventType: "dispute_closed",
    description: `Dispute closed. ${resolution}`,
  });
  redirect(`/admin/disputes/${disputeId}`);
}
