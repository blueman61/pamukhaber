import Parser from "rss-parser";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { candidates, sources, type Source } from "@/db/schema";
import { scorePositivity } from "./positivity";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

type MediaNode = { $?: { url?: string; medium?: string; type?: string } };
type FeedItem = {
  link?: string;
  title?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  isoDate?: string;
  enclosure?: { url?: string; type?: string };
  mediaContent?: MediaNode | MediaNode[];
  mediaThumbnail?: MediaNode | MediaNode[];
};

const parser: Parser<object, FeedItem> = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

const USER_AGENT = "PamukHaberBot/0.1 (+https://pamukhaber.com)";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_OG_LOOKUPS_PER_SOURCE = 10;
const MAX_ITEMS_PER_SOURCE = 30;

export type NewCandidate = typeof candidates.$inferInsert;

/** utm_* gibi izleme parametrelerini atıp URL'yi tekilleştirmeye uygun hale getirir. */
export function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|at_medium$|at_campaign$)/.test(key)) {
        u.searchParams.delete(key);
      }
    }
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const asArray = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function extractImage(item: FeedItem): string | null {
  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith("image"))) {
    return item.enclosure.url;
  }
  for (const node of [...asArray(item.mediaContent), ...asArray(item.mediaThumbnail)]) {
    const url = node?.$?.url;
    const kind = node?.$?.medium ?? node?.$?.type ?? "image";
    if (url && kind.startsWith("image")) return url;
  }
  const img = item.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return img?.[1] ?? null;
}

export function findOgImage(html: string): string | null {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metas) {
    if (/(property|name)=["'](og:image|twitter:image)["']/i.test(tag)) {
      const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
      if (content) return content.replace(/&amp;/g, "&");
    }
  }
  return null;
}

/** Ham RSS öğelerini aday kayıtlarına dönüştürür (tekilleştirme dahil). */
export function itemsToCandidates(items: FeedItem[], sourceId: number | null): NewCandidate[] {
  const seen = new Set<string>();
  const out: NewCandidate[] = [];
  for (const item of items.slice(0, MAX_ITEMS_PER_SOURCE)) {
    const url = item.link ? normalizeUrl(item.link) : null;
    const title = stripHtml(item.title ?? "");
    if (!url || !title || seen.has(url)) continue;
    seen.add(url);
    const excerpt = stripHtml(item.contentSnippet || item.summary || item.content || "").slice(0, 600);
    const published = item.isoDate ? new Date(item.isoDate) : null;
    out.push({
      sourceId,
      url,
      title: title.slice(0, 300),
      excerpt,
      imageUrl: extractImage(item),
      publishedAt: published && !Number.isNaN(published.getTime()) ? published : null,
      score: scorePositivity(`${title} ${excerpt}`),
    });
  }
  return out;
}

async function fetchText(url: string, fetchImpl: FetchLike): Promise<string> {
  const res = await fetchImpl(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/rss+xml, application/xml, text/html, */*" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export type IngestResult = { source: string; found: number; added: number; error?: string };

export async function ingestSource(db: Db, source: Source, fetchImpl: FetchLike = fetch): Promise<IngestResult> {
  try {
    const xml = await fetchText(source.feedUrl, fetchImpl);
    const feed = await parser.parseString(xml);
    const items = itemsToCandidates(feed.items, source.id);

    // Zaten bildiğimiz URL'ler için tekrar og:image aramayalım.
    const known = items.length
      ? new Set(
          (
            await db
              .select({ url: candidates.url })
              .from(candidates)
              .where(inArray(candidates.url, items.map((i) => i.url)))
          ).map((r) => r.url),
        )
      : new Set<string>();
    const fresh = items.filter((i) => !known.has(i.url));

    let lookups = 0;
    for (const item of fresh) {
      if (item.imageUrl || lookups >= MAX_OG_LOOKUPS_PER_SOURCE) continue;
      lookups++;
      try {
        item.imageUrl = findOgImage(await fetchText(item.url, fetchImpl));
      } catch {
        // Görsel bulunamazsa editör kendisi ekleyebilir.
      }
    }

    const inserted = fresh.length
      ? await db.insert(candidates).values(fresh).onConflictDoNothing().returning({ id: candidates.id })
      : [];
    await db
      .update(sources)
      .set({ lastFetchedAt: new Date(), lastError: null })
      .where(eq(sources.id, source.id));
    return { source: source.name, found: items.length, added: inserted.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(sources)
      .set({ lastFetchedAt: new Date(), lastError: message.slice(0, 300) })
      .where(eq(sources.id, source.id));
    return { source: source.name, found: 0, added: 0, error: message };
  }
}

export async function ingestAll(db: Db, fetchImpl: FetchLike = fetch): Promise<IngestResult[]> {
  const active = await db.select().from(sources).where(eq(sources.active, true));
  return Promise.all(active.map((s) => ingestSource(db, s, fetchImpl)));
}
