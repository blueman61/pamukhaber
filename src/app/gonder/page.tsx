import type { Metadata } from "next";
import Link from "next/link";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: "Haber gönder",
  description: "Gördüğün güzel bir haberi Pamuk Haber'e gönder.",
};

export default function SubmitPage() {
  return (
    <main className="relative mx-auto max-w-[480px] px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-muted">
        ← Akışa dön
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold">
        Güzel bir haber mi gördün? <span aria-hidden>💌</span>
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Mahallendeki bir iyilik, bir hayvan kurtarma hikâyesi, umut veren bir buluş… Bağlantısını gönder; editörlerimiz
        doğrulayıp uygun bulursa akışta &quot;Okur gönderimi&quot; olarak yayınlansın.
      </p>
      <SubmitForm />
    </main>
  );
}
