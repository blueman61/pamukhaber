import { GoogleGenAI } from "@google/genai";
import { CATEGORIES, isCategory, type CategorySlug } from "./categories";
import { fetchText, stripHtml } from "./ingest";
import { isSafePublicUrl, safePublicFetch } from "./submissions";
import { SUMMARY_MAX, TITLE_MAX } from "./validation";

/**
 * Gemini ile editöre taslak ve doğrulama yardımı. Hiçbir şeyi otomatik yayınlamaz;
 * çıktı editör formuna öneri olarak gelir.
 */

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const ARTICLE_MAX_CHARS = 12_000;

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function geminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

let client: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) throw new AiError("GEMINI_API_KEY tanımlı değil.");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export class AiError extends Error {}

export type ArticleInput = { url: string | null; title: string; excerpt: string };

export type AiDraft = {
  title: string;
  summary: string;
  category: CategorySlug;
  isUplifting: boolean;
  concerns: string;
  claimsToVerify: string[];
};

export type Corroboration = { note: string; sources: { title: string; url: string }[] };

/** Testlerde gerçek API yerine sahte bir üretici verilebilir. */
export type Generator = {
  json: (system: string, prompt: string, schema: object) => Promise<string>;
  grounded: (prompt: string) => Promise<{ text: string; sources: { title: string; url: string }[] }>;
};

const geminiGenerator: Generator = {
  async json(system, prompt, schema) {
    const res = await gemini().models.generateContent({
      model: geminiModel(),
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature: 0.4,
      },
    });
    return res.text ?? "";
  },
  async grounded(prompt) {
    const res = await gemini().models.generateContent({
      model: geminiModel(),
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 },
    });
    const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = chunks
      .map((c) => c.web)
      .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri))
      .map((w) => ({ title: w.title || new URL(w.uri).hostname, url: w.uri }));
    return { text: res.text ?? "", sources };
  },
};

const SYSTEM = `Sen "Pamuk Haber" adlı, yalnızca iç ısıtan gerçek haberler yayınlayan Türkçe bir sitenin editör yardımcısısın.
Görevin: verilen haber metninden editöre TASLAK hazırlamak. Editör her şeyi kontrol edip düzeltecek.
Kurallar:
- Türkçe, sıcak ama abartısız, sade bir dil kullan. Tık tuzağı yok, ünlem yağmuru yok.
- Başlık en fazla ${TITLE_MAX}, özet en fazla ${SUMMARY_MAX} karakter.
- Özeti kendi cümlelerinle yaz; kaynak metinden cümle kopyalama.
- Metinde olmayan hiçbir bilgi, sayı, isim veya alıntı ekleme. Emin olmadığın şeyi yazma.
- Felaketin içindeki "güzel an"ı öne çıkarıp acıyı küçümseyen (toksik pozitif) bir dil kullanma; haber buna uygun değilse isUplifting=false yap ve nedenini concerns alanına yaz.
- claimsToVerify: editörün yayından önce teyit etmesi gereken somut iddialar (en fazla 4).
- Kategori şunlardan biri olmalı: ${CATEGORIES.map((c) => `${c.slug} (${c.label})`).join(", ")}.`;

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Türkçe başlık" },
    summary: { type: "string", description: "Türkçe, 2-3 cümlelik özet" },
    category: { type: "string", enum: CATEGORIES.map((c) => c.slug) },
    isUplifting: { type: "boolean", description: "Pamuk Haber'e uygun, gerçekten iç ısıtan bir haber mi?" },
    concerns: { type: "string", description: "Editörün dikkat etmesi gereken noktalar; yoksa boş" },
    claimsToVerify: { type: "array", items: { type: "string" }, maxItems: 4 },
  },
  required: ["title", "summary", "category", "isUplifting", "concerns", "claimsToVerify"],
};

/** Haber sayfasını çekip düz metne çevirir; olmazsa null. */
export async function fetchArticleText(url: string | null): Promise<string | null> {
  if (!url || !isSafePublicUrl(url)) return null;
  try {
    const html = await fetchText(url, safePublicFetch);
    const body = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
    const text = stripHtml(body);
    return text.length > 200 ? text.slice(0, ARTICLE_MAX_CHARS) : null;
  } catch {
    return null;
  }
}

const clip = (s: string, max: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
};

/** Model çıktısını güvenle ayrıştırır, sınırları uygular. */
export function parseDraft(raw: string): AiDraft {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new AiError("Yapay zekâ yanıtı okunamadı. Tekrar deneyin.");
  }
  const title = typeof data.title === "string" ? clip(data.title, TITLE_MAX) : "";
  const summary = typeof data.summary === "string" ? clip(data.summary, SUMMARY_MAX) : "";
  if (!title || !summary) throw new AiError("Yapay zekâ boş bir taslak döndürdü. Tekrar deneyin.");
  return {
    title,
    summary,
    category: isCategory(data.category) ? data.category : "iyilik",
    isUplifting: data.isUplifting !== false,
    concerns: typeof data.concerns === "string" ? clip(data.concerns, 400) : "",
    claimsToVerify: Array.isArray(data.claimsToVerify)
      ? data.claimsToVerify.filter((c): c is string => typeof c === "string" && c.trim() !== "").slice(0, 4).map((c) => clip(c, 200))
      : [],
  };
}

export async function generateDraft(input: ArticleInput, gen: Generator = geminiGenerator): Promise<AiDraft> {
  const article = await fetchArticleText(input.url);
  const prompt = [
    `Haber başlığı: ${input.title}`,
    input.url ? `Kaynak: ${input.url}` : null,
    input.excerpt ? `Kısa özet / okur notu: ${input.excerpt}` : null,
    article ? `Haber metni:\n"""\n${article}\n"""` : "Haber metnine ulaşılamadı; yalnızca başlık ve özete dayan, bilmediğini ekleme.",
  ]
    .filter(Boolean)
    .join("\n\n");
  try {
    return parseDraft(await gen.json(SYSTEM, prompt, DRAFT_SCHEMA));
  } catch (err) {
    throw toAiError(err);
  }
}

export async function findCorroboration(
  input: { title: string; summary: string; sourceUrl: string | null },
  gen: Generator = geminiGenerator,
): Promise<Corroboration> {
  const prompt = `Aşağıdaki haberi web'de ara ve başka bağımsız, güvenilir kaynaklarda da yer alıp almadığını kontrol et.
Haber: ${input.title}
Özet: ${input.summary}
${input.sourceUrl ? `Ana kaynak (bunu sayma): ${input.sourceUrl}` : ""}
Türkçe, en fazla 3 cümlelik bir not yaz: haber başka kaynaklarda doğrulanıyor mu, çelişen bilgi var mı? Emin değilsen açıkça söyle.`;
  try {
    const res = await gen.grounded(prompt);
    const seen = new Set<string>();
    const sources = res.sources.filter((s) => {
      if (seen.has(s.url) || s.url === input.sourceUrl) return false;
      seen.add(s.url);
      return true;
    });
    return { note: clip(res.text, 600) || "Sonuç bulunamadı.", sources: sources.slice(0, 5) };
  } catch (err) {
    throw toAiError(err);
  }
}

function toAiError(err: unknown): AiError {
  if (err instanceof AiError) return err;
  const status = (err as { status?: number })?.status;
  if (status === 429) return new AiError("Yapay zekâ kotası doldu; biraz sonra tekrar deneyin.");
  if (status === 401 || status === 403) return new AiError("Gemini API anahtarı geçersiz ya da yetkisiz.");
  return new AiError("Yapay zekâya ulaşılamadı. Tekrar deneyin.");
}
