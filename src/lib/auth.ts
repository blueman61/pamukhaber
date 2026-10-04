import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Uzunluk sızdırmamak için iki tarafın da özetini karşılaştırıyoruz.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Sunucu eylemlerinde ikinci savunma hattı: proxy'ye ek olarak oturumu doğrular. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/giris");
}
