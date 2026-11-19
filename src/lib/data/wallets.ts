"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { addDoc, deleteDoc, nowIso, setDoc } from "@/lib/firebase/db";
import type { CryptoAsset } from "@/lib/types";

export async function addWalletAction(formData: FormData) {
  await requireAdmin();
  const crypto_asset = String(formData.get("crypto_asset") ?? "") as CryptoAsset;
  const address = String(formData.get("address") ?? "").trim();
  const network = String(formData.get("network") ?? "").trim() || null;
  const label = String(formData.get("label") ?? "").trim() || null;
  if (!crypto_asset || !address) {
    redirect(`/admin/wallets?error=${encodeURIComponent("Asset and address are required.")}`);
  }
  await addDoc("wallets", {
    crypto_asset,
    address,
    network,
    label,
    is_platform_wallet: true,
    contract_id: null,
    created_at: nowIso(),
  });
  redirect("/admin/wallets?ok=added");
}

export async function updateWalletAction(walletId: string, formData: FormData) {
  await requireAdmin();
  const address = String(formData.get("address") ?? "").trim();
  if (!address) {
    redirect(`/admin/wallets?error=${encodeURIComponent("Address cannot be empty.")}`);
  }
  await setDoc("wallets", walletId, {
    address,
    network: String(formData.get("network") ?? "").trim() || null,
    label: String(formData.get("label") ?? "").trim() || null,
  });
  redirect("/admin/wallets?ok=updated");
}

export async function deleteWalletAction(walletId: string) {
  await requireAdmin();
  await deleteDoc("wallets", walletId);
  redirect("/admin/wallets?ok=deleted");
}
