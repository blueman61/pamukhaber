import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: "Haber gönder",
  description: "Gördüğün güzel bir haberi Pamuk Haber'e gönder.",
};

export default function SubmitPage() {
  return (
    <main className="relative mx-auto min-h-dvh max-w-[480px] pb-12">
      <PageHero
        motif="mail"
        eyebrow="Okur gönderimi"
        title="Güzel bir haber mi gördün?"
        description={
          <>
            Mahallendeki bir iyilik, bir hayvan kurtarma hikâyesi, umut veren bir buluş… Bağlantısını gönder; editörlerimiz
            doğrulayıp uygun bulursa akışta &quot;Okur gönderimi&quot; olarak yayınlansın.
          </>
        }
      />
      <div className="px-4">
        <SubmitForm />
      </div>
    </main>
  );
}
