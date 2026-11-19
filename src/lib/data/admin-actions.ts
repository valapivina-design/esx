"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { addDoc, contractNumber, getDoc, newId, nowIso, setDoc } from "@/lib/firebase/db";
import { logAdminAction, addTimelineEvent } from "@/lib/data/audit";
import { ensureContractOfficer } from "@/lib/data/officers";
import type { AdminActionType, ContractStatus, EscrowContract, PaymentStatus } from "@/lib/types";

const CONTRACT_STATUS_ACTIONS: Partial<Record<AdminActionType, ContractStatus>> = {
  mark_deposit_confirmed: "deposit_confirmed",
  mark_pending: "admin_reviewing",
  mark_complete: "completed",
  mark_incomplete: "awaiting_delivery",
  release_funds: "released",
  refund_funds: "refunded",
  pause_contract: "admin_reviewing",
  cancel_contract: "cancelled",
};

const PAYMENT_STATUS_ACTIONS: Partial<Record<AdminActionType, PaymentStatus>> = {
  mark_deposit_confirmed: "paid",
  mark_paid: "paid",
  mark_unpaid: "unpaid",
  mark_payment_failed: "failed",
  release_funds: "released",
  refund_funds: "refunded",
};

const ACTION_LABELS: Record<AdminActionType, string> = {
  mark_deposit_confirmed: "marked the deposit as confirmed",
  mark_pending: "marked the contract as pending review",
  mark_payment_failed: "marked the payment as failed",
  mark_paid: "marked the contract as paid",
  mark_unpaid: "marked the contract as unpaid",
  mark_complete: "marked the contract as complete",
  mark_incomplete: "marked the contract as incomplete",
  release_funds: "manually released funds to the seller",
  refund_funds: "manually refunded funds to the buyer",
  pause_contract: "paused the contract",
  cancel_contract: "cancelled the contract",
  lock_contract: "locked the contract",
  unlock_contract: "unlocked the contract",
  open_dispute: "opened a dispute",
  assign_mediator: "assigned a mediator",
  request_documents: "requested additional documents",
  add_internal_note: "added an internal note",
  verify_user: "verified the user",
  unverify_user: "unverified the user",
  enable_user: "enabled the user account",
  disable_user: "disabled the user account",
  suspend_user: "suspended the user account",
  reactivate_user: "reactivated the user account",
  approve_kyc: "approved KYC",
  reject_kyc: "rejected KYC",
  request_more_kyc_info: "requested more KYC information",
  create_contract: "created a contract manually",
  edit_contract: "edited the contract",
  reset_password: "triggered a password reset",
  join_chat: "joined the contract chat",
  send_official_message: "sent an official message",
  propose_settlement: "proposed a settlement",
  close_dispute: "closed the dispute",
};

export async function performContractActionAction(
  contractId: string,
  action: AdminActionType,
  formData: FormData
) {
  const { authId } = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    redirect(`/admin/contracts/${contractId}?error=${encodeURIComponent("A reason is required for this action.")}`);
  }
  const internalNote = String(formData.get("internal_note") ?? "").trim();
  const before = await getDoc<EscrowContract>("contracts", contractId);
  await ensureContractOfficer(contractId, authId);

  const update: Record<string, unknown> = { updated_at: nowIso() };
  if (CONTRACT_STATUS_ACTIONS[action]) update.status = CONTRACT_STATUS_ACTIONS[action];
  if (PAYMENT_STATUS_ACTIONS[action]) update.payment_status = PAYMENT_STATUS_ACTIONS[action];
  if (action === "lock_contract") update.is_locked = true;
  if (action === "unlock_contract") update.is_locked = false;
  if (action === "mark_deposit_confirmed") update.confirmations = (before?.confirmations ?? 0) + 1;

  await setDoc("contracts", contractId, update);
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action,
    entityType: "escrow_contract",
    entityId: contractId,
    oldValue: before ?? null,
    newValue: update,
    reason,
  });
  await addTimelineEvent({
    contractId,
    actorId: authId,
    eventType: action,
    description: `Admin ${ACTION_LABELS[action]}. Reason: ${reason}`,
  });

  if (internalNote) {
    await addDoc("adminNotes", {
      contract_id: contractId,
      author_id: authId,
      body: internalNote,
      created_at: nowIso(),
    });
  }

  redirect(`/admin/contracts/${contractId}`);
}

export async function addInternalNoteAction(contractId: string, formData: FormData) {
  const { authId } = await requireAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/admin/contracts/${contractId}`);
  await addDoc("adminNotes", {
    contract_id: contractId,
    author_id: authId,
    body,
    created_at: nowIso(),
  });
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action: "add_internal_note",
    entityType: "escrow_contract",
    entityId: contractId,
    reason: body,
  });
  redirect(`/admin/contracts/${contractId}`);
}

export async function adminSendMessageAction(contractId: string, formData: FormData) {
  const { authId } = await requireAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await addDoc("messages", {
    contract_id: contractId,
    sender_id: authId,
    message_type: "admin",
    body,
    is_official: true,
    created_at: nowIso(),
  });
  revalidatePath(`/admin/contracts/${contractId}`);
  revalidatePath(`/dashboard/contracts/${contractId}`);
}

export async function editContractAction(contractId: string, formData: FormData) {
  const { authId } = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    redirect(`/admin/contracts/${contractId}?error=${encodeURIComponent("A reason is required to edit a contract.")}`);
  }
  const before = await getDoc<EscrowContract>("contracts", contractId);
  const update = {
    title: String(formData.get("title") ?? before?.title),
    description: String(formData.get("description") ?? before?.description ?? ""),
    crypto_asset: String(formData.get("crypto_asset") ?? before?.crypto_asset),
    amount_crypto: Number(formData.get("amount_crypto") ?? before?.amount_crypto ?? 0) || null,
    amount_usd: Number(formData.get("amount_usd") ?? before?.amount_usd ?? 0),
    payment_network: String(formData.get("payment_network") ?? before?.payment_network ?? ""),
    deposit_address: String(formData.get("deposit_address") ?? before?.deposit_address ?? "") || null,
    updated_at: nowIso(),
  };
  await setDoc("contracts", contractId, update);
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action: "edit_contract",
    entityType: "escrow_contract",
    entityId: contractId,
    oldValue: before,
    newValue: update,
    reason,
  });
  redirect(`/admin/contracts/${contractId}`);
}

export async function setContractStatusAction(contractId: string, formData: FormData) {
  const { authId } = await requireAdmin();
  const status = String(formData.get("status") ?? "") as ContractStatus;
  const payment_status = String(formData.get("payment_status") ?? "") as PaymentStatus;
  const reason = String(formData.get("reason") ?? "").trim() || "Status updated by admin";
  const update: Record<string, unknown> = { updated_at: nowIso() };
  if (status) update.status = status;
  if (payment_status) update.payment_status = payment_status;
  await setDoc("contracts", contractId, update);
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action: "edit_contract",
    entityType: "escrow_contract",
    entityId: contractId,
    newValue: update,
    reason,
  });
  await addTimelineEvent({
    contractId,
    actorId: authId,
    eventType: "status_changed",
    description: `Admin set status to ${status}${payment_status ? ` / payment ${payment_status}` : ""}. Reason: ${reason}`,
  });
  redirect(`/admin/contracts/${contractId}`);
}

export async function createContractByAdminAction(formData: FormData) {
  const { authId } = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    redirect(`/admin/contracts/new?error=${encodeURIComponent("A reason is required to create a manual contract.")}`);
  }
  const id = newId();
  const now = nowIso();
  const contract: EscrowContract = {
    id,
    contract_number: contractNumber(),
    contract_type: "crypto",
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    buyer_id: String(formData.get("buyer_id") ?? "") || null,
    seller_id: String(formData.get("seller_id") ?? "") || null,
    escrow_officer_id: authId,
    mediator_id: null,
    crypto_asset: String(formData.get("crypto_asset") ?? "BTC") as EscrowContract["crypto_asset"],
    amount_crypto: Number(formData.get("amount_crypto") ?? 0) || null,
    amount_usd: Number(formData.get("amount_usd") ?? 0),
    payment_network: String(formData.get("payment_network") ?? "") || null,
    deposit_address: null,
    transaction_hash: null,
    confirmations: 0,
    status: "admin_reviewing",
    payment_status: "unpaid",
    kyc_requirement: "not_required",
    delivery_terms: null,
    inspection_period: null,
    release_conditions: null,
    dispute_terms: null,
    is_locked: false,
    created_by: authId,
    created_at: now,
    updated_at: now,
  };
  await setDoc("contracts", id, contract);
  await addDoc("participants", {
    contract_id: id,
    user_id: authId,
    role: "escrow_officer",
    joined_at: now,
  });
  if (contract.buyer_id) {
    await addDoc("participants", {
      contract_id: id,
      user_id: contract.buyer_id,
      role: "buyer",
      joined_at: now,
    });
  }
  if (contract.seller_id) {
    await addDoc("participants", {
      contract_id: id,
      user_id: contract.seller_id,
      role: "seller",
      joined_at: now,
    });
  }
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action: "create_contract",
    entityType: "escrow_contract",
    entityId: id,
    newValue: contract,
    reason,
  });
  redirect(`/admin/contracts/${id}`);
}

export async function assignMediatorAction(contractId: string, formData: FormData) {
  const { authId } = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    redirect(`/admin/contracts/${contractId}?error=${encodeURIComponent("A reason is required.")}`);
  }
  const mediatorId = String(formData.get("mediator_id") ?? "");
  await setDoc("contracts", contractId, {
    mediator_id: mediatorId,
    status: "under_mediation",
    updated_at: nowIso(),
  });
  const disputes = await (await import("@/lib/firebase/db")).queryCollection<{ id: string; contract_id: string }>(
    "disputes",
    (ref) => ref.where("contract_id", "==", contractId)
  );
  for (const d of disputes) {
    await setDoc("disputes", d.id, { mediator_id: mediatorId, status: "mediation" });
  }
  await logAdminAction({
    actorId: authId,
    actorRole: "admin",
    action: "assign_mediator",
    entityType: "escrow_contract",
    entityId: contractId,
    reason,
  });
  redirect(`/admin/contracts/${contractId}`);
}
