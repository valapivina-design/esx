import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** True when Auth/Firestore emulators are targeted (local E2E without a live project). */
export function useFirebaseEmulator(): boolean {
  return (
    process.env.USE_FIREBASE_EMULATOR === "1" ||
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST)
  );
}

function parseServiceAccountJson(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount & { private_key?: string };
    if (parsed.private_key) {
      parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
    }
    return parsed;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
}

export function isFirebaseConfigured(): boolean {
  if (useFirebaseEmulator() && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return true;
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return true;
  }
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  );
}

let app: App | undefined;

export function getAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "demo-escrow";

  if (useFirebaseEmulator()) {
    // Emulators accept unauthenticated Admin SDK (no service account).
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
    process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
    process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= "127.0.0.1:9199";
    app = initializeApp({
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });
    return app;
  }

  const fromJson = parseServiceAccountJson();
  const storageBucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (fromJson?.projectId ? `${fromJson.projectId}.appspot.com` : undefined);

  if (fromJson) {
    app = initializeApp({
      credential: cert(fromJson),
      projectId: fromJson.projectId || projectId,
      storageBucket,
    });
    return app;
  }

  const privateKey = requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");
  app = initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_ADMIN_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  return app;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export function adminStorage() {
  return getStorage(getAdminApp());
}

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "admin@101escrowservices.net")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
