"use client";

import { useState } from "react";

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Bir şeyler ters gitti.");
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir şeyler ters gitti.");
      setState("error");
    }
  }

  return (
    <section className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-sky-100 px-8 text-center text-[#3b2f3a]">
      <span className="animate-float text-7xl" aria-hidden>
        💌
      </span>
      <h2 className="mt-6 text-3xl font-extrabold text-balance">Günün Pamuk Haberi e-postana gelsin</h2>
      <p className="mt-3 max-w-xs text-[15px] text-[#6b5a66]">
        Her sabah tek bir güzel haber. Reklam yok, kötü haber yok, istediğin an ayrılırsın.
      </p>
      {state === "done" ? (
        <p className="mt-8 rounded-2xl bg-white/80 px-5 py-4 font-semibold shadow-sm">Teşekkürler! Yarın sabah görüşürüz ☀️</p>
      ) : (
        <form onSubmit={submit} className="mt-8 flex w-full max-w-xs flex-col gap-3">
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
            className="rounded-2xl border border-pink-200 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="rounded-2xl bg-pink-400 px-4 py-3 font-bold text-white shadow-md transition active:scale-95 disabled:opacity-60"
          >
            {state === "sending" ? "Gönderiliyor…" : "Abone ol"}
          </button>
          {state === "error" && <p className="text-sm text-rose-600">{error}</p>}
        </form>
      )}
      <p className="mt-10 text-xs text-[#8a7a86]">Kaydırmaya devam et ↓</p>
    </section>
  );
}
