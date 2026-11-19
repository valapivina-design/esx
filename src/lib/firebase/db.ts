import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import type { DocumentData } from "firebase-admin/firestore";

export function newId(): string {
  return randomUUID().replace(/-/g, "");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function contractNumber(): string {
  const year = new Date().getFullYear();
  const n = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `ESC-${year}-${n}`;
}

export async function getDoc<T extends DocumentData>(
  collection: string,
  id: string
): Promise<(T & { id: string }) | null> {
  const snap = await adminDb().collection(collection).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as T) };
}

export async function setDoc(collection: string, id: string, data: DocumentData) {
  await adminDb().collection(collection).doc(id).set(data, { merge: true });
}

export async function addDoc(collection: string, data: DocumentData): Promise<string> {
  const id = newId();
  await adminDb().collection(collection).doc(id).set({ ...data, id });
  return id;
}

export async function deleteDoc(collection: string, id: string) {
  await adminDb().collection(collection).doc(id).delete();
}

export async function queryCollection<T extends DocumentData>(
  collection: string,
  build: (ref: FirebaseFirestore.CollectionReference) => FirebaseFirestore.Query
): Promise<(T & { id: string })[]> {
  const snap = await build(adminDb().collection(collection)).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}
