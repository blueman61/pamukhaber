"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { NOTE_MAX } from "@/lib/validation";
import { submitReaderStory, type SubmitState } from "./actions";

const input =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft";

export function SubmitForm() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitReaderStory, {});
  const [note, setNote] = useState("");

  if (state.ok) {
    return (
      <div className="mt-8 rounded-3xl bg-accent-soft p-6 text-center">
        <p className="text-5xl" aria-hidden>
          💌
        </p>
        <p className="mt-3 text-lg font-bold">
          {state.duplicate ? "Bu haber zaten bizde, yine de teşekkürler!" : "Teşekkürler! Gönderin editörlerimize ulaştı."}
        </p>
        <p className="mt-2 text-sm text-muted">Doğrulayıp uygun bulursak akışta yayınlayacağız.</p>
        <Link href="/" className="mt-5 inline-block rounded-2xl bg-accent px-5 py-3 font-bold text-white shadow-md">
          Akışa dön
        </Link>
      </div>
    );
  }

  // Hata durumunda okurun yazdıkları silinmesin diye (React 19 `<form action>` formu sıfırlar).
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Haberin bağlantısı *</span>
        <input name="url" type="url" required placeholder="https://…" className={input} />
        {state.field === "url" && <span className="mt-1 block text-sm text-rose-600">{state.error}</span>}
      </label>

      <label className="block">
        <span className="mb-1.5 flex justify-between text-sm font-semibold">
          Neden güzel? *<span className="font-normal text-muted">{`${note.length}/${NOTE_MAX}`}</span>
        </span>
        <textarea
          name="note"
          required
          rows={4}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Birkaç cümleyle anlat: ne oldu, neden içini ısıttı?"
          className={input}
        />
        {state.field === "note" && <span className="mt-1 block text-sm text-rose-600">{state.error}</span>}
      </label>

      <fieldset className="space-y-3 rounded-3xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">İsteğe bağlı</legend>
        <label className="block">
          <span className="mb-1.5 block text-sm">Adın</span>
          <input name="name" maxLength={60} className={input} />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="allowName" className="h-5 w-5 accent-pink-400" />
          Haber yayınlanırsa adımla anılabilir
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm">E-postan (yalnızca soru sormamız gerekirse)</span>
          <input name="email" type="email" className={input} />
          {state.field === "email" && <span className="mt-1 block text-sm text-rose-600">{state.error}</span>}
        </label>
      </fieldset>

      {/* Botlar için bal küpü: insanlar bu alanı görmez. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web sitesi
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Gönderdiğin bilgiler yalnızca haberi değerlendirmek için kullanılır. E-posta adresin yayınlanmaz ve üçüncü
        kişilerle paylaşılmaz. Kötüye kullanımı önlemek için bağlantı bilgilerin geri döndürülemez biçimde özetlenir.
      </p>

      {state.error && !state.field && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-accent px-4 py-3.5 text-lg font-bold text-white shadow-md disabled:opacity-60"
      >
        {pending ? "Gönderiliyor…" : "Gönder 💌"}
      </button>
    </form>
  );
}
