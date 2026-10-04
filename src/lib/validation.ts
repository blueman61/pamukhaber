import { isCategory, type CategorySlug } from "./categories";
import { MEDIA_TYPES, youtubeId, type MediaType } from "./media";

export const TITLE_MAX = 90;
export const SUMMARY_MAX = 320;

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
  }

  if (sourceUrl && !isHttpUrl(sourceUrl)) errors.sourceUrl = "Geçerli bir kaynak bağlantısı girin.";
  if (!isSponsored && !sourceUrl) errors.sourceUrl = "Haberin kaynağına bağlantı vermek zorunlu.";

  if (isSponsored) {
    if (!sponsorName) errors.sponsorName = "Sponsorlu içerikte sponsor adı zorunlu.";
    if (sponsorUrl && !isHttpUrl(sponsorUrl)) errors.sponsorUrl = "Geçerli bir sponsor bağlantısı girin.";
  }

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
    },
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}
