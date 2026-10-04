"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getCategory } from "@/lib/categories";
import { isEmbedType, PLATFORM_LABELS } from "@/lib/media";
import { REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";
import type { FeedStory } from "@/lib/stories";
import {
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  CloseIcon,
  ExternalIcon,
  FlagIcon,
  LinkIcon,
  MailIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
} from "./icons";

const VERIFICATION = {
  verified: {
    label: "Doğrulandı",
    text: "Birden fazla bağımsız kaynakla teyit edildi.",
    badge: "bg-mint text-[#14532d]",
    bubble: "bg-mint/70 text-[#14532d]",
  },
  source: {
    label: "Kaynağa dayalı",
    text: "Tek ve güvenilir bir kaynağa dayanıyor; bağımsız teyit henüz yok.",
    badge: "bg-sky-soft text-[#123a5c]",
    bubble: "bg-sky-soft/70 text-[#123a5c]",
  },
  unverified: {
    label: "Doğrulanmadı",
    text: "Bu içerik henüz doğrulanmadı.",
    badge: "bg-butter text-[#6b4a00]",
    bubble: "bg-butter/80 text-[#6b4a00]",
  },
} as const;

const ORIGIN = {
  editor: { label: "Editör seçkisi", text: "Editörlerimiz tarafından bulundu ve yazıldı." },
  reader: { label: "Okur gönderimi", text: "Bir okurumuz gönderdi, editörlerimiz kontrol edip yayınladı." },
  partner: { label: "Kurum bülteni", text: "Bir kurumun basın bülteninden derlendi." },
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
  const category = getCategory(story.category);
  const credit = story.mediaCredit || (isEmbedType(story.mediaType) ? PLATFORM_LABELS[story.mediaType] : null);

  return createPortal(
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-[#2e2433]/45 backdrop-blur-[2px]"
      onClick={onClose}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`info-${story.id}`}
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet max-h-[86dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[34px] bg-background px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-foreground shadow-float"
      >
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-border" aria-hidden />

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-muted uppercase">
              <span className="h-2 w-2 rounded-full" style={{ background: category.color }} aria-hidden />
              {category.label}
            </p>
            <h2 id={`info-${story.id}`} className="display mt-1 text-[22px]">
              Bu haber hakkında
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{story.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Kapat"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-soft"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`chip ${verification.badge}`}>
            <ShieldIcon className="h-3.5 w-3.5" /> {verification.label}
          </span>
          <span className="chip bg-lilac/50 text-[#3b2a66] dark:text-foreground">{origin.label}</span>
        </div>

        {story.isDemo && (
          <p className="mt-4 rounded-[20px] bg-sky-soft/50 px-4 py-3 text-sm leading-relaxed text-[#123a5c] dark:text-foreground">
            Bu bir <b>örnek içeriktir</b>; sitenin nasıl görüneceğini göstermek için eklendi, gerçek bir haber değildir.
          </p>
        )}

        <dl className="card mt-4 divide-y divide-border overflow-hidden p-0">
          <InfoRow icon={<LinkIcon className="h-5 w-5" />} tone="bg-sky-soft/60 text-[#123a5c]" title="Kaynak">
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
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {story.extraSources.map((url) => (
                  <li key={url}>
                    <SourceLink url={url} label={host(url)} small />
                  </li>
                ))}
              </ul>
            )}
          </InfoRow>

          <InfoRow icon={<ShieldIcon className="h-5 w-5" />} tone={verification.bubble} title={verification.label}>
            <span className="text-muted">{verification.text}</span>
            {story.verificationNote && <p className="mt-1 font-semibold">{story.verificationNote}</p>}
          </InfoRow>

          <InfoRow icon={<UserIcon className="h-5 w-5" />} tone="bg-lilac/50 text-[#3b2a66]" title={origin.label}>
            <span className="text-muted">
              {story.origin === "reader" && story.submitterName
                ? `${story.submitterName} gönderdi, editörlerimiz kontrol edip yayınladı.`
                : origin.text}
            </span>
          </InfoRow>

          <InfoRow icon={<CalendarIcon className="h-5 w-5" />} tone="bg-peach/60 text-[#6b2e12]" title="Yayın tarihi">
            <span className="text-muted">{dateFmt.format(new Date(story.createdAt))}</span>
          </InfoRow>

          {credit && (
            <InfoRow icon={<CameraIcon className="h-5 w-5" />} tone="bg-accent-soft text-accent" title="Görsel / video">
              <span className="text-muted">{credit}</span>
            </InfoRow>
          )}

          {story.aiAssisted && (
            <InfoRow icon={<SparklesIcon className="h-5 w-5" />} tone="bg-lilac/50 text-[#3b2a66]" title="Yapay zekâ desteği">
              <span className="text-muted">Özet yapay zekâ desteğiyle hazırlandı, editör tarafından kontrol edildi.</span>
            </InfoRow>
          )}
        </dl>

        <ReportForm storyId={story.id} />

        <Link href="/gonder" className="btn btn-soft mt-3 w-full whitespace-normal">
          <MailIcon className="h-5 w-5 shrink-0" /> Güzel bir haber mi gördün? Bize gönder
        </Link>
      </div>
    </div>,
    document.body,
  );
}

function InfoRow({ icon, tone, title, children }: { icon: React.ReactNode; tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        <dt className="font-extrabold">{title}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

function SourceLink({ url, label, small }: { url: string; label: string; small?: boolean }) {
  return small ? (
    <a href={url} target="_blank" rel="noopener" className="chip max-w-full bg-surface-2 text-foreground">
      <span className="truncate">{label}</span>
      <ExternalIcon className="h-3 w-3 shrink-0" />
    </a>
  ) : (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="inline-flex max-w-full items-center gap-1 font-extrabold break-all text-accent underline decoration-2 underline-offset-2"
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
      <p role="status" className="mt-4 flex gap-3 rounded-[22px] bg-mint/50 px-4 py-3.5 text-sm font-bold text-[#14532d] dark:text-foreground">
        <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
        {state === "done"
          ? "Teşekkürler! Bildirimin editörlerimize ulaştı, en kısa sürede inceleyeceğiz."
          : "Bu haberi daha önce bildirmiştin; editörlerimiz inceliyor. Teşekkürler!"}
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost mt-4 w-full text-rose-600 dark:text-rose-300">
        <FlagIcon className="h-5 w-5" /> Yanlışlık veya sahte içerik bildir
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card mt-4 p-4">
      <fieldset>
        <legend className="flex items-center gap-2 font-extrabold">
          <FlagIcon className="h-4 w-4 text-rose-600 dark:text-rose-300" /> Neyi bildirmek istiyorsun?
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPORT_REASONS.map((r) => (
            <label key={r.value} className="choice">
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block">
        <span className="label">Açıklama (isteğe bağlı)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Ne yanlış? Varsa doğru bilginin kaynağını ekle."
          className="input"
        />
      </label>
      {state === "error" && <p className="mt-2 text-sm font-bold text-rose-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={!reason || state === "sending"} className="btn btn-danger flex-1">
          {state === "sending" ? "Gönderiliyor…" : "Bildir"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
