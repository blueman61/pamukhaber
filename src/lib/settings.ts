import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

/** Panelden değiştirilebilen ayarlar. Boşsa eski ortam değişkenine düşülür. */
export const SETTING_KEYS = ["support_url", "contact_email", "gemini_model", "github_repo"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

const ENV_FALLBACK: Partial<Record<SettingKey, string | undefined>> = {
  support_url: process.env.NEXT_PUBLIC_SUPPORT_URL,
  contact_email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  gemini_model: process.env.GEMINI_MODEL,
};

export type SiteSettings = Record<SettingKey, string>;

export async function getSettings(): Promise<SiteSettings> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await db.select().from(settings).where(inArray(settings.key, [...SETTING_KEYS]));
  } catch {
    // Tablo henüz yoksa (migration öncesi) ortam değişkenleriyle devam et.
  }
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as SiteSettings;
  for (const key of SETTING_KEYS) out[key] = (stored.get(key) ?? ENV_FALLBACK[key] ?? "").trim();
  return out;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const v = value.trim();
  if (!v) {
    await db.delete(settings).where(eq(settings.key, key));
    return;
  }
  await db.insert(settings).values({ key, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
}
