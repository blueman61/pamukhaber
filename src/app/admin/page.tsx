import Link from "next/link";
import { count, countDistinct, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { candidates, reports, sources, stories, subscribers } from "@/db/schema";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ConfirmButton } from "./ConfirmButton";
import { decodeCategories, getCategory } from "@/lib/categories";
import { reportHideThreshold, reportReasonLabel } from "@/lib/reports";
import {
  addSource,
  deleteDemoStories,
  deleteSource,
  deleteStory,
  logout,
  rejectCandidate,
  resolveReports,
  runIngest,
  saveSettings,
  setStoryStatus,
  toggleSource,
} from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "kuyruk", label: "Aday kuyruğu" },
  { id: "yayinda", label: "Yayında" },
  { id: "bildirimler", label: "Bildirimler" },
  { id: "kaynaklar", label: "Kaynaklar" },
  { id: "ayarlar", label: "Ayarlar" },
  { id: "aboneler", label: "Aboneler" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fmt = (d: Date | null) => (d ? dateFmt.format(d) : "—");

const btn = "btn btn-sm";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { tab: rawTab, mesaj } = await searchParams;
  const tab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "kuyruk";

  const [[{ value: queueCount }], [{ value: subscriberCount }], [{ value: reportedCount }]] = await Promise.all([
    db.select({ value: count() }).from(candidates).where(eq(candidates.status, "new")),
    db.select({ value: count() }).from(subscribers),
    db.select({ value: countDistinct(reports.storyId) }).from(reports).where(eq(reports.status, "open")),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold sm:text-2xl">
          <span className="sr-only">Editör masası</span>
          <Logo />
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/" className={`${btn} btn-ghost`} target="_blank">
            Siteyi aç ↗
          </Link>
          <form action={logout}>
            <button className={`${btn} btn-ghost text-muted`}>Çıkış</button>
          </form>
        </div>
      </header>

      <nav className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin?tab=${t.id}`}
            aria-current={t.id === tab ? "page" : undefined}
            className={`${btn} shrink-0 ${t.id === tab ? "btn-primary" : "btn-ghost"}`}
          >
            {t.label}
            {t.id === "kuyruk" && queueCount > 0 && ` (${queueCount})`}
            {t.id === "aboneler" && ` (${subscriberCount})`}
            {t.id === "bildirimler" && reportedCount > 0 && ` (${reportedCount})`}
          </Link>
        ))}
      </nav>

      {typeof mesaj === "string" && (
        <p role="status" className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm font-semibold">
          {mesaj}
        </p>
      )}

      <div className="mt-6">
        {tab === "kuyruk" && <QueueTab />}
        {tab === "yayinda" && <PublishedTab />}
        {tab === "bildirimler" && <ReportsTab />}
        {tab === "kaynaklar" && <SourcesTab />}
        {tab === "ayarlar" && <SettingsTab />}
        {tab === "aboneler" && <SubscribersTab />}
      </div>
    </main>
  );
}

async function QueueTab() {
  const rows = await db
    .select({ c: candidates, sourceName: sources.name })
    .from(candidates)
    .leftJoin(sources, eq(candidates.sourceId, sources.id))
    .where(eq(candidates.status, "new"))
    .orderBy(desc(candidates.score), desc(candidates.publishedAt))
    .limit(60);

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        <form action={runIngest}>
          <button className={`${btn} btn-soft`}>🔄 Kaynakları şimdi tara</button>
        </form>
        <Link href="/admin/yeni" className={`${btn} btn-ghost`}>
          ✍️ Sıfırdan hikâye yaz
        </Link>
      </div>
      <p className="mt-3 text-sm text-muted">
        Adaylar pozitiflik skoruna göre sıralı. Skor yalnızca yardımcıdır: hiçbir haber sen onaylamadan yayına girmez.
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-center text-muted">Kuyruk boş. Kaynakları tarayarak yeni aday toplayabilirsin.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map(({ c, sourceName }) => (
            <li key={c.id} className="flex gap-3 card p-3">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" loading="lazy" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl">☁️</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      c.score > 0 ? "bg-emerald-100 text-emerald-800" : c.score < 0 ? "bg-rose-100 text-rose-800" : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    skor {c.score > 0 ? `+${c.score}` : c.score}
                  </span>
                  {c.origin === "reader" ? (
                    <span className="rounded-full bg-pink-100 px-2 py-0.5 font-bold text-pink-800">
                      💌 Okur{c.submitterName ? ` · ${c.submitterName}` : ""}
                    </span>
                  ) : (
                    <span>{sourceName ?? "Bilinmeyen kaynak"}</span>
                  )}
                  <span>· {fmt(c.publishedAt ?? c.createdAt)}</span>
                </div>
                <a href={c.url} target="_blank" rel="noopener" className="mt-1 block font-bold leading-snug hover:underline">
                  {c.title}
                </a>
                {c.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{c.excerpt}</p>}
                <div className="mt-2 flex gap-2">
                  <Link href={`/admin/yeni?aday=${c.id}`} className={`${btn} btn-primary`}>
                    Düzenle ve yayınla
                  </Link>
                  <form action={rejectCandidate}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className={`${btn} btn-ghost text-muted`}>Reddet</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function PublishedTab() {
  const rows = await db.select().from(stories).orderBy(desc(stories.id)).limit(100);
  const hasDemo = rows.some((s) => s.isDemo);
  return (
    <section>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/yeni" className={`${btn} btn-primary`}>
          ✍️ Yeni hikâye
        </Link>
        {hasDemo && (
          <form action={deleteDemoStories}>
            <button className={`${btn} btn-ghost text-rose-600`}>Örnek içerikleri sil</button>
          </form>
        )}
      </div>
      <ul className="mt-5 space-y-3">
        {rows.map((s) => {
          const cats = decodeCategories(s.categories, s.category).map(getCategory);
          return (
            <li key={s.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>
                  {cats.map((c) => `${c.emoji} ${c.label}`).join(" · ")}
                </span>
                {s.isSponsored && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">Sponsorlu</span>}
                {s.isDemo && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-900">Örnek</span>}
                {s.hiddenReason === "reports" && (
                  <Link href="/admin?tab=bildirimler" className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">
                    Bildirim nedeniyle gizlendi
                  </Link>
                )}
                {s.origin === "reader" && <span className="rounded-full bg-pink-100 px-2 py-0.5 text-pink-800">Okur</span>}
                {s.status === "hidden" && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-neutral-700">Gizli</span>}
                <span>· ❤️ {s.likes}</span>
                <span>· {fmt(s.createdAt)}</span>
              </div>
              <p className="mt-1 font-bold">{s.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/h/${s.slug}`} target="_blank" className={`${btn} btn-ghost`}>
                  Gör ↗
                </Link>
                <Link href={`/admin/yeni?hikaye=${s.id}`} className={`${btn} btn-ghost`}>
                  Düzenle
                </Link>
                <form action={setStoryStatus}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="status" value={s.status === "published" ? "hidden" : "published"} />
                  <button className={`${btn} btn-ghost`}>{s.status === "published" ? "Gizle" : "Yayına al"}</button>
                </form>
                <form action={deleteStory}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className={`${btn} btn-ghost text-rose-600`}>Sil</button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

async function ReportsTab() {
  const open = await db
    .select()
    .from(reports)
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(300);
  const storyIds = [...new Set(open.map((r) => r.storyId))];
  const storyRows = storyIds.length ? await db.select().from(stories).where(inArray(stories.id, storyIds)) : [];
  const threshold = reportHideThreshold();

  if (storyRows.length === 0) {
    return <p className="mt-10 text-center text-muted">Açık bildirim yok. 🌸</p>;
  }

  return (
    <section>
      <p className="text-sm text-muted">
        Aynı hikâyeye {threshold} farklı okurdan bildirim gelince hikâye otomatik gizlenir. Bildirimleri inceleyip karar
        ver: asılsızsa hikâye yeniden yayına girer.
      </p>
      <ul className="mt-5 space-y-3">
        {storyRows.map((s) => {
          const list = open.filter((r) => r.storyId === s.id);
          return (
            <li key={s.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-800">{list.length} bildirim</span>
                {s.status === "hidden" ? (
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-neutral-700">
                    {s.hiddenReason === "reports" ? "Otomatik gizlendi" : "Gizli"}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">Yayında</span>
                )}
              </div>
              <p className="mt-1 font-bold">{s.title}</p>
              {s.sourceUrl && (
                <a href={s.sourceUrl} target="_blank" rel="noopener" className="text-xs text-muted underline">
                  Kaynağı aç ↗
                </a>
              )}
              <ul className="mt-3 space-y-1.5">
                {list.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-surface-2 px-3 py-2 text-sm">
                    <span className="font-semibold">{reportReasonLabel(r.reason)}</span>
                    <span className="text-xs text-muted"> · {fmt(r.createdAt)}</span>
                    {r.note && <p className="mt-0.5 text-muted">“{r.note}”</p>}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={resolveReports}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="decision" value="dismiss" />
                  <button className={`${btn} bg-emerald-100 text-emerald-900`}>
                    Asılsız{s.hiddenReason === "reports" ? " — yayına geri al" : ""}
                  </button>
                </form>
                <form action={resolveReports}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="decision" value="uphold" />
                  <button className={`${btn} bg-rose-100 text-rose-900`}>Haklı — gizli tut</button>
                </form>
                <Link href={`/admin/yeni?hikaye=${s.id}`} className={`${btn} btn-ghost`}>
                  Düzelt
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

async function SourcesTab() {
  const rows = await db.select().from(sources).orderBy(sources.name);
  const input = "input py-2 text-sm";
  return (
    <section>
      <form action={addSource} className="flex flex-wrap gap-2 card p-4">
        <input name="name" placeholder="Kaynak adı" required className={`${input} flex-1`} />
        <input name="feedUrl" type="url" placeholder="https://…/feed" required className={`${input} flex-[2]`} />
        <select name="lang" className={input} defaultValue="tr">
          <option value="tr">Türkçe</option>
          <option value="en">İngilizce</option>
        </select>
        <button className={`${btn} btn-primary`}>Ekle</button>
      </form>
      <ul className="mt-5 space-y-2">
        {rows.map((s) => (
          <li key={s.id} className="flex items-center gap-3 card p-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {s.name} <span className="text-xs font-normal text-muted">({s.lang})</span>
              </p>
              <p className="truncate text-xs text-muted">{s.feedUrl}</p>
              <p className="text-xs text-muted">
                Son tarama: {fmt(s.lastFetchedAt)}
                {s.lastError && <span className="text-rose-600"> · Hata: {s.lastError}</span>}
              </p>
            </div>
            <form action={toggleSource}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="active" value={s.active ? "0" : "1"} />
              <button className={`${btn} ${s.active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"}`}>
                {s.active ? "Açık" : "Kapalı"}
              </button>
            </form>
            <form action={deleteSource}>
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton
                message={`"${s.name}" kaynağı silinsin mi? Bekleyen adayları da silinir; yayındaki haberler etkilenmez.`}
                className={`${btn} btn-ghost text-rose-600`}
              >
                Sil
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function SubscribersTab() {
  const rows = await db.select().from(subscribers).orderBy(desc(subscribers.id)).limit(500);
  return (
    <section>
      <p className="text-sm text-muted">
        Bülten gönderimi için bu listeyi bir e-posta servisine (Buttondown, Mailchimp, Brevo) aktarın.
      </p>
      <ul className="mt-4 divide-y divide-border card">
        {rows.map((s) => (
          <li key={s.id} className="flex justify-between px-4 py-2 text-sm">
            <span>{s.email}</span>
            <span className="text-muted">{fmt(s.createdAt)}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Henüz abone yok.</li>}
      </ul>
    </section>
  );
}

async function SettingsTab() {
  const v = await getSettings();
  return (
    <section>
      <p className="text-sm text-muted">
        Bu ayarlar burada değişince <b>hemen</b> geçerli olur; yeniden yayın (Netlify kredisi) gerekmez.
      </p>
      <form action={saveSettings} className="card mt-4 space-y-4 p-5">
        <label className="block">
          <span className="label">Destek bağlantısı</span>
          <input name="support_url" type="url" defaultValue={v.support_url} placeholder="https://buymeacoffee.com/…" className="input" />
          <span className="mt-1 block text-xs text-muted">Boşsa &quot;Destek ol&quot; düğmeleri gizlenir.</span>
        </label>
        <label className="block">
          <span className="label">İletişim e-postası</span>
          <input name="contact_email" type="email" defaultValue={v.contact_email} placeholder="merhaba@…" className="input" />
        </label>
        <label className="block">
          <span className="label">Gemini model adı</span>
          <input name="gemini_model" defaultValue={v.gemini_model} placeholder="gemini-flash-latest" className="input" />
          <span className="mt-1 block text-xs text-muted">Boş bırakırsanız güncel &quot;flash&quot; modeli otomatik seçilir.</span>
        </label>
        <label className="block">
          <span className="label">GitHub deposu (MP4 hazırlamak için)</span>
          <input name="github_repo" defaultValue={v.github_repo} placeholder="blueman61/pamukhaber" className="input" />
        </label>
        <button className="btn btn-primary w-full">Kaydet</button>
      </form>
    </section>
  );
}
