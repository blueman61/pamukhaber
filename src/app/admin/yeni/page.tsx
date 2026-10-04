import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates, sources, stories } from "@/db/schema";
import { isAiConfigured } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { StoryForm, type StoryFormDefaults } from "./StoryForm";

export const dynamic = "force-dynamic";

const EMPTY: StoryFormDefaults = {
  title: "",
  summary: "",
  category: "iyilik",
  mediaType: "none",
  mediaUrl: "",
  mediaCredit: "",
  sourceName: "",
  sourceUrl: "",
  isSponsored: false,
  sponsorName: "",
  sponsorUrl: "",
  origin: "editor",
  submitterName: "",
  verification: "source",
  verificationNote: "",
  extraSources: "",
  aiAssisted: false,
};

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default async function NewStoryPage({ searchParams }: PageProps<"/admin/yeni">) {
  await requireAdmin();
  const { aday, hikaye } = await searchParams;
  let defaults = EMPTY;
  let original: {
    title: string;
    excerpt: string;
    url: string;
    source: string | null;
    reader: { name: string | null; email: string | null; note: string | null } | null;
  } | null = null;

  if (typeof hikaye === "string") {
    const [s] = await db.select().from(stories).where(eq(stories.id, Number(hikaye))).limit(1);
    if (!s) notFound();
    defaults = {
      storyId: s.id,
      title: s.title,
      summary: s.summary,
      category: s.category,
      mediaType: s.mediaType,
      mediaUrl: s.mediaUrl ?? "",
      mediaCredit: s.mediaCredit ?? "",
      sourceName: s.sourceName ?? "",
      sourceUrl: s.sourceUrl ?? "",
      isSponsored: s.isSponsored,
      sponsorName: s.sponsorName ?? "",
      sponsorUrl: s.sponsorUrl ?? "",
      origin: s.origin,
      submitterName: s.submitterName ?? "",
      verification: s.verification,
      verificationNote: s.verificationNote ?? "",
      extraSources: s.extraSources ?? "",
      aiAssisted: s.aiAssisted,
    };
  } else if (typeof aday === "string") {
    const [row] = await db
      .select({ c: candidates, source: sources })
      .from(candidates)
      .leftJoin(sources, eq(candidates.sourceId, sources.id))
      .where(eq(candidates.id, Number(aday)))
      .limit(1);
    if (!row) notFound();
    const { c, source } = row;
    const turkish = source?.lang === "tr" || c.origin === "reader";
    const fromReader = c.origin === "reader";
    original = {
      title: c.title,
      excerpt: fromReader ? "" : c.excerpt,
      url: c.url,
      source: fromReader ? "Okur gönderimi" : (source?.name ?? null),
      reader: fromReader ? { name: c.submitterName, email: c.submitterEmail, note: c.submitterNote } : null,
    };
    defaults = {
      ...EMPTY,
      candidateId: c.id,
      // Türkçe kaynaklarda başlığı taslak olarak getir; yabancı kaynaklarda editör çevirir.
      title: turkish ? c.title.slice(0, 90) : "",
      mediaType: c.imageUrl ? "image" : "none",
      mediaUrl: c.imageUrl ?? "",
      mediaCredit: c.imageUrl && source ? source.name : "",
      sourceName: source?.name ?? (fromReader ? hostOf(c.url) : ""),
      sourceUrl: c.url,
      origin: fromReader ? "reader" : "editor",
      submitterName: c.submitterName ?? "",
    };
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 lg:max-w-3xl">
      <Link href="/admin" className="btn btn-sm btn-ghost">
        ← Editör masası
      </Link>
      <h1 className="display mt-4 text-[28px]">{defaults.storyId ? "Hikâyeyi düzenle" : "Yeni hikâye"}</h1>

      {original && (
        <aside className="card mt-5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Orijinal haber · {original.source}</p>
          <a href={original.url} target="_blank" rel="noopener" className="mt-1 block font-bold hover:underline">
            {original.title} ↗
          </a>
          {original.excerpt && <p className="mt-2 text-sm text-muted">{original.excerpt}</p>}
          {original.reader && (
            <div className="mt-3 rounded-[20px] bg-accent-soft px-4 py-3 text-sm">
              <p className="font-semibold">
                💌 Okurun notu{original.reader.name ? ` · ${original.reader.name} (adıyla anılabilir)` : " · anonim"}
              </p>
              <p className="mt-1">{original.reader.note}</p>
              {original.reader.email && (
                <p className="mt-1 text-xs text-muted">
                  İletişim (yayınlanmaz): <a href={`mailto:${original.reader.email}`}>{original.reader.email}</a>
                </p>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-muted">
            Metni kopyalama: haberi okuyup kendi cümlelerinle, Türkçe ve kısa özetle. Kaynak bağlantısı otomatik eklenir.
          </p>
        </aside>
      )}

      <div className="mt-6">
        <StoryForm defaults={defaults} aiEnabled={isAiConfigured()} />
      </div>
    </main>
  );
}
