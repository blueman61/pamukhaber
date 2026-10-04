"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { CheckIcon, MailIcon } from "@/components/icons";
import { NOTE_MAX } from "@/lib/validation";
import { submitReaderStory, type SubmitState } from "./actions";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-3 font-black">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-sm text-white">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const FieldError = ({ show, text }: { show: boolean; text?: string }) =>
  show ? <span className="mt-1.5 block text-sm font-bold text-rose-600">{text}</span> : null;

export function SubmitForm() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitReaderStory, {});
  const [note, setNote] = useState("");

  if (state.ok) {
    return (
      <div className="card mt-5 p-7 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/70 text-[#14532d]">
          <CheckIcon className="h-8 w-8" />
        </span>
        <p className="display mt-4 text-[22px]">
          {state.duplicate ? "Bu haber zaten bizde, yine de teşekkürler!" : "Teşekkürler! Gönderin editörlerimize ulaştı."}
        </p>
        <p className="mt-2 text-sm text-muted">Doğrulayıp uygun bulursak akışta yayınlayacağız.</p>
        <Link href="/" className="btn btn-primary mt-6 w-full">
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
    <form onSubmit={submit} className="mt-5 space-y-4">
      <Step n={1} title="Haberi paylaş">
        <label className="block">
          <span className="label">Haberin bağlantısı *</span>
          <input name="url" type="url" required placeholder="https://…" className="input" />
          <FieldError show={state.field === "url"} text={state.error} />
        </label>
        <label className="block">
          <span className="label">
            Neden güzel? *<span className="font-semibold text-muted">{`${note.length}/${NOTE_MAX}`}</span>
          </span>
          <textarea
            name="note"
            required
            rows={4}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Birkaç cümleyle anlat: ne oldu, neden içini ısıttı?"
            className="input"
          />
          <FieldError show={state.field === "note"} text={state.error} />
        </label>
      </Step>

      <Step n={2} title="Seni tanıyalım (isteğe bağlı)">
        <label className="block">
          <span className="label">Adın</span>
          <input name="name" maxLength={60} className="input" />
        </label>
        <label className="choice w-full">
          <input type="checkbox" name="allowName" className="h-4 w-4 accent-[var(--accent)]" />
          Haber yayınlanırsa adımla anılabilir
        </label>
        <label className="block">
          <span className="label">E-postan (yalnızca soru sormamız gerekirse)</span>
          <input name="email" type="email" className="input" />
          <FieldError show={state.field === "email"} text={state.error} />
        </label>
      </Step>

      {/* Botlar için bal küpü: insanlar bu alanı görmez. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web sitesi
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error && !state.field && (
        <p className="rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-4 text-lg">
        <MailIcon className="h-5 w-5" /> {pending ? "Gönderiliyor…" : "Gönder"}
      </button>

      <p className="px-2 text-center text-xs leading-relaxed text-muted">
        Gönderdiğin bilgiler yalnızca haberi değerlendirmek için kullanılır. E-posta adresin yayınlanmaz ve üçüncü
        kişilerle paylaşılmaz. Kötüye kullanımı önlemek için bağlantı bilgilerin geri döndürülemez biçimde özetlenir.
      </p>
    </form>
  );
}
