import Link from "next/link";
import { CategoryArt } from "./CategoryArt";
import { MailIcon } from "./icons";

export function EndCard({ empty }: { empty?: boolean }) {
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;
  return (
    <section className="relative h-full w-full overflow-hidden">
      <CategoryArt motif={empty ? "doga" : "moon"} focusY={0.3} />
      <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="glass rounded-[30px] p-6 text-center shadow-float">
          <h2 className="display text-[28px] text-balance">{empty ? "Bu kategoride henüz haber yok" : "Bugünlük bu kadar"}</h2>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
            {empty
              ? "Editörlerimiz güzel haberler arıyor. Biraz sonra tekrar uğra."
              : "Hepsini gördün! Yarın yeni güzellikler seni bekliyor olacak."}
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            {empty && (
              <Link href="/" className="btn btn-primary w-full">
                Tüm haberlere dön
              </Link>
            )}
            <Link href="/gonder" className={`btn w-full ${empty ? "btn-soft" : "btn-primary"}`}>
              <MailIcon className="h-5 w-5" /> Güzel bir haber gönder
            </Link>
            {supportUrl && (
              <a href={supportUrl} target="_blank" rel="noopener" className="btn btn-soft w-full">
                ☕ Pamuk Haber&apos;e destek ol
              </a>
            )}
            <Link href="/hakkinda" className="mt-1 text-sm font-extrabold text-muted underline underline-offset-4">
              Biz kimiz?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
