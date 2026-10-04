"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { MediaType } from "@/lib/media";
import { EXTRA_SOURCES_MAX, NOTE_MAX, SUMMARY_MAX, TITLE_MAX, type Origin, type Verification } from "@/lib/validation";
import {
  aiCorroborate,
  aiDraft,
  saveStory,
  type AiCorroborationState,
  type AiDraftState,
  type StoryFormState,
} from "../actions";

export type StoryFormDefaults = {
  storyId?: number;
  candidateId?: number;
  title: string;
  summary: string;
  category: string;
  mediaType: MediaType;
  mediaUrl: string;
  mediaCredit: string;
  sourceName: string;
  sourceUrl: string;
  isSponsored: boolean;
  sponsorName: string;
  sponsorUrl: string;
  origin: Origin;
  submitterName: string;
  verification: Verification;
  verificationNote: string;
  extraSources: string;
  aiAssisted: boolean;
};

const MEDIA_LABELS: Record<MediaType, string> = {
  none: "Medya yok (pastel arka plan)",
  image: "Görsel (URL)",
  video: "Dikey video (MP4 URL)",
  youtube: "YouTube / Shorts bağlantısı",
  tiktok: "TikTok video bağlantısı",
  instagram: "Instagram Reels bağlantısı",
};

const MEDIA_HINTS: Partial<Record<MediaType, string>> = {
  youtube: "YouTube'da Paylaş → Bağlantıyı kopyala. Shorts linkleri de olur.",
  tiktok: "TikTok'ta Paylaş → Bağlantıyı kopyala (vm.tiktok.com kısa linkleri de kabul edilir). Video sahibi gömmeyi kapattıysa oynamaz.",
  instagram:
    "Instagram'da ⋯ → Bağlantıyı kopyala (instagram.com/reel/…). Instagram gömmeleri otomatik oynamaz; okur dokunarak başlatır. Hesap gizliyse görünmez.",
};

const ORIGIN_LABELS: Record<Origin, string> = {
  editor: "✍️ Editör seçkisi",
  reader: "💌 Okur gönderimi",
  partner: "🏛️ Kurum bülteni",
};

const VERIFICATION_LABELS: Record<Verification, string> = {
  verified: "✅ Doğrulandı — birden fazla bağımsız kaynakla teyit edildi",
  source: "🔗 Kaynağa dayalı — tek güvenilir kaynak",
  unverified: "⏳ Doğrulanmadı",
};

const input = "input";
const SERVER_TIMEOUT = "Sunucu yanıt vermedi (zaman aşımı olabilir). Biraz bekleyip tekrar deneyin.";
const smallBtn = "btn btn-sm";

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {hint && <span className="font-semibold text-muted">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
    </label>
  );
}

export function StoryForm({ defaults, aiEnabled }: { defaults: StoryFormDefaults; aiEnabled: boolean }) {
  const [state, action, pending] = useActionState<StoryFormState, FormData>(saveStory, {});
  const [title, setTitle] = useState(defaults.title);
  const [summary, setSummary] = useState(defaults.summary);
  const [category, setCategory] = useState(defaults.category);
  const [mediaType, setMediaType] = useState<MediaType>(defaults.mediaType);
  const [sourceUrl, setSourceUrl] = useState(defaults.sourceUrl);
  const [sponsored, setSponsored] = useState(defaults.isSponsored);
  const [origin, setOrigin] = useState<Origin>(defaults.origin);
  const [verificationNote, setVerificationNote] = useState(defaults.verificationNote);
  const [extraSources, setExtraSources] = useState(defaults.extraSources);
  const [aiAssisted, setAiAssisted] = useState(defaults.aiAssisted);
  const [draftState, setDraftState] = useState<AiDraftState>({});
  const [corrState, setCorrState] = useState<AiCorroborationState>({});
  const [aiPending, startAi] = useTransition();
  const errors = state.errors ?? {};

  function aiForm() {
    const f = new FormData();
    if (defaults.candidateId) f.set("candidateId", String(defaults.candidateId));
    f.set("title", title);
    f.set("summary", summary);
    f.set("sourceUrl", sourceUrl);
    return f;
  }

  function runDraft() {
    startAi(async () => {
      let res: AiDraftState;
      try {
        res = await aiDraft(aiForm());
      } catch {
        res = { error: SERVER_TIMEOUT };
      }
      setDraftState(res);
      if (res.draft) {
        setTitle(res.draft.title);
        setSummary(res.draft.summary);
        setCategory(res.draft.category);
        setAiAssisted(true);
      }
    });
  }

  function runCorroborate() {
    startAi(async () => {
      try {
        setCorrState(await aiCorroborate(aiForm()));
      } catch {
        setCorrState({ error: SERVER_TIMEOUT });
      }
    });
  }

  function addExtraSource(url: string) {
    const list = extraSources.split(/\s+/).filter(Boolean);
    if (!list.includes(url)) setExtraSources([...list, url].join("\n"));
  }

  // `<form action>` React 19'da gönderimden sonra formu sıfırlar; doğrulama hatasında
  // editörün girdiği değerler kaybolmasın diye onSubmit ile gönderiyoruz.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {defaults.storyId && <input type="hidden" name="storyId" value={defaults.storyId} />}
      {defaults.candidateId && <input type="hidden" name="candidateId" value={defaults.candidateId} />}
      {aiAssisted && <input type="hidden" name="aiAssisted" value="on" />}

      {aiEnabled && (
        <section className="space-y-3 rounded-[28px] border border-violet-200 bg-violet-50 p-5 shadow-soft text-[#3b2f3a] dark:border-violet-900 dark:bg-violet-950/40 dark:text-foreground">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={runDraft} disabled={aiPending} className={`${smallBtn} bg-violet-500 text-white`}>
              {aiPending ? "Çalışıyor…" : "✨ Yapay zekâ ile taslak"}
            </button>
            <button type="button" onClick={runCorroborate} disabled={aiPending} className={`${smallBtn} bg-white text-violet-700`}>
              🔎 Başka kaynaklarda ara
            </button>
          </div>
          <p className="text-xs text-muted">
            Gemini haberi okuyup Türkçe başlık, özet ve kategori önerir. Öneriler yalnızca taslaktır: okuyup düzeltmek ve
            onaylamak sende.
          </p>
          {(draftState.error || corrState.error) && (
            <p className="text-sm text-rose-600">{draftState.error || corrState.error}</p>
          )}
          {draftState.draft && (
            <div className="space-y-2 rounded-2xl bg-white/70 p-3 text-sm dark:bg-black/20">
              {!draftState.draft.isUplifting && (
                <p className="font-semibold text-amber-700">⚠️ Yapay zekâya göre bu haber Pamuk Haber&apos;e uygun olmayabilir.</p>
              )}
              {draftState.draft.concerns && <p>⚠️ {draftState.draft.concerns}</p>}
              {draftState.draft.claimsToVerify.length > 0 && (
                <div>
                  <p className="font-semibold">Yayından önce teyit et:</p>
                  <ul className="list-disc pl-5">
                    {draftState.draft.claimsToVerify.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {corrState.result && (
            <div className="space-y-2 rounded-2xl bg-white/70 p-3 text-sm dark:bg-black/20">
              <p>{corrState.result.note}</p>
              {corrState.result.sources.length > 0 && (
                <ul className="space-y-1.5">
                  {corrState.result.sources.map((s) => {
                    const isRedirect = s.url.includes("grounding-api-redirect");
                    return (
                      <li key={s.url} className="flex items-center gap-2">
                        <a href={s.url} target="_blank" rel="noopener" className="min-w-0 flex-1 truncate underline">
                          {s.title}
                        </a>
                        {!isRedirect && (
                          <button type="button" onClick={() => addExtraSource(s.url)} className={`${smallBtn} bg-white`}>
                            + Ek kaynak
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-xs text-muted">
                Bağlantıları açıp kendin doğrula; uygun olanların gerçek adresini &quot;Ek kaynaklar&quot; alanına ekle.
              </p>
              <button
                type="button"
                onClick={() => setVerificationNote(corrState.result!.note.slice(0, NOTE_MAX))}
                className={`${smallBtn} bg-white`}
              >
                Notu doğrulama notuna aktar
              </button>
            </div>
          )}
        </section>
      )}

      <Field label="Başlık (Türkçe, sıcak ve net)" error={errors.title} hint={`${title.length}/${TITLE_MAX}`}>
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX + 20} className={input} required />
      </Field>

      <Field label="Kısa özet (kendi cümlelerinle)" error={errors.summary} hint={`${summary.length}/${SUMMARY_MAX}`}>
        <textarea name="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} className={input} required />
      </Field>

      <Field label="Kategori" error={errors.category}>
        <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="card space-y-3 p-5 [&>:not(legend)]:clear-both">
        <legend className="float-left mb-3 w-full text-base font-black">Görsel / video</legend>
        <select name="mediaType" value={mediaType} onChange={(e) => setMediaType(e.target.value as MediaType)} className={input}>
          {(Object.keys(MEDIA_LABELS) as MediaType[]).map((m) => (
            <option key={m} value={m}>
              {MEDIA_LABELS[m]}
            </option>
          ))}
        </select>
        {mediaType !== "none" && (
          <>
            <Field label="Medya bağlantısı" error={errors.mediaUrl}>
              <input name="mediaUrl" type="url" defaultValue={defaults.mediaUrl} className={input} placeholder="https://" />
            </Field>
            {MEDIA_HINTS[mediaType] && <p className="text-xs text-muted">{MEDIA_HINTS[mediaType]}</p>}
            <Field label="Görsel/video kredisi" hint="ör. Pexels / Ayşe Yılmaz, @kullanici / TikTok">
              <input name="mediaCredit" defaultValue={defaults.mediaCredit} className={input} />
            </Field>
            {mediaType === "image" && defaults.mediaUrl && (
              <p className="text-xs text-muted">
                RSS&apos;ten gelen görseli kullanmadan önce kullanım hakkını kontrol et. Emin değilsen Pexels/Unsplash&apos;tan
                atıflı bir görsel seç.
              </p>
            )}
          </>
        )}
      </fieldset>

      <fieldset className="card space-y-3 p-5 [&>:not(legend)]:clear-both">
        <legend className="float-left mb-3 w-full text-base font-black">Kaynak ve doğrulama</legend>
        <Field label="Kaynak adı">
          <input name="sourceName" defaultValue={defaults.sourceName} className={input} />
        </Field>
        <Field label="Orijinal haber bağlantısı" error={errors.sourceUrl}>
          <input
            name="sourceUrl"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className={input}
            placeholder="https://"
          />
        </Field>
        <Field label="Doğrulama durumu" error={errors.verification}>
          <select name="verification" defaultValue={defaults.verification} className={input}>
            {(Object.keys(VERIFICATION_LABELS) as Verification[]).map((v) => (
              <option key={v} value={v}>
                {VERIFICATION_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Ek kaynaklar (her satıra bir bağlantı)"
          error={errors.extraSources}
          hint={`en fazla ${EXTRA_SOURCES_MAX}`}
        >
          <textarea
            name="extraSources"
            value={extraSources}
            onChange={(e) => setExtraSources(e.target.value)}
            rows={2}
            className={input}
            placeholder="https://…"
          />
        </Field>
        <Field label="Doğrulama notu (okurlar görür)" error={errors.verificationNote} hint={`${verificationNote.length}/${NOTE_MAX}`}>
          <textarea
            name="verificationNote"
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
            rows={2}
            className={input}
            placeholder="ör. Belediyenin resmi açıklaması ve yerel gazete haberiyle teyit edildi."
          />
        </Field>
      </fieldset>

      <fieldset className="card space-y-3 p-5 [&>:not(legend)]:clear-both">
        <legend className="float-left mb-3 w-full text-base font-black">Haberi kim getirdi?</legend>
        <select name="origin" value={origin} onChange={(e) => setOrigin(e.target.value as Origin)} className={input}>
          {(Object.keys(ORIGIN_LABELS) as Origin[]).map((o) => (
            <option key={o} value={o}>
              {ORIGIN_LABELS[o]}
            </option>
          ))}
        </select>
        {origin === "reader" && (
          <Field label="Okurun adı" hint="yalnızca izin verdiyse">
            <input name="submitterName" defaultValue={defaults.submitterName} maxLength={60} className={input} />
          </Field>
        )}
      </fieldset>

      <fieldset className="card space-y-3 p-5 [&>:not(legend)]:clear-both">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            name="isSponsored"
            checked={sponsored}
            onChange={(e) => setSponsored(e.target.checked)}
            className="h-5 w-5 accent-pink-400"
          />
          Sponsorlu içerik (akışta &quot;Sponsorlu&quot; etiketiyle, aralarda gösterilir)
        </label>
        {sponsored && (
          <>
            <Field label="Sponsor adı" error={errors.sponsorName}>
              <input name="sponsorName" defaultValue={defaults.sponsorName} className={input} />
            </Field>
            <Field label="Sponsor bağlantısı" error={errors.sponsorUrl}>
              <input name="sponsorUrl" type="url" defaultValue={defaults.sponsorUrl} className={input} placeholder="https://" />
            </Field>
          </>
        )}
      </fieldset>

      {aiAssisted && (
        <p className="text-xs text-muted">
          ✨ Bu hikâye yapay zekâ desteğiyle hazırlandı; okurlara bilgi panelinde belirtilecek.
        </p>
      )}
      {state.message && <p className="rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full py-4 text-lg"
      >
        {pending ? "Kaydediliyor…" : defaults.storyId ? "Değişiklikleri kaydet" : "Yayınla ☁️"}
      </button>
    </form>
  );
}
