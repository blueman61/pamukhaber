import Link from "next/link";

export function EndCard({ empty }: { empty?: boolean }) {
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;
  return (
    <section className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100 px-8 text-center text-[#3b2f3a]">
      <span className="animate-float text-7xl" aria-hidden>
        {empty ? "🌱" : "🌸"}
      </span>
      <h2 className="mt-6 text-3xl font-extrabold text-balance">
        {empty ? "Bu kategoride henüz haber yok" : "Bugünlük bu kadar"}
      </h2>
      <p className="mt-3 max-w-xs text-[15px] text-[#6b5a66]">
        {empty
          ? "Editörlerimiz güzel haberler arıyor. Biraz sonra tekrar uğra."
          : "Hepsini gördün! Yarın yeni güzellikler seni bekliyor olacak."}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        {empty && (
          <Link href="/" className="rounded-2xl bg-pink-400 px-6 py-3 font-bold text-white shadow-md">
            Tüm haberlere dön
          </Link>
        )}
        {supportUrl && (
          <a href={supportUrl} target="_blank" rel="noopener" className="rounded-2xl bg-white px-6 py-3 font-bold shadow-md">
            ☕ Pamuk Haber&apos;e destek ol
          </a>
        )}
        <Link href="/hakkinda" className="text-sm font-semibold text-[#8a7a86] underline underline-offset-4">
          Biz kimiz?
        </Link>
      </div>
    </section>
  );
}
