import { getDoc, queryCollection } from "@/lib/firebase/db";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import type {
  AuditLog,
  ContractInvite,
  ContractMessage,
  Dispute,
  EscrowContract,
  KycSubmission,
  Profile,
  TimelineEvent,
  WalletAddress,
  BalanceTransaction,
} from "@/lib/types";

export function assertDb() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured. Add credentials to .env.local.");
  }
}

export async function getContract(id: string) {
  return getDoc<EscrowContract>("contracts", id);
}

export async function getInviteByToken(token: string) {
  return getDoc<ContractInvite>("invites", token);
}

export async function listContracts() {
  return queryCollection<EscrowContract>("contracts", (ref) => ref.orderBy("created_at", "desc"));
}

export async function listUsers() {
  return queryCollection<Profile>("users", (ref) => ref.orderBy("created_at", "desc"));
}

export async function getUser(id: string) {
  return getDoc<Profile>("users", id);
}

export async function listMessages(contractId: string) {
  return queryCollection<ContractMessage>("messages", (ref) =>
    ref.where("contract_id", "==", contractId).orderBy("created_at", "asc")
  );
}

export async function listTimeline(contractId: string) {
  return queryCollection<TimelineEvent>("timeline", (ref) =>
    ref.where("contract_id", "==", contractId).orderBy("created_at", "asc")
  );
}

export async function listInvites(contractId: string) {
  return queryCollection<ContractInvite>("invites", (ref) =>
    ref.where("contract_id", "==", contractId).orderBy("created_at", "desc")
  );
}

export async function listPlatformWallets() {
  return queryCollection<WalletAddress>("wallets", (ref) =>
    ref.where("is_platform_wallet", "==", true).orderBy("created_at", "desc")
  );
}

export async function getPlatformWalletForAsset(asset: string) {
  const rows = await queryCollection<WalletAddress>("wallets", (ref) =>
    ref.where("crypto_asset", "==", asset).where("is_platform_wallet", "==", true).limit(1)
  );
  return rows[0] ?? null;
}

export async function listPendingKyc() {
  return queryCollection<KycSubmission>("kycSubmissions", (ref) =>
    ref.where("status", "==", "pending").orderBy("submitted_at", "desc")
  );
}

export async function queryAllKyc() {
  return queryCollection<KycSubmission>("kycSubmissions", (ref) =>
    ref.orderBy("submitted_at", "desc")
  );
}

export async function listKycForUser(userId: string) {
  return queryCollection<KycSubmission>("kycSubmissions", (ref) =>
    ref.where("user_id", "==", userId).orderBy("submitted_at", "desc")
  );
}

export async function listDisputes() {
  return queryCollection<Dispute>("disputes", (ref) => ref.orderBy("created_at", "desc"));
}

export async function getDispute(id: string) {
  return getDoc<Dispute>("disputes", id);
}

export async function listAuditLogs() {
  return queryCollection<AuditLog>("auditLogs", (ref) => ref.orderBy("created_at", "desc").limit(200));
}

export async function listPendingBalanceTx() {
  return queryCollection<BalanceTransaction>("balanceTransactions", (ref) =>
    ref.where("status", "==", "pending").orderBy("created_at", "desc")
  );
}

export async function listSettings() {
  return queryCollection<{ id: string; key?: string; value: string }>("settings", (ref) => ref);
}

export async function listAdminNotes(contractId: string) {
  return queryCollection<{ id: string; body: string; author_id: string; created_at: string }>("adminNotes", (ref) =>
    ref.where("contract_id", "==", contractId).orderBy("created_at", "desc")
  );
}
