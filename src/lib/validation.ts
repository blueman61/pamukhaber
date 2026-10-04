import { isCategory, type CategorySlug } from "./categories";
import { instagramShortcode, MEDIA_TYPES, tiktokId, youtubeId, type MediaType } from "./media";

export const TITLE_MAX = 90;
export const SUMMARY_MAX = 320;
export const NOTE_MAX = 500;
export const EXTRA_SOURCES_MAX = 5;

export const ORIGINS = ["editor", "reader", "partner"] as const;
export type Origin = (typeof ORIGINS)[number];
export const VERIFICATIONS = ["verified", "source", "unverified"] as const;
export type Verification = (typeof VERIFICATIONS)[number];

export type StoryInput = {
  title: string;
  summary: string;
  category: CategorySlug;
  mediaType: MediaType;
  mediaUrl: string | null;
  mediaCredit: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  isSponsored: boolean;
  sponsorName: string | null;
  sponsorUrl: string | null;
  origin: Origin;
  submitterName: string | null;
  verification: Verification;
  verificationNote: string | null;
  extraSources: string | null;
  aiAssisted: boolean;
};

export type FieldErrors = Partial<Record<keyof StoryInput, string>>;

export type ValidationResult = { ok: true; data: StoryInput } | { ok: false; errors: FieldErrors };

const str = (v: FormDataEntryValue | null | undefined) => (typeof v === "string" ? v.trim() : "");
const opt = (v: FormDataEntryValue | null | undefined) => str(v) || null;

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateStoryForm(form: FormData): ValidationResult {
  const errors: FieldErrors = {};
  const title = str(form.get("title"));
  const summary = str(form.get("summary"));
  const category = str(form.get("category"));
  const mediaTypeRaw = str(form.get("mediaType")) || "none";
  const mediaUrl = opt(form.get("mediaUrl"));
  const sourceUrl = opt(form.get("sourceUrl"));
  const isSponsored = form.get("isSponsored") === "on";
  const sponsorName = opt(form.get("sponsorName"));
  const sponsorUrl = opt(form.get("sponsorUrl"));

  if (!title) errors.title = "Başlık gerekli.";
  else if (title.length > TITLE_MAX) errors.title = `Başlık en fazla ${TITLE_MAX} karakter olmalı.`;

  if (!summary) errors.summary = "Özet gerekli.";
  else if (summary.length > SUMMARY_MAX) errors.summary = `Özet en fazla ${SUMMARY_MAX} karakter olmalı.`;

  if (!isCategory(category)) errors.category = "Geçerli bir kategori seçin.";

  const mediaType = (MEDIA_TYPES as readonly string[]).includes(mediaTypeRaw)
    ? (mediaTypeRaw as MediaType)
    : "none";
  if (mediaType !== "none") {
    if (!mediaUrl || !isHttpUrl(mediaUrl)) errors.mediaUrl = "Geçerli bir medya bağlantısı girin.";
    else if (mediaType === "youtube" && !youtubeId(mediaUrl)) errors.mediaUrl = "Geçerli bir YouTube bağlantısı girin.";
    else if (mediaType === "tiktok" && !tiktokId(mediaUrl))
      errors.mediaUrl = "Geçerli bir TikTok video bağlantısı girin (tiktok.com/@kullanici/video/…).";
    else if (mediaType === "instagram" && !instagramShortcode(mediaUrl))
      errors.mediaUrl = "Geçerli bir Instagram Reels bağlantısı girin (instagram.com/reel/…).";
  }

  if (sourceUrl && !isHttpUrl(sourceUrl)) errors.sourceUrl = "Geçerli bir kaynak bağlantısı girin.";
  if (!isSponsored && !sourceUrl) errors.sourceUrl = "Haberin kaynağına bağlantı vermek zorunlu.";

  if (isSponsored) {
    if (!sponsorName) errors.sponsorName = "Sponsorlu içerikte sponsor adı zorunlu.";
    if (sponsorUrl && !isHttpUrl(sponsorUrl)) errors.sponsorUrl = "Geçerli bir sponsor bağlantısı girin.";
  }

  const originRaw = str(form.get("origin"));
  const origin: Origin = (ORIGINS as readonly string[]).includes(originRaw) ? (originRaw as Origin) : "editor";
  const verificationRaw = str(form.get("verification"));
  const verification: Verification = (VERIFICATIONS as readonly string[]).includes(verificationRaw)
    ? (verificationRaw as Verification)
    : "source";
  const verificationNote = opt(form.get("verificationNote"));
  if (verificationNote && verificationNote.length > NOTE_MAX)
    errors.verificationNote = `Doğrulama notu en fazla ${NOTE_MAX} karakter olmalı.`;

  const extra = str(form.get("extraSources"))
    .split(/\s+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (extra.some((u) => !isHttpUrl(u))) errors.extraSources = "Ek kaynaklar geçerli bağlantılar olmalı (her satıra bir tane).";
  else if (extra.length > EXTRA_SOURCES_MAX) errors.extraSources = `En fazla ${EXTRA_SOURCES_MAX} ek kaynak eklenebilir.`;
  if (verification === "verified" && extra.length === 0)
    errors.verification = "\"Doğrulandı\" için ana kaynağa ek olarak en az bir bağımsız kaynak ekleyin.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      title,
      summary,
      category: category as CategorySlug,
      mediaType,
      mediaUrl: mediaType === "none" ? null : mediaUrl,
      mediaCredit: opt(form.get("mediaCredit")),
      sourceName: opt(form.get("sourceName")),
      sourceUrl,
      isSponsored,
      sponsorName: isSponsored ? sponsorName : null,
      sponsorUrl: isSponsored ? sponsorUrl : null,
      origin,
      submitterName: origin === "reader" ? opt(form.get("submitterName")) : null,
      verification,
      verificationNote,
      extraSources: extra.length ? [...new Set(extra)].join("\n") : null,
      aiAssisted: form.get("aiAssisted") === "on",
    },
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}
