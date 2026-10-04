import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "pamuk_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

const DEV_SECRET = "pamuk-haber-dev-secret-degistir-beni";

function secretKey(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? DEV_SECRET : "");
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && secretKey() !== null;
}

export async function createSessionToken(): Promise<string> {
  const key = secretKey();
  if (!key) throw new Error("AUTH_SECRET tanımlı değil (en az 16 karakter olmalı).");
  return new SignJWT({ role: "editor" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const key = secretKey();
  if (!token || !key) return false;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.role === "editor";
  } catch {
    return false;
  }
}
