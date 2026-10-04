import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkında",
  description: "Pamuk Haber nedir, haberleri nasıl seçiyoruz?",
};

export default function AboutPage() {
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <main className="mx-auto max-w-[480px] px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-muted">
        ← Akışa dön
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold">
        Pamuk Haber <span aria-hidden>☁️</span>
      </h1>
      <p className="mt-4 text-lg leading-relaxed">
        Dünyada kötü haber çok. Ama iyi haber de az değil — sadece sesi daha kısık. Pamuk Haber, Türkiye&apos;den ve
        dünyadan iç ısıtan, umut veren gerçek hikâyeleri tek bir yerde topluyor.
      </p>

      <section className="mt-8 space-y-3 rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Haberleri nasıl seçiyoruz?</h2>
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
          <li>Güvenilir kaynakları otomatik tarıyoruz; ama hiçbir haber editör onayı olmadan yayına girmiyor.</li>
          <li>Her haberi kendi cümlelerimizle kısaca özetliyor, orijinal kaynağa bağlantı veriyoruz.</li>
          <li>Tık tuzağı, abartı ve &quot;her şey harika&quot; yapaylığı yok. Gerçek, doğrulanabilir hikâyeler.</li>
          <li>Sponsorlu içerikler her zaman açıkça &quot;Sponsorlu&quot; olarak işaretlenir.</li>
          <li>
            Yapay zekâyı yalnızca editörlerimize taslak hazırlamak için kullanıyoruz; her haber yayından önce bir insan
            tarafından okunup onaylanır.
          </li>
        </ul>
      </section>

      <section className="mt-6 space-y-3 rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Şeffaflık</h2>
        <p className="text-[15px] leading-relaxed">
          Her haberin sağındaki <b>yuvarlak içinde nokta</b> düğmesine dokunarak kaynağını, doğrulanıp doğrulanmadığını
          ve haberi kimin gönderdiğini görebilirsin. Yanlış ya da sahte olduğunu düşündüğün bir haberi aynı yerden
          bildirebilirsin; birden fazla okur bildirirse haber editör incelemesine kadar yayından kalkar.
        </p>
        <Link href="/gonder" className="inline-block rounded-2xl bg-accent-soft px-5 py-3 font-bold">
          💌 Güzel bir haber gönder
        </Link>
      </section>

      <section className="mt-6 space-y-3 rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Bize destek ol</h2>
        <p className="text-[15px] leading-relaxed">
          Pamuk Haber&apos;i küçük bir ekip ayakta tutuyor. Paylaştığın her hikâye bize çok yardımcı olur.
        </p>
        {supportUrl && (
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener"
            className="inline-block rounded-2xl bg-accent px-5 py-3 font-bold text-white shadow-md"
          >
            ☕ Destek ol
          </a>
        )}
      </section>

      {contact && (
        <p className="mt-6 text-sm text-muted">
          Güzel bir haber mi gördün, ya da markanla bize sponsor olmak mı istiyorsun?{" "}
          <a href={`mailto:${contact}`} className="font-semibold underline">
            {contact}
          </a>
        </p>
      )}
    </main>
  );
}
