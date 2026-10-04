import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, MailIcon, ShieldIcon, SparklesIcon, UserIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Hakkında",
  description: "Pamuk Haber nedir, haberleri nasıl seçiyoruz?",
};

const PRINCIPLES = [
  {
    icon: <ShieldIcon className="h-5 w-5" />,
    tone: "bg-mint/70 text-[#14532d]",
    text: "Güvenilir kaynakları otomatik tarıyoruz; ama hiçbir haber editör onayı olmadan yayına girmiyor.",
  },
  {
    icon: <UserIcon className="h-5 w-5" />,
    tone: "bg-sky-soft/70 text-[#123a5c]",
    text: "Her haberi kendi cümlelerimizle kısaca özetliyor, orijinal kaynağa bağlantı veriyoruz.",
  },
  {
    icon: <CheckIcon className="h-5 w-5" />,
    tone: "bg-peach/70 text-[#6b2e12]",
    text: "Tık tuzağı, abartı ve \"her şey harika\" yapaylığı yok. Gerçek, doğrulanabilir hikâyeler.",
  },
  {
    icon: <span className="text-sm font-black">₺</span>,
    tone: "bg-butter text-[#6b4a00]",
    text: "Sponsorlu içerikler her zaman açıkça \"Sponsorlu\" olarak işaretlenir.",
  },
  {
    icon: <SparklesIcon className="h-5 w-5" />,
    tone: "bg-lilac/60 text-[#3b2a66]",
    text: "Yapay zekâyı yalnızca editörlerimize taslak hazırlamak için kullanıyoruz; her haber yayından önce bir insan tarafından okunup onaylanır.",
  },
];

export default function AboutPage() {
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <main className="mx-auto min-h-dvh max-w-[480px] pb-12">
      <PageHero
        motif="iyilik"
        eyebrow="Hakkında"
        title="Pamuk Haber"
        description={
          <>
            Dünyada kötü haber çok. Ama iyi haber de az değil — sadece sesi daha kısık. Pamuk Haber, Türkiye&apos;den ve
            dünyadan iç ısıtan, umut veren gerçek hikâyeleri tek bir yerde topluyor.
          </>
        }
      />

      <div className="mt-4 space-y-4 px-4">
        <section className="card p-5">
          <h2 className="display text-[20px]">Haberleri nasıl seçiyoruz?</h2>
          <ul className="mt-4 space-y-3">
            {PRINCIPLES.map((p) => (
              <li key={p.text} className="flex gap-3 text-[15px] leading-relaxed">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${p.tone}`} aria-hidden>
                  {p.icon}
                </span>
                <span className="pt-1">{p.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="display text-[20px]">Şeffaflık</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Her haberin sağındaki <b className="text-foreground">yuvarlak içinde nokta</b> düğmesine dokunarak kaynağını,
            doğrulanıp doğrulanmadığını ve haberi kimin gönderdiğini görebilirsin. Yanlış ya da sahte olduğunu düşündüğün bir
            haberi aynı yerden bildirebilirsin; birden fazla okur bildirirse haber editör incelemesine kadar yayından kalkar.
          </p>
          <Link href="/gonder" className="btn btn-soft mt-4 w-full">
            <MailIcon className="h-5 w-5" /> Güzel bir haber gönder
          </Link>
        </section>

        <section className="card overflow-hidden p-5">
          <h2 className="display text-[20px]">Bize destek ol</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Pamuk Haber&apos;i küçük bir ekip ayakta tutuyor. Paylaştığın her hikâye bize çok yardımcı olur.
          </p>
          {supportUrl && (
            <a href={supportUrl} target="_blank" rel="noopener" className="btn btn-primary mt-4 w-full">
              ☕ Destek ol
            </a>
          )}
        </section>

        {contact && (
          <p className="px-2 text-center text-sm text-muted">
            Güzel bir haber mi gördün, ya da markanla bize sponsor olmak mı istiyorsun?{" "}
            <a href={`mailto:${contact}`} className="font-extrabold text-accent underline">
              {contact}
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
