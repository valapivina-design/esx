"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminStorage } from "@/lib/firebase/admin";
import { addDoc, nowIso, setDoc } from "@/lib/firebase/db";

const DOCUMENT_FIELDS = [
  "id_document",
  "passport",
  "proof_of_address",
  "selfie",
  "liveness_check",
] as const;

async function uploadKycFile(authId: string, field: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  try {
    const ext = file.name.split(".").pop() || "bin";
    const path = `kyc/${authId}/${field}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = adminStorage().bucket();
    const f = bucket.file(path);
    await f.save(buffer, { contentType: file.type || "application/octet-stream", resumable: false });
    return path;
  } catch (err) {
    // Storage may be unavailable (e.g. Blaze not enabled). Never fail the KYC UX —
    // the submission still proceeds; files are simply not persisted.
    console.warn(`[kyc] storage upload skipped for ${field}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

function fileMeta(file: File | null): { name: string; size: number; type: string } | null {
  if (!file || file.size === 0) return null;
  return { name: file.name, size: file.size, type: file.type || "application/octet-stream" };
}

export async function submitKycAction(formData: FormData) {
  const { authId } = await requireUser();
  const phone = String(formData.get("phone") ?? "").trim();

  const files: Record<string, File | null> = {};
  const uploaded: Record<string, string | null> = {};
  for (const field of DOCUMENT_FIELDS) {
    const file = formData.get(field) as File | null;
    files[field] = file && file.size > 0 ? file : null;
    uploaded[field] = files[field] ? await uploadKycFile(authId, field, files[field]!) : null;
  }

  const provided = DOCUMENT_FIELDS.filter((f) => files[f]);
  const stored = DOCUMENT_FIELDS.filter((f) => uploaded[f]);
  const filesNotPersisted = provided.length > 0 && stored.length === 0;

  const now = nowIso();
  await addDoc("kycSubmissions", {
    user_id: authId,
    status: "pending",
    id_document_url: uploaded.id_document,
    passport_url: uploaded.passport,
    national_id_url: null,
    proof_of_address_url: uploaded.proof_of_address,
    selfie_url: uploaded.selfie,
    liveness_check_url: uploaded.liveness_check,
    // Keep filenames so admin/compliance can see what the user submitted even if Storage is off.
    document_meta: Object.fromEntries(
      DOCUMENT_FIELDS.map((f) => [f, fileMeta(files[f])])
    ),
    compliance_notes: filesNotPersisted
      ? "Documents were submitted by the user but not stored (Firebase Storage unavailable)."
      : null,
    reviewed_by: null,
    reviewed_at: null,
    submitted_at: now,
    updated_at: now,
  });

  await setDoc("users", authId, {
    kyc_status: "pending",
    ...(phone ? { phone } : {}),
    updated_at: now,
  });

  redirect("/dashboard/kyc");
}
