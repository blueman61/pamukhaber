"use client";

import { useSubscribe } from "@/hooks/useSubscribe";
import { CategoryArt } from "./CategoryArt";
import { CheckIcon } from "./icons";

export function NewsletterCard() {
  const { email, setEmail, state, error, submit } = useSubscribe();

  return (
    <section className="relative h-full w-full overflow-hidden">
      <CategoryArt motif="mail" focusY={0.3} />
      <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="glass rounded-[30px] p-6 text-center shadow-float">
          <p className="chip mx-auto bg-accent-soft text-accent">Günlük bülten</p>
          <h2 className="display mt-3 text-[27px] text-balance">Günün Pamuk Haberi e-postana gelsin</h2>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
            Her sabah tek bir güzel haber. Reklam yok, kötü haber yok, istediğin an ayrılırsın.
          </p>
          {state === "done" ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-mint/60 px-5 py-3 font-extrabold text-[#14532d] dark:text-foreground">
              <CheckIcon className="h-5 w-5" /> Teşekkürler! Yarın sabah görüşürüz ☀️
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5 flex flex-col gap-2.5">
              <label htmlFor="newsletter-email" className="sr-only">
                E-posta adresin
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@eposta.com"
                className="input text-center"
              />
              <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full">
                {state === "sending" ? "Gönderiliyor…" : "Abone ol"}
              </button>
              {state === "error" && <p className="text-sm font-bold text-rose-600">{error}</p>}
            </form>
          )}
          <p className="mt-4 text-xs font-bold text-muted">Kaydırmaya devam et ↓</p>
        </div>
      </div>
    </section>
  );
}
