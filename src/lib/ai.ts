import { GoogleGenAI, ThinkingLevel, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { CATEGORIES, isCategory, type CategorySlug } from "./categories";
import { fetchText, stripHtml } from "./ingest";
import { isSafePublicUrl, safePublicFetch } from "./submissions";
import { SUMMARY_MAX, TITLE_MAX } from "./validation";

/**
 * Gemini ile editöre taslak ve doğrulama yardımı. Hiçbir şeyi otomatik yayınlamaz;
 * çıktı editör formuna öneri olarak gelir.
 */

/** Google'ın kendisi güncel tuttuğu takma adlar; tek bir sürüme bağlı kalmayız. */
export const DEFAULT_GEMINI_MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const ARTICLE_MAX_CHARS = 12_000;
/** Netlify ücretsiz planında sunucu fonksiyonu 10 sn'de kesilir; işi bunun altında bitiririz. */
export const AI_BUDGET_MS = 8_500;
const ARTICLE_BUDGET_MS = 4_000;

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function candidateModels(preferred = process.env.GEMINI_MODEL): string[] {
  const list = [preferred?.trim(), ...DEFAULT_GEMINI_MODELS].filter((m): m is string => Boolean(m));
  return [...new Set(list)];
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

/** Testlerde gerçek API yerine sahte bir üretici verilebilir. `deadline`: Date.now() cinsinden son an. */
export type Generator = {
  json: (system: string, prompt: string, schema: object, deadline: number) => Promise<string>;
  grounded: (prompt: string, deadline: number) => Promise<{ text: string; sources: { title: string; url: string }[] }>;
};

export type GeminiCall = (params: GenerateContentParameters) => Promise<GenerateContentResponse>;

type ApiErrorInfo = { status?: number; code?: string; message: string; raw: string };

/** SDK hatasından HTTP durumu, Google durum kodu ve okunur mesajı çıkarır. */
export function apiErrorInfo(err: unknown): ApiErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);
  const status = typeof (err as { status?: unknown })?.status === "number" ? (err as { status: number }).status : undefined;
  let message = raw;
  let code: string | undefined;
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const body = JSON.parse(raw.slice(jsonStart)) as { error?: { message?: string; status?: string } };
      message = body.error?.message ?? raw;
      code = body.error?.status;
    } catch {
      // JSON değilse ham mesajla devam.
    }
  }
  return { status, code, message, raw };
}

const isTimeout = (err: unknown) =>
  err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError" || /aborted|timed? ?out/i.test(err.message));

const isModelUnavailable = (e: ApiErrorInfo) =>
  e.status === 404 || e.code === "NOT_FOUND" || (e.status === 400 && /model.*(not found|not supported|is not available|unsupported)|unknown model/i.test(e.message));

const isThinkingRejected = (e: ApiErrorInfo) => e.status === 400 && /thinking/i.test(e.message);

function thinkingFor(model: string) {
  // 2.5 nesli bütçeyle, 3+ nesli düzeyle ayarlanır; ikisi de hız için düşük tutulur.
  return /2\.5/.test(model) ? { thinkingBudget: 0 } : { thinkingLevel: ThinkingLevel.LOW };
}

const TIMEOUT_MESSAGE =
  "Yapay zekâ zamanında yanıt veremedi (Netlify ücretsiz planda sunucu 10 saniyede kesilir). Tekrar deneyin; sorun sürerse daha hızlı bir model için GEMINI_MODEL'i değiştirin.";

/**
 * Gemini çağrılarını sarar: sırayla modelleri dener (bulunamayan modeli atlar), çalışanı hatırlar,
 * düşünme ayarını reddeden modelde ayarsız tekrar dener ve süre bütçesine uyar.
 */
export function createGeminiGenerator(call: GeminiCall, models: () => string[] = () => candidateModels()): Generator {
  let workingModel: string | null = null;

  async function run(build: (model: string) => GenerateContentParameters, deadline: number) {
    const list = workingModel ? [workingModel, ...models().filter((m) => m !== workingModel)] : models();
    let last: ApiErrorInfo | null = null;
    for (const model of list) {
      for (const withThinking of [true, false]) {
        const remaining = deadline - Date.now();
        if (remaining < 300) throw new AiError(TIMEOUT_MESSAGE);
        const params = build(model);
        params.config = {
          ...params.config,
          ...(withThinking ? { thinkingConfig: thinkingFor(model) } : {}),
          abortSignal: AbortSignal.timeout(remaining),
        };
        try {
          const res = await call(params);
          workingModel = model;
          return res;
        } catch (err) {
          if (isTimeout(err)) throw new AiError(TIMEOUT_MESSAGE);
          const info = apiErrorInfo(err);
          last = info;
          if (withThinking && isThinkingRejected(info)) continue;
          if (isModelUnavailable(info)) {
            console.error(`[ai] Model kullanılamıyor: ${model} → ${info.message}`);
            if (workingModel === model) workingModel = null;
            break;
          }
          throw err;
        }
      }
    }
    throw new AiError(
      `Gemini modeli bulunamadı (${list.join(", ")}). Netlify'da GEMINI_MODEL değişkenine geçerli bir model adı girin.` +
        (last ? ` Ayrıntı: ${safeDetail(last)}` : ""),
    );
  }

  return {
    async json(system, prompt, schema, deadline) {
      const res = await run(
        (model) => ({
          model,
          contents: prompt,
          config: {
            systemInstruction: system,
            responseMimeType: "application/json",
            responseJsonSchema: schema,
            temperature: 0.4,
          },
        }),
        deadline,
      );
      return res.text ?? "";
    },
    async grounded(prompt, deadline) {
      const res = await run(
        (model) => ({ model, contents: prompt, config: { tools: [{ googleSearch: {} }], temperature: 0.2 } }),
        deadline,
      );
      const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = chunks
        .map((c) => c.web)
        .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri))
        .map((w) => ({ title: w.title || new URL(w.uri).hostname, url: w.uri }));
      return { text: res.text ?? "", sources };
    },
  };
}

let defaultGenerator: Generator | null = null;
function geminiGenerator(): Generator {
  defaultGenerator ??= createGeminiGenerator((params) => gemini().models.generateContent(params));
  return defaultGenerator;
}

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

const within = <T,>(p: Promise<T>, ms: number, fallback: T) =>
  Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

export async function generateDraft(input: ArticleInput, gen: Generator = geminiGenerator()): Promise<AiDraft> {
  const deadline = Date.now() + AI_BUDGET_MS;
  // Sayfa yavaşsa beklemeyiz; taslak başlık ve özetten üretilir.
  const article = await within(fetchArticleText(input.url), ARTICLE_BUDGET_MS, null);
  const prompt = [
    `Haber başlığı: ${input.title}`,
    input.url ? `Kaynak: ${input.url}` : null,
    input.excerpt ? `Kısa özet / okur notu: ${input.excerpt}` : null,
    article ? `Haber metni:\n"""\n${article}\n"""` : "Haber metnine ulaşılamadı; yalnızca başlık ve özete dayan, bilmediğini ekleme.",
  ]
    .filter(Boolean)
    .join("\n\n");
  try {
    return parseDraft(await gen.json(SYSTEM, prompt, DRAFT_SCHEMA, deadline));
  } catch (err) {
    throw toAiError(err);
  }
}

export async function findCorroboration(
  input: { title: string; summary: string; sourceUrl: string | null },
  gen: Generator = geminiGenerator(),
): Promise<Corroboration> {
  const deadline = Date.now() + AI_BUDGET_MS;
  const prompt = `Aşağıdaki haberi web'de ara ve başka bağımsız, güvenilir kaynaklarda da yer alıp almadığını kontrol et.
Haber: ${input.title}
Özet: ${input.summary}
${input.sourceUrl ? `Ana kaynak (bunu sayma): ${input.sourceUrl}` : ""}
Türkçe, en fazla 3 cümlelik bir not yaz: haber başka kaynaklarda doğrulanıyor mu, çelişen bilgi var mı? Emin değilsen açıkça söyle.`;
  try {
    const res = await gen.grounded(prompt, deadline);
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

/** Editöre gösterilecek kısa teknik ayrıntı (API anahtarı içermez). */
function safeDetail(e: ApiErrorInfo): string {
  const text = e.message.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[anahtar]").replace(/\s+/g, " ").trim();
  return `(${e.status ?? e.code ?? "?"}: ${text.length > 160 ? `${text.slice(0, 159)}…` : text})`;
}

export function toAiError(err: unknown): AiError {
  if (err instanceof AiError) return err;
  if (isTimeout(err)) return new AiError(TIMEOUT_MESSAGE);
  const e = apiErrorInfo(err);
  // Asıl nedeni Netlify → Logs → Functions'ta görmek için.
  console.error("[ai] Gemini hatası:", e.status, e.code, e.message);
  if (e.status === 429 || e.code === "RESOURCE_EXHAUSTED")
    return new AiError("Yapay zekâ kotası doldu; biraz sonra tekrar deneyin.");
  if (e.status === 401 || e.status === 403 || /API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(e.raw))
    return new AiError("Gemini API anahtarı geçersiz ya da yetkisiz. Netlify'daki GEMINI_API_KEY değerini kontrol edin.");
  if (/location is not supported|FAILED_PRECONDITION/i.test(e.raw))
    return new AiError("Gemini bu sunucu bölgesinden kullanılamıyor. " + safeDetail(e));
  return new AiError(`Yapay zekâya ulaşılamadı. Tekrar deneyin. ${safeDetail(e)}`);
}
