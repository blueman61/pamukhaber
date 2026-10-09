# Pamuk Haber — depoda yapılanların özeti

Pamuk Haber: yalnızca iyi, iç ısıtan haberleri TikTok tarzı dikey kaydırmalı kartlarla gösteren, mobil öncelikli bir haber sitesi. Her haber **editör onayından** geçer. Hedef: sıfır maliyetle çalışan, stabil, kolay ve eğlenceli bir sistem.

Ayrıntılar için: [README](../README.md) · [Strateji](STRATEJI.md) · [Yayınlama](YAYINLAMA.md) · [Vercel'e taşınma](TASINMA-VERCEL.md)

## Fazlar

| Faz | Yapılanlar |
|---|---|
| 1 — MVP + strateji | Kaydırmalı kart akışı, kategori sekmeleri, beğeni, paylaşım, bülten kaydı, PWA; RSS kaynaklarından aday toplama ve pozitiflik skoru; editör paneli (`/admin`) ve manuel onay; strateji belgesi (içerik kaynakları, gelir, operasyon). |
| 2 — Yapay zekâ ve güven | Gemini ile Türkçe taslak ve "başka kaynaklarda ara"; YouTube/Shorts, TikTok, Instagram Reels gömme; her kartta nokta düğmesi ile bilgi paneli (kaynak, doğrulama durumu, kimin getirdiği); yanlış/sahte içerik bildirme (3 farklı okurda otomatik gizleme); okur gönderimi (`/gonder`). |
| 3 — Pamuk Bulut tasarımı | Nunito yazı tipi, pastel renk token'ları, cam paneller, kategoriye özel SVG illüstrasyonlar (`CategoryArt`), karanlık mod. |
| 4 — Masaüstü ve yayın hazırlığı | Telefon çerçevesinde masaüstü düzeni, klavye gezinmesi; Netlify + Turso ile ücretsiz yayın (`netlify.toml`, `docs/YAYINLAMA.md`); derlemede otomatik migrasyon. |
| 5 — Gemini hata düzeltmesi | Model yedekleme (`gemini-flash-latest` → `gemini-flash-lite-latest`), Netlify 10 sn sınırına uygun 8,5 sn bütçe, anlaşılır hata mesajları. |
| 5b — Kategori ve kart ayarları | Sevgi kategorisi, bir habere en fazla 3 kategori, video öncelikli kart (başlık kısa süre görünür, sonra küçülür), logo hizası. |
| 6 — Operasyon ve sahneler | Kaynak silme (bekleyen adaylarla birlikte) ve silinen kaynağın yeniden eklenmemesi; panelde **Ayarlar** sekmesi (yayın gerektirmez); Netlify `ignore` süzgeci ve `yayin` dalı ile kredi koruma; görseller kırpılmadan sığar, dokununca tam ekran; medyasız haberler **Remotion** ile canlı oynayan 9:16 sahnelere dönüşür; isteğe bağlı MP4 dışa aktarma (`video/`, GitHub Actions). |
| 7 — Shorts sesi | YouTube/TikTok gömmeleri sessiz başlar (otomatik oynatma şartı); sağdaki ses düğmesi artık bu kartlarda da çıkar ve `postMessage` ile oynatıcının sesini açıp kapatır. Seçim sonraki kartlara da taşınır. Instagram gömmesi dışarıdan denetlenemez. |

## Mimari

- **Uygulama:** Next.js 16 (App Router, Turbopack, `proxy.ts`), React 19, Tailwind v4, TypeScript.
- **Veri:** Drizzle ORM + libSQL. Yerelde `file:./data/pamuk.db`, canlıda Turso. Migrasyonlar `drizzle/`; `npm run setup` = migrasyon + tohum.
- **Kimlik:** `ADMIN_PASSWORD` + `AUTH_SECRET` ile imzalı JWT çerezi; sunucu eylemleri oturumu ayrıca doğrular.
- **Yapay zekâ:** `@google/genai` (`src/lib/ai.ts`). **Ayarlar** (`src/lib/settings.ts`): önce veritabanı, yoksa ortam değişkeni.
- **Sahneler:** `src/remotion/` (`scene-data.ts` metni parçalar ve motif seçer, `Scene.tsx` kompozisyon, `illustrations.tsx` çizimler, `StoryScene.tsx` oynatıcı). MP4 için `video/` paketi ve `.github/workflows/video.yml`.
- **Gömme sesi:** `src/lib/embed-audio.ts` (komut biçimleri) ve `StoryMedia.tsx` içindeki `Embed`.

Önemli klasörler: `src/app` (sayfalar, `admin`, `api`), `src/components` (akış, kart, medya, panel), `src/lib` (iş mantığı), `src/db` (şema, tohum), `scripts` (migrasyon, RSS taraması), `docs`, `tests`.

## Yayın düzeni

- Netlify yalnızca `yayin` dalını izler (bir kerelik ayar: `docs/YAYINLAMA.md`). Geliştirme ayrı dalda sürer; "yayına al" denince `yayin` güncellenir. Her yayın 15 kredi harcar.
- `netlify.toml` `ignore` komutu belge/test değişikliklerinde derlemeyi atlar (kredi harcamaz).
- İçerik, kaynak ve ayar işleri panelden yapılır; yayın gerektirmez.
- RSS taraması: `.github/workflows/ingest.yml` (günde 4 kez), `vercel.json` (günde 1 kez).
- Sonradan Vercel'e taşınma: `docs/TASINMA-VERCEL.md`.

## Komutlar

`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run setup` · `npm run ingest`. MP4: `cd video && npm i && SITE_URL=https://siteniz npm run video -- <slug>`.

## Testler

Vitest ile 90'dan fazla birim testi (`tests/`): doğrulama, kategoriler, RSS toplama, güven/bildirim, Gemini hata eşleme, kaynak silme ve tohum işareti, `netlify.toml` `ignore` mantığı, sahne bölme/motif seçimi, gömme sesi. Arayüz senaryoları Playwright ile yerel Chromium'da elle çalıştırıldı (mobil ve masaüstü; akış, bildirim, admin, görüntüleyici, azaltılmış hareket).

## Bilinen sınırlar

- Gerçek YouTube/TikTok sesi sandbox'ta denenemedi; telefonda denenmeli. iOS Safari bazı durumlarda iframe sesini yalnızca doğrudan dokunuşla açar: yedek yol "Oynatıcıyı kullan".
- Sahneler tarayıcıda canlı çizilir; MP4 yalnızca isteğe bağlıdır.
- Remotion lisansı: bireyler ve en fazla 3 çalışanlı şirketler için ücretsiz; sonrası için şirket lisansı gerekir.
- Netlify ücretsiz planı kredi sınırlıdır; Vercel Hobby ticari kullanıma kapalı olabilir.

## Sonraki öneriler

Ücretsiz ziyaretçi sayacı (Cloudflare Web Analytics/GoatCounter), düşük puanlı adayları toplu reddetme, hata veren kaynağı otomatik kapatma, bülten gönderimi (Brevo/Buttondown), Gemini'yi "sahne yönetmeni" yapma, editör formunda sahne canlı önizlemesi.
