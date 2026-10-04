"use client";

import { useActionState, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { MediaType } from "@/lib/media";
import { SUMMARY_MAX, TITLE_MAX } from "@/lib/validation";
import { saveStory, type StoryFormState } from "../actions";

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
};

const MEDIA_LABELS: Record<MediaType, string> = {
  none: "Medya yok (pastel arka plan)",
  image: "Görsel (URL)",
  video: "Dikey video (MP4 URL)",
  youtube: "YouTube / Shorts bağlantısı",
};

const input =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft";

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-sm font-semibold">
        {label}
        {hint && <span className="font-normal text-muted">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
    </label>
  );
}

export function StoryForm({ defaults }: { defaults: StoryFormDefaults }) {
  const [state, action, pending] = useActionState<StoryFormState, FormData>(saveStory, {});
  const [title, setTitle] = useState(defaults.title);
  const [summary, setSummary] = useState(defaults.summary);
  const [mediaType, setMediaType] = useState<MediaType>(defaults.mediaType);
  const [sponsored, setSponsored] = useState(defaults.isSponsored);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      {defaults.storyId && <input type="hidden" name="storyId" value={defaults.storyId} />}
      {defaults.candidateId && <input type="hidden" name="candidateId" value={defaults.candidateId} />}

      <Field label="Başlık (Türkçe, sıcak ve net)" error={errors.title} hint={`${title.length}/${TITLE_MAX}`}>
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX + 20} className={input} required />
      </Field>

      <Field label="Kısa özet (kendi cümlelerinle)" error={errors.summary} hint={`${summary.length}/${SUMMARY_MAX}`}>
        <textarea
          name="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className={input}
          required
        />
      </Field>

      <Field label="Kategori" error={errors.category}>
        <select name="category" defaultValue={defaults.category} className={input}>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="space-y-3 rounded-3xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Görsel / video</legend>
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
            <Field label="Görsel/video kredisi" hint="ör. Pexels / Ayşe Yılmaz">
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

      <fieldset className="space-y-3 rounded-3xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Kaynak</legend>
        <Field label="Kaynak adı">
          <input name="sourceName" defaultValue={defaults.sourceName} className={input} />
        </Field>
        <Field label="Orijinal haber bağlantısı" error={errors.sourceUrl}>
          <input name="sourceUrl" type="url" defaultValue={defaults.sourceUrl} className={input} placeholder="https://" />
        </Field>
      </fieldset>

      <fieldset className="space-y-3 rounded-3xl border border-border p-4">
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

      {state.message && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-accent px-4 py-3.5 text-lg font-bold text-white shadow-md disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : defaults.storyId ? "Değişiklikleri kaydet" : "Yayınla ☁️"}
      </button>
    </form>
  );
}
