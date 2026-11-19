import { ADMIN_EMAILS } from "@/lib/firebase/admin";
import { addDoc, getDoc, nowIso, queryCollection, setDoc } from "@/lib/firebase/db";
import type { EscrowContract, Profile } from "@/lib/types";

/** Pick a default escrow officer from registered admin users. */
export async function findDefaultEscrowOfficer(): Promise<Profile | null> {
  const byRole = await queryCollection<Profile>("users", (ref) =>
    ref.where("roles", "array-contains", "admin").limit(5)
  );
  if (byRole.length > 0) return byRole[0];

  const emails = ADMIN_EMAILS.filter(Boolean);
  for (const email of emails) {
    const rows = await queryCollection<Profile>("users", (ref) =>
      ref.where("email", "==", email).limit(1)
    );
    if (rows[0]) return rows[0];
  }
  return null;
}

/**
 * Ensure the contract has an escrow_officer_id and a participant row.
 * Prefer `preferredOfficerId` (e.g. acting admin); else first registered admin.
 */
export async function ensureContractOfficer(
  contractId: string,
  preferredOfficerId?: string | null
): Promise<string | null> {
  const contract = await getDoc<EscrowContract>("contracts", contractId);
  if (!contract) return null;
  if (contract.escrow_officer_id) return contract.escrow_officer_id;

  let officerId = preferredOfficerId ?? null;
  if (!officerId) {
    const officer = await findDefaultEscrowOfficer();
    officerId = officer?.id ?? null;
  }
  if (!officerId) return null;

  await setDoc("contracts", contractId, {
    escrow_officer_id: officerId,
    updated_at: nowIso(),
  });

  const existing = await queryCollection<{ id: string; user_id: string; role: string }>(
    "participants",
    (ref) =>
      ref
        .where("contract_id", "==", contractId)
        .where("user_id", "==", officerId)
        .where("role", "==", "escrow_officer")
        .limit(1)
  );
  if (existing.length === 0) {
    await addDoc("participants", {
      contract_id: contractId,
      user_id: officerId,
      role: "escrow_officer",
      joined_at: nowIso(),
    });
  }

  return officerId;
}
