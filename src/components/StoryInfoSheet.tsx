"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { isEmbedType, PLATFORM_LABELS } from "@/lib/media";
import { REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";
import type { FeedStory } from "@/lib/stories";
import { CloseIcon, ExternalIcon } from "./icons";

const VERIFICATION = {
  verified: { icon: "✅", label: "Doğrulandı", text: "Birden fazla bağımsız kaynakla teyit edildi." },
  source: { icon: "🔗", label: "Kaynağa dayalı", text: "Tek ve güvenilir bir kaynağa dayanıyor; bağımsız teyit henüz yok." },
  unverified: { icon: "⏳", label: "Doğrulanmadı", text: "Bu içerik henüz doğrulanmadı." },
} as const;

const ORIGIN = {
  editor: { icon: "✍️", label: "Editör seçkisi", text: "Editörlerimiz tarafından bulundu ve yazıldı." },
  reader: { icon: "💌", label: "Okur gönderimi", text: "Bir okurumuz gönderdi, editörlerimiz kontrol edip yayınladı." },
  partner: { icon: "🏛️", label: "Kurum bülteni", text: "Bir kurumun basın bülteninden derlendi." },
} as const;

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

type Props = { story: FeedStory; onClose: () => void };

/** Kartın "yuvarlak içinde nokta" düğmesiyle açılan bilgi ve bildirim paneli. */
export function StoryInfoSheet({ story, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const verification = VERIFICATION[story.verification];
  const origin = ORIGIN[story.origin];
  const credit = story.mediaCredit || (isEmbedType(story.mediaType) ? PLATFORM_LABELS[story.mediaType] : null);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`info-${story.id}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-background px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-foreground shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <h2 id={`info-${story.id}`} className="text-lg leading-snug font-extrabold">
            Bu haber hakkında
          </h2>
          <button type="button" onClick={onClose} autoFocus aria-label="Kapat" className="rounded-full bg-card p-2">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {story.isDemo && (
          <p className="mt-3 rounded-2xl bg-sky-100 px-4 py-3 text-sm text-sky-950">
            Bu bir <b>örnek içeriktir</b>; sitenin nasıl görüneceğini göstermek için eklendi, gerçek bir haber değildir.
          </p>
        )}

        <dl className="mt-4 space-y-3">
          <InfoRow icon="📰" title="Kaynak">
            {story.isSponsored ? (
              <span>
                Sponsorlu içerik{story.sponsorName ? ` · ${story.sponsorName}` : ""}{" "}
                {story.sponsorUrl && <SourceLink url={story.sponsorUrl} label={host(story.sponsorUrl)} />}
              </span>
            ) : story.sourceUrl ? (
              <SourceLink url={story.sourceUrl} label={story.sourceName || host(story.sourceUrl)} />
            ) : (
              <span className="text-muted">{story.sourceName || "Belirtilmedi"}</span>
            )}
            {story.extraSources.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {story.extraSources.map((url) => (
                  <li key={url}>
                    <SourceLink url={url} label={host(url)} small />
                  </li>
                ))}
              </ul>
            )}
          </InfoRow>

          <InfoRow icon={verification.icon} title={verification.label}>
            <span className="text-muted">{verification.text}</span>
            {story.verificationNote && <p className="mt-1">{story.verificationNote}</p>}
          </InfoRow>

          <InfoRow icon={origin.icon} title={origin.label}>
            <span className="text-muted">
              {story.origin === "reader" && story.submitterName
                ? `${story.submitterName} gönderdi, editörlerimiz kontrol edip yayınladı.`
                : origin.text}
            </span>
          </InfoRow>

          <InfoRow icon="🗓️" title="Yayın tarihi">
            <span className="text-muted">{dateFmt.format(new Date(story.createdAt))}</span>
          </InfoRow>

          {credit && (
            <InfoRow icon="📷" title="Görsel / video">
              <span className="text-muted">{credit}</span>
            </InfoRow>
          )}

          {story.aiAssisted && (
            <InfoRow icon="✨" title="Yapay zekâ desteği">
              <span className="text-muted">Özet yapay zekâ desteğiyle hazırlandı, editör tarafından kontrol edildi.</span>
            </InfoRow>
          )}
        </dl>

        <ReportForm storyId={story.id} />

        <Link
          href="/gonder"
          className="mt-4 block rounded-2xl bg-accent-soft px-4 py-3 text-center text-sm font-semibold"
        >
          💌 Sen de güzel bir haber gördün mü? Bize gönder
        </Link>
      </div>
    </div>,
    document.body,
  );
}

function InfoRow({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-card px-4 py-3">
      <span className="text-xl leading-6" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        <dt className="font-bold">{title}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

function SourceLink({ url, label, small }: { url: string; label: string; small?: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className={`inline-flex max-w-full items-center gap-1 font-semibold break-all underline underline-offset-2 ${small ? "text-xs text-muted" : ""}`}
    >
      {label}
      <ExternalIcon className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}

function ReportForm({ storyId }: { storyId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "duplicate" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setState("sending");
    try {
      const res = await fetch(`/api/stories/${storyId}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, note }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; duplicate?: boolean };
      if (!res.ok) throw new Error(body.error || "Bildirim gönderilemedi.");
      setState(body.duplicate ? "duplicate" : "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bildirim gönderilemedi.");
      setState("error");
    }
  }

  if (state === "done" || state === "duplicate") {
    return (
      <p role="status" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
        {state === "done"
          ? "Teşekkürler! Bildirimin editörlerimize ulaştı, en kısa sürede inceleyeceğiz."
          : "Bu haberi daha önce bildirmiştin; editörlerimiz inceliyor. Teşekkürler!"}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 w-full rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-rose-600"
      >
        🚩 Yanlışlık veya sahte içerik bildir
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 rounded-2xl border border-border p-4">
      <fieldset>
        <legend className="text-sm font-bold">Neyi bildirmek istiyorsun?</legend>
        <div className="mt-2 grid gap-2">
          {REPORT_REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 text-sm">
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="h-4 w-4 accent-pink-400"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 block text-sm">
        <span className="font-semibold">Açıklama (isteğe bağlı)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Ne yanlış? Varsa doğru bilginin kaynağını ekle."
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-base"
        />
      </label>
      {state === "error" && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={!reason || state === "sending"}
          className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {state === "sending" ? "Gönderiliyor…" : "Bildir"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-card px-4 py-2.5 text-sm font-semibold">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
