/**
 * Varsayılan RSS kaynaklarını ve (tablo boşsa) arayüzü denemek için
 * açıkça "Örnek içerik" olarak işaretlenmiş demo hikâyeleri ekler.
 * Demo hikâyeler gerçek haber değildir; panelden tek tıkla silinebilir.
 *
 * Kullanım: npm run db:seed  (demo istemiyorsanız: npm run db:seed -- --no-demo)
 */
import { count } from "drizzle-orm";
import { db } from "./index";
import { sources, stories, type NewStory } from "./schema";
import { DEFAULT_SOURCES } from "../lib/sources";
import { slugify } from "../lib/slug";

const DEMO: Omit<NewStory, "slug">[] = [
  {
    title: "Mahalleli, sokak kedileri için kış evleri yaptı",
    summary:
      "Bir apartmanın sakinleri eski kasalardan ve köpük levhalardan yalıtımlı kedi evleri yapıp sokağa yerleştirdi. Bu, akışın nasıl görüneceğini gösteren örnek bir içeriktir.",
    category: "hayvanlar",
  },
  {
    title: "Emekli öğretmen, köy okuluna kütüphane kurdu",
    summary:
      "Kitaplarını bağışlayan emekli bir öğretmen, komşularının da desteğiyle küçük bir köy okuluna rengârenk bir okuma köşesi kazandırdı. (Örnek içerik)",
    category: "iyilik",
  },
  {
    title: "Öğrenciler sahildeki çöpleri toplayıp sanat eserine dönüştürdü",
    summary:
      "Lise öğrencileri hafta sonu topladıkları plastik atıklardan dev bir balık heykeli yaptı; heykel artık geri dönüşümü anlatan bir sergide. (Örnek içerik)",
    category: "doga",
  },
  {
    title: "Bilim insanları mercanları daha hızlı büyütmenin yolunu buldu",
    summary:
      "Laboratuvarda küçük parçalara ayrılan mercanların doğada çok daha hızlı büyüyebildiği gözlemlendi; bu yöntem resif onarımına umut oluyor. (Örnek içerik)",
    category: "bilim",
  },
  {
    title: "Hastane bahçesine çocuklar için şifa bahçesi açıldı",
    summary:
      "Gönüllü bahçıvanlar, uzun süre tedavi gören çocukların vakit geçirebilmesi için hastane bahçesini çiçekler ve oyun alanıyla yeniledi. (Örnek içerik)",
    category: "saglik",
  },
  {
    title: "85 yaşında üniversite diplomasını aldı",
    summary:
      "Gençken yarım kalan eğitimini emekliliğinde tamamlayan bir dede, mezuniyet töreninde torunlarının alkışları arasında kepini fırlattı. (Örnek içerik)",
    category: "basari",
  },
  {
    title: "Komşular apartman girişine ücretsiz paylaşım dolabı koydu",
    summary:
      "İhtiyaç fazlası kitap, oyuncak ve kışlık giysilerin bırakıldığı dolap kısa sürede bütün sokağın buluşma noktası oldu. (Örnek içerik)",
    category: "topluluk",
  },
  {
    title: "Kaybolan köpek 300 kilometre yol yürüyüp evine döndü",
    summary:
      "Aylardır aranan köpeğin bir sabah kapının önünde kuyruğunu sallarken bulunması aileyi gözyaşlarına boğdu. (Örnek içerik)",
    category: "hayvanlar",
  },
  {
    title: "Kasabanın fırını, kimse aç kalmasın diye askıda ekmek başlattı",
    summary:
      "Müşteriler fazladan bir ekmeğin parasını ödüyor, ihtiyacı olan herkes askıdaki ekmeği alabiliyor. Gelenek kısa sürede çevre kasabalara yayıldı. (Örnek içerik)",
    category: "iyilik",
  },
  {
    title: "Sponsorlu kart böyle görünür",
    summary:
      "Değerleri Pamuk Haber'le uyumlu markalar, akışta açıkça 'Sponsorlu' etiketiyle yer alabilir. Bu kart gelir modelini göstermek için eklenmiş bir örnektir.",
    category: "topluluk",
    isSponsored: true,
    sponsorName: "Örnek Marka",
    sponsorUrl: "https://example.com",
  },
];

async function main() {
  const withDemo = !process.argv.includes("--no-demo");

  const added = await db
    .insert(sources)
    .values(DEFAULT_SOURCES.map((s) => ({ ...s })))
    .onConflictDoNothing()
    .returning({ id: sources.id });
  console.log(`Kaynaklar: ${added.length} yeni kaynak eklendi.`);

  const [{ value: storyCount }] = await db.select({ value: count() }).from(stories);
  if (withDemo && storyCount === 0) {
    // Ters sırayla ekle ki listenin başı akışta en üstte görünsün.
    const rows = [...DEMO].reverse().map((s, i) => ({
      ...s,
      slug: `ornek-${slugify(s.title)}-${i}`,
      sourceName: s.isSponsored ? null : "Pamuk Haber (örnek)",
      isDemo: true,
    }));
    await db.insert(stories).values(rows);
    console.log(`Hikâyeler: ${rows.length} örnek hikâye eklendi.`);
  } else {
    console.log("Hikâyeler: örnek içerik eklenmedi.");
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
