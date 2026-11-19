/**
 * Firebase Auth REST helpers for server actions (email/password).
 * Uses the public web API key — same key as the client SDK.
 * When USE_FIREBASE_EMULATOR=1, calls the Auth emulator instead of production.
 */

function apiKey(): string {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
  return key;
}

function authBaseUrl(): string {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (host || process.env.USE_FIREBASE_EMULATOR === "1") {
    const h = host || "127.0.0.1:9099";
    return `http://${h}/identitytoolkit.googleapis.com/v1`;
  }
  return "https://identitytoolkit.googleapis.com/v1";
}

type AuthRestError = { error?: { message?: string } };

async function postAuth<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${authBaseUrl()}/${path}?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & AuthRestError;
  if (!res.ok || data.error?.message) {
    throw new Error(friendlyAuthError(data.error?.message ?? "AUTH_ERROR"));
  }
  return data;
}

function friendlyAuthError(code: string): string {
  switch (code) {
    case "EMAIL_EXISTS":
      return "An account with this email already exists.";
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return "Invalid email or password.";
    case "USER_DISABLED":
      return "This account has been disabled.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Try again later.";
    case "WEAK_PASSWORD":
      return "Password should be at least 6 characters.";
    default:
      return code.replace(/_/g, " ").toLowerCase();
  }
}

export async function signInWithPassword(email: string, password: string) {
  return postAuth<{ idToken: string; localId: string; email: string }>("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function signUpWithPassword(email: string, password: string) {
  return postAuth<{ idToken: string; localId: string; email: string }>("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function sendPasswordReset(email: string) {
  return postAuth("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
  });
}

export async function resetPasswordWithOob(oobCode: string, newPassword: string) {
  return postAuth("accounts:resetPassword", {
    oobCode,
    newPassword,
  });
}
