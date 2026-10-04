import { and, count, eq, gt } from "drizzle-orm";
import type { Db } from "@/db";
import { candidates } from "@/db/schema";
import { fetchText, findOgImage, findOgTitle, normalizeUrl, type FetchLike } from "./ingest";
import { scorePositivity } from "./positivity";
import { normalizeEmail, NOTE_MAX } from "./validation";

export const DAILY_SUBMISSION_LIMIT = 5;

/**
 * Sunucunun okurdan gelen bir adresi çekmesi güvenli mi? Yerel ağ ve IP
 * adreslerini (SSRF) reddeder; yalnızca alan adlı, herkese açık http(s) adresleri.
 */
export function isSafePublicUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (u.username || u.password) return false;
    if (u.port && u.port !== "80" && u.port !== "443") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return false; // IP adresi
    return host.includes(".");
  } catch {
    return false;
  }
}

/** Yönlendirmeleri elle izleyip her adımda adresi yeniden denetleyen fetch. */
export const safePublicFetch: FetchLike = async (url, init) => {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    if (!isSafePublicUrl(current)) throw new Error("Güvenli olmayan adres");
    const res = await fetch(current, { ...init, redirect: "manual" });
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) return res;
    current = new URL(location, current).toString();
  }
  throw new Error("Çok fazla yönlendirme");
};

export type SubmissionInput = {
  url: string;
  note: string;
  name: string | null;
  allowName: boolean;
  email: string | null;
  submitterHash: string;
};

export type SubmissionResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string; field?: "url" | "note" | "email" };

export function parseSubmissionForm(form: FormData, submitterHash: string): SubmissionInput | SubmissionResult {
  const s = (k: string) => (typeof form.get(k) === "string" ? String(form.get(k)).trim() : "");
  // Bal küpü: botlar gizli alanı doldurur.
  if (s("website")) return { ok: true, duplicate: false };
  const url = normalizeUrl(s("url"));
  if (!url || !isSafePublicUrl(url)) return { ok: false, field: "url", error: "Geçerli bir haber bağlantısı girin." };
  const note = s("note");
  if (note.length < 10) return { ok: false, field: "note", error: "Haberin neden güzel olduğunu birkaç kelimeyle anlat." };
  if (note.length > NOTE_MAX) return { ok: false, field: "note", error: `Açıklama en fazla ${NOTE_MAX} karakter olabilir.` };
  const rawEmail = s("email");
  const email = rawEmail ? normalizeEmail(rawEmail) : null;
  if (rawEmail && !email) return { ok: false, field: "email", error: "E-posta adresi geçersiz." };
  return {
    url,
    note,
    name: s("name").slice(0, 60) || null,
    allowName: form.get("allowName") === "on",
    email,
    submitterHash,
  };
}

export async function submitStory(db: Db, input: SubmissionInput, fetchImpl: FetchLike = safePublicFetch): Promise<SubmissionResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ value: recent }] = await db
    .select({ value: count() })
    .from(candidates)
    .where(and(eq(candidates.submitterHash, input.submitterHash), gt(candidates.createdAt, since)));
  if (recent >= DAILY_SUBMISSION_LIMIT) {
    return { ok: false, error: "Bugünlük gönderim sınırına ulaştın. Yarın tekrar dene, teşekkürler! 💛" };
  }

  let title: string | null = null;
  let imageUrl: string | null = null;
  try {
    const html = await fetchText(input.url, fetchImpl);
    title = findOgTitle(html);
    imageUrl = findOgImage(html);
  } catch {
    // Sayfa çekilemezse editör yine de bağlantıyı açıp bakabilir.
  }
  const fallbackTitle = input.note.split(/[.!?\n]/)[0].slice(0, 120);

  const inserted = await db
    .insert(candidates)
    .values({
      url: input.url,
      title: (title || fallbackTitle).slice(0, 300),
      excerpt: input.note,
      imageUrl,
      score: scorePositivity(`${title ?? ""} ${input.note}`),
      origin: "reader",
      submitterName: input.allowName ? input.name : null,
      submitterEmail: input.email,
      submitterNote: input.note,
      submitterHash: input.submitterHash,
    })
    .onConflictDoNothing()
    .returning({ id: candidates.id });

  return { ok: true, duplicate: inserted.length === 0 };
}
