import { createHash } from "node:crypto";

/**
 * Kişisel veri saklamadan "aynı kişi mi?" sorusunu cevaplamak için tek yönlü özet.
 * IP ve tarayıcı bilgisi gizli bir tuzla birlikte özetlenir; ham hâlleri kaydedilmez.
 */
export function visitorHash(headers: Headers, scope: string): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "yerel";
  const ua = headers.get("user-agent") ?? "";
  const salt = process.env.AUTH_SECRET || "pamuk-haber-dev-salt";
  return createHash("sha256").update(`${salt}|${scope}|${ip}|${ua}`).digest("hex").slice(0, 32);
}
