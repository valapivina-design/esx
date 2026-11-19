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
  const ext = file.name.split(".").pop() || "bin";
  const path = `kyc/${authId}/${field}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = adminStorage().bucket();
  const f = bucket.file(path);
  await f.save(buffer, { contentType: file.type || "application/octet-stream", resumable: false });
  return path;
}

export async function submitKycAction(formData: FormData) {
  const { authId } = await requireUser();
  const phone = String(formData.get("phone") ?? "").trim();

  const uploaded: Record<string, string | null> = {};
  for (const field of DOCUMENT_FIELDS) {
    const file = formData.get(field) as File | null;
    uploaded[field] = file ? await uploadKycFile(authId, field, file) : null;
  }

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
    compliance_notes: null,
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
