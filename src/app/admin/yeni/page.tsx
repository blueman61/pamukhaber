import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { candidates, sources, stories } from "@/db/schema";
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
};

export default async function NewStoryPage({ searchParams }: PageProps<"/admin/yeni">) {
  await requireAdmin();
  const { aday, hikaye } = await searchParams;
  let defaults = EMPTY;
  let original: { title: string; excerpt: string; url: string; source: string | null } | null = null;

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
    const turkish = source?.lang === "tr";
    original = { title: c.title, excerpt: c.excerpt, url: c.url, source: source?.name ?? null };
    defaults = {
      ...EMPTY,
      candidateId: c.id,
      // Türkçe kaynaklarda başlığı taslak olarak getir; yabancı kaynaklarda editör çevirir.
      title: turkish ? c.title.slice(0, 90) : "",
      mediaType: c.imageUrl ? "image" : "none",
      mediaUrl: c.imageUrl ?? "",
      mediaCredit: c.imageUrl && source ? source.name : "",
      sourceName: source?.name ?? "",
      sourceUrl: c.url,
    };
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/admin" className="text-sm font-semibold text-muted">
        ← Editör masası
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold">{defaults.storyId ? "Hikâyeyi düzenle" : "Yeni hikâye"}</h1>

      {original && (
        <aside className="mt-5 rounded-3xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Orijinal haber · {original.source}</p>
          <a href={original.url} target="_blank" rel="noopener" className="mt-1 block font-bold hover:underline">
            {original.title} ↗
          </a>
          {original.excerpt && <p className="mt-2 text-sm text-muted">{original.excerpt}</p>}
          <p className="mt-3 text-xs text-muted">
            Metni kopyalama: haberi okuyup kendi cümlelerinle, Türkçe ve kısa özetle. Kaynak bağlantısı otomatik eklenir.
          </p>
        </aside>
      )}

      <div className="mt-6">
        <StoryForm defaults={defaults} />
      </div>
    </main>
  );
}
