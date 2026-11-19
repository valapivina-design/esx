"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addDoc, contractNumber, getDoc, newId, nowIso, queryCollection, setDoc } from "@/lib/firebase/db";
import { addTimelineEvent } from "@/lib/data/audit";
import { findDefaultEscrowOfficer } from "@/lib/data/officers";
import type { ContractInvite, EscrowContract, MessageType } from "@/lib/types";

const KYC_THRESHOLD_USD = 100;

export async function createContractAction(formData: FormData) {
  const { authId } = await requireUser();
  const amountUsd = Number(formData.get("amount_usd") ?? 0);
  const kycRequirement = amountUsd > KYC_THRESHOLD_USD ? "required" : "not_required";
  const id = newId();
  const now = nowIso();

  const officer = await findDefaultEscrowOfficer();

  const contract: EscrowContract = {
    id,
    contract_number: contractNumber(),
    contract_type: "crypto",
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    buyer_id: authId,
    seller_id: null,
    escrow_officer_id: officer?.id ?? null,
    mediator_id: null,
    crypto_asset: String(formData.get("crypto_asset") ?? "BTC") as EscrowContract["crypto_asset"],
    amount_crypto: Number(formData.get("amount_crypto") ?? 0) || null,
    amount_usd: amountUsd,
    payment_network: String(formData.get("payment_network") ?? "") || null,
    deposit_address: null,
    transaction_hash: null,
    confirmations: 0,
    status: "waiting_for_seller",
    payment_status: "unpaid",
    kyc_requirement: kycRequirement,
    delivery_terms: String(formData.get("delivery_terms") ?? "") || null,
    inspection_period: String(formData.get("inspection_period") ?? "") || null,
    release_conditions: String(formData.get("release_conditions") ?? "") || null,
    dispute_terms: String(formData.get("dispute_terms") ?? "") || null,
    is_locked: false,
    created_by: authId,
    created_at: now,
    updated_at: now,
  };

  await setDoc("contracts", id, contract);
  await addDoc("participants", {
    contract_id: id,
    user_id: authId,
    role: "buyer",
    joined_at: now,
  });
  if (officer) {
    await addDoc("participants", {
      contract_id: id,
      user_id: officer.id,
      role: "escrow_officer",
      joined_at: now,
    });
  }
  await addTimelineEvent({
    contractId: id,
    actorId: authId,
    eventType: "contract_created",
    description: officer
      ? `Buyer created the escrow contract. Escrow officer ${officer.full_name} assigned.`
      : "Buyer created the escrow contract.",
  });

  const sellerEmail = String(formData.get("seller_email") ?? "");
  if (sellerEmail) {
    const token = newId();
    await setDoc("invites", token, {
      id: token,
      contract_id: id,
      token,
      seller_email: sellerEmail,
      invited_by: authId,
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      used_at: null,
      used_by: null,
      created_at: now,
    } satisfies ContractInvite);
  }

  redirect(`/dashboard/contracts/${id}`);
}

export async function generateInviteAction(contractId: string, formData: FormData) {
  const { authId } = await requireUser();
  const sellerEmail = String(formData.get("seller_email") ?? "");
  const token = newId();
  const now = nowIso();

  await setDoc("invites", token, {
    id: token,
    contract_id: contractId,
    token,
    seller_email: sellerEmail,
    invited_by: authId,
    status: "pending",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    used_at: null,
    used_by: null,
    created_at: now,
  } satisfies ContractInvite);

  await addTimelineEvent({
    contractId,
    actorId: authId,
    eventType: "invite_sent",
    description: `Buyer sent an invite link to ${sellerEmail}.`,
  });

  redirect(`/dashboard/contracts/${contractId}`);
}

export async function sendMessageAction(contractId: string, formData: FormData) {
  const { authId, roles } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const contract = await getDoc<EscrowContract>("contracts", contractId);
  if (!contract) return;

  let messageType: MessageType = "buyer";
  if (roles.includes("admin")) messageType = "admin";
  else if (roles.includes("mediator")) messageType = "mediator";
  else if (roles.includes("compliance")) messageType = "compliance";
  else if (contract.seller_id === authId) messageType = "seller";
  else if (contract.buyer_id === authId) messageType = "buyer";
  else return;

  const isOfficial =
    messageType === "admin" || messageType === "mediator" || messageType === "compliance";

  await addDoc("messages", {
    contract_id: contractId,
    sender_id: authId,
    message_type: messageType,
    body,
    is_official: isOfficial,
    created_at: nowIso(),
  });
  revalidatePath(`/dashboard/contracts/${contractId}`);
  revalidatePath(`/admin/contracts/${contractId}`);
}

export async function requestReleaseAction(contractId: string) {
  const { authId } = await requireUser();
  const contract = await getDoc<EscrowContract>("contracts", contractId);
  if (!contract || (contract.buyer_id !== authId && contract.seller_id !== authId)) {
    redirect("/dashboard");
  }

  await setDoc("contracts", contractId, {
    status: "release_requested",
    updated_at: nowIso(),
  });
  await addTimelineEvent({
    contractId,
    actorId: authId,
    eventType: "release_requested",
    description: "Buyer requested fund release. Awaiting admin review.",
  });
  redirect(`/dashboard/contracts/${contractId}`);
}

export async function openDisputeAction(contractId: string, formData: FormData) {
  const { authId } = await requireUser();
  const reason = String(formData.get("reason") ?? "");
  const contract = await getDoc<EscrowContract>("contracts", contractId);
  if (!contract || (contract.buyer_id !== authId && contract.seller_id !== authId)) {
    redirect("/dashboard");
  }

  await addDoc("disputes", {
    contract_id: contractId,
    opened_by: authId,
    mediator_id: null,
    reason,
    status: "open",
    resolution: null,
    created_at: nowIso(),
    closed_at: null,
  });
  await setDoc("contracts", contractId, { status: "disputed", updated_at: nowIso() });
  await addTimelineEvent({
    contractId,
    actorId: authId,
    eventType: "dispute_opened",
    description: "A dispute was opened on this contract.",
  });
  redirect(`/dashboard/contracts/${contractId}`);
}

export async function acceptInviteAction(token: string) {
  const { authId } = await requireUser();
  const invite = await getDoc<ContractInvite>("invites", token);
  if (!invite || invite.used_at || new Date(invite.expires_at) < new Date()) {
    redirect(`/invite/${token}?error=${encodeURIComponent("Invite is no longer valid")}`);
  }

  await setDoc("contracts", invite.contract_id, {
    seller_id: authId,
    status: "seller_joined",
    updated_at: nowIso(),
  });
  await addDoc("participants", {
    contract_id: invite.contract_id,
    user_id: authId,
    role: "seller",
    joined_at: nowIso(),
  });
  await setDoc("invites", token, {
    used_at: nowIso(),
    used_by: authId,
    status: "accepted",
  });
  await addTimelineEvent({
    contractId: invite.contract_id,
    actorId: authId,
    eventType: "seller_joined",
    description: "Seller accepted the invite and joined the contract.",
  });
  redirect(`/dashboard/contracts/${invite.contract_id}`);
}

export async function declineInviteAction(token: string) {
  await setDoc("invites", token, { status: "declined" });
  redirect(`/invite/${token}?declined=1`);
}

export async function submitPaymentHashAction(contractId: string, formData: FormData) {
  const { authId } = await requireUser();
  const txHash = String(formData.get("transaction_hash") ?? "");
  const contract = await getDoc<EscrowContract>("contracts", contractId);
  if (!contract || (contract.buyer_id !== authId && contract.seller_id !== authId)) {
    redirect("/dashboard");
  }

  await setDoc("contracts", contractId, {
    transaction_hash: txHash,
    status: "deposit_pending",
    payment_status: "pending",
    updated_at: nowIso(),
  });
  await addDoc("payments", {
    contract_id: contractId,
    payment_status: "pending",
    transaction_hash: txHash,
    submitted_by: authId,
    created_at: nowIso(),
  });
  await addTimelineEvent({
    contractId,
    actorId: authId,
    eventType: "payment_submitted",
    description: `Buyer submitted transaction hash ${txHash}.`,
  });
  redirect(`/dashboard/contracts/${contractId}`);
}

export async function markDepositSentAction(contractId: string, role: "buyer" | "seller") {
  const { authId } = await requireUser();
  const contract = await getDoc<EscrowContract>("contracts", contractId);
  if (!contract || (contract.buyer_id !== authId && contract.seller_id !== authId)) {
    redirect("/dashboard");
  }

  await setDoc("contracts", contractId, {
    status: "deposit_pending",
    payment_status: "pending",
    updated_at: nowIso(),
  });
  await addDoc("payments", {
    contract_id: contractId,
    payment_status: "pending",
    submitted_by: authId,
    created_at: nowIso(),
  });
  await addTimelineEvent({
    contractId,
    actorId: authId,
    eventType: "deposit_marked_sent",
    description: `${role === "buyer" ? "Buyer" : "Seller"} marked their deposit as sent. Awaiting manual confirmation by the escrow officer.`,
  });
  redirect(`/dashboard/contracts/${contractId}`);
}

export async function listUserContracts(userId: string) {
  const asBuyer = await queryCollection<EscrowContract>("contracts", (ref) =>
    ref.where("buyer_id", "==", userId)
  );
  const asSeller = await queryCollection<EscrowContract>("contracts", (ref) =>
    ref.where("seller_id", "==", userId)
  );
  const map = new Map<string, EscrowContract>();
  for (const c of [...asBuyer, ...asSeller]) map.set(c.id, c);
  return Array.from(map.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
