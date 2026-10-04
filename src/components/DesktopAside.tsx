"use client";

import Link from "next/link";
import { useSubscribe } from "@/hooks/useSubscribe";
import { CheckIcon, MailIcon } from "./icons";

const KEYS = [
  ["↓ / J", "Sonraki haber"],
  ["↑ / K", "Önceki haber"],
  ["Boşluk", "Sonraki haber"],
] as const;

/** Masaüstü sağ paneli: bülten, haber gönder çağrısı ve klavye ipuçları. */
export function DesktopAside({ supportUrl }: { supportUrl?: string }) {
  const { email, setEmail, state, error, submit } = useSubscribe();

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 xl:flex" aria-label="Pamuk Haber'e katıl">
      <section className="glass rounded-[28px] p-5 shadow-soft">
        <p className="chip bg-accent-soft text-accent">Günlük bülten</p>
        <h2 className="display mt-2.5 text-[20px]">Her sabah tek güzel haber</h2>
        <p className="mt-1 text-sm text-muted">Reklam yok, kötü haber yok. İstediğin an ayrılırsın.</p>
        {state === "done" ? (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-mint/60 px-4 py-3 text-sm font-extrabold text-[#14532d] dark:text-foreground">
            <CheckIcon className="h-5 w-5" /> Teşekkürler! Yarın sabah görüşürüz ☀️
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
            <label htmlFor="aside-email" className="sr-only">
              E-posta adresin
            </label>
            <input
              id="aside-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@eposta.com"
              className="input py-2.5 text-sm"
            />
            <button type="submit" disabled={state === "sending"} className="btn btn-primary btn-sm py-2.5">
              {state === "sending" ? "Gönderiliyor…" : "Abone ol"}
            </button>
            {state === "error" && <p className="text-sm font-bold text-rose-600">{error}</p>}
          </form>
        )}
      </section>

      <section className="glass rounded-[28px] p-5 shadow-soft">
        <h2 className="display text-[18px]">Güzel bir haber mi gördün?</h2>
        <p className="mt-1 text-sm text-muted">Bağlantısını gönder; editörlerimiz doğrulasın, akışta yayınlansın.</p>
        <Link href="/gonder" className="btn btn-soft btn-sm mt-3 w-full">
          <MailIcon className="h-4 w-4" /> Bize gönder
        </Link>
        {supportUrl && (
          <a href={supportUrl} target="_blank" rel="noopener" className="btn btn-ghost btn-sm mt-2 w-full">
            ☕ Destek ol
          </a>
        )}
      </section>

      <section className="glass rounded-[28px] p-5 shadow-soft">
        <h2 className="text-sm font-black">Klavyeyle gez</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {KEYS.map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <kbd className="rounded-lg border border-border bg-surface px-2 py-0.5 text-xs font-black shadow-sm">{key}</kbd>
              <span className="text-muted">{label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Fare tekerleği ve dokunmatik yüzey de çalışır. Çift tıklayınca beğenirsin.</p>
      </section>
    </aside>
  );
}
