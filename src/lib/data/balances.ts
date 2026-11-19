"use server";

import { redirect } from "next/navigation";
import { requireUser, requireAdmin } from "@/lib/auth/session";
import { addDoc, getDoc, nowIso, queryCollection, setDoc } from "@/lib/firebase/db";
import type { BalanceTransaction, CryptoAsset, UserBalance } from "@/lib/types";

export async function getBalances(userId: string) {
  return queryCollection<UserBalance>("balances", (ref) => ref.where("user_id", "==", userId));
}

export async function getBalanceHistory(userId: string) {
  return queryCollection<BalanceTransaction>("balanceTransactions", (ref) =>
    ref.where("user_id", "==", userId).orderBy("created_at", "desc")
  );
}

export async function requestDepositAction(formData: FormData) {
  const { authId } = await requireUser();
  const asset = String(formData.get("asset") ?? "") as CryptoAsset;
  const amount = Number(formData.get("amount") ?? 0);
  const txHash = String(formData.get("tx_hash") ?? "").trim() || null;
  if (!asset || !(amount > 0)) {
    redirect(`/dashboard/wallet?error=${encodeURIComponent("Choose an asset and a positive amount.")}`);
  }
  await addDoc("balanceTransactions", {
    user_id: authId,
    asset,
    amount,
    type: "deposit_request",
    status: "pending",
    tx_hash: txHash,
    reviewed_by: null,
    reviewed_at: null,
    created_at: nowIso(),
  });
  redirect("/dashboard/wallet?ok=requested");
}

export async function approveDepositAction(txId: string) {
  const { authId } = await requireAdmin();
  const tx = await getDoc<BalanceTransaction>("balanceTransactions", txId);
  if (!tx || tx.status !== "pending") {
    redirect("/admin/balances?error=Already+processed");
  }
  await setDoc("balanceTransactions", txId, {
    status: "approved",
    reviewed_by: authId,
    reviewed_at: nowIso(),
  });

  const balanceId = `${tx.user_id}_${tx.asset}`;
  const existing = await getDoc<UserBalance>("balances", balanceId);
  const available = (existing?.available ?? 0) + tx.amount;
  await setDoc("balances", balanceId, {
    user_id: tx.user_id,
    asset: tx.asset,
    available,
    updated_at: nowIso(),
  });
  redirect("/admin/balances?ok=approved");
}

export async function rejectDepositAction(txId: string) {
  const { authId } = await requireAdmin();
  await setDoc("balanceTransactions", txId, {
    status: "rejected",
    reviewed_by: authId,
    reviewed_at: nowIso(),
  });
  redirect("/admin/balances?ok=rejected");
}

export async function adjustBalanceAction(formData: FormData) {
  const { authId } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const asset = String(formData.get("asset") ?? "") as CryptoAsset;
  const amount = Number(formData.get("amount") ?? 0);
  if (!userId || !asset || !amount) {
    redirect(`/admin/balances?error=${encodeURIComponent("User, asset and a non-zero amount are required.")}`);
  }
  await addDoc("balanceTransactions", {
    user_id: userId,
    asset,
    amount,
    type: "admin_adjustment",
    status: "approved",
    reviewed_by: authId,
    reviewed_at: nowIso(),
    created_at: nowIso(),
  });
  const balanceId = `${userId}_${asset}`;
  const existing = await getDoc<UserBalance>("balances", balanceId);
  await setDoc("balances", balanceId, {
    user_id: userId,
    asset,
    available: (existing?.available ?? 0) + amount,
    updated_at: nowIso(),
  });
  redirect("/admin/balances?ok=adjusted");
}
