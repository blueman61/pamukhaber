# Pamuk Haber — Strateji

> **Tek cümle:** Kötü haberden yorulan insanlara, günde birkaç dakikada içlerini ısıtacak, gerçek ve doğrulanmış güzel haberleri TikTok rahatlığında sunmak.

Bu doküman üç soruya cevap veriyor: **İçerik nereden gelecek? Para nasıl kazanılacak? Sistem nasıl işleyecek?** Sonunda yol haritası, ölçütler ve riskler var.

---

## 1. İçerik nereden gelecek?

### 1.1 Kaynak katmanları

| Katman | Örnekler | Nasıl alınır | Not |
|---|---|---|---|
| **A. Sadece iyi haber yapan siteler** | Good News Network, Positive News, Reasons to be Cheerful, The Optimist Daily, Good Good Good | RSS (sistemde hazır) | En yüksek isabet. İngilizce; editör Türkçe özetler. |
| **B. Ana akım medyanın yumuşak bölümleri** | BBC Türkçe, NTV Bilim, gazetelerin yaşam/bilim/kültür/spor beslemeleri | RSS + pozitiflik skoru | Hacim yüksek, isabet düşük; skor kuyruğu sıralar, editör seçer. |
| **C. Birinci elden kurumlar** | Belediyeler, üniversiteler, TÜBİTAK, hayvan hakları ve çevre dernekleri, hastane vakıfları, Kızılay, AFAD gönüllü programları | Basın bülteni RSS'i / e-posta listesi / X hesapları | Türkiye'ye özgü, rekabeti az içerik. Haber doğrulaması kolay. |
| **D. Görsel/video havuzları** | Pexels, Pixabay, Unsplash (ücretsiz lisans) | Editör arayıp ekler | Haber metniyle birlikte kullanılacak "atmosfer" görselleri. Kredi alanı doldurulur. |
| **E. Sosyal medya** | YouTube Shorts, TikTok, Instagram Reels | Resmi embed (paylaşım linki panelden girilir) | YouTube, TikTok ve Reels gömme sistemde hazır. Video platformda kalır, telif ve görüntülenme içerik sahibinde kalır. Başkasının videosunu indirip yüklemek yok. |
| **F. Okurlardan gelenler** ✅ | `/gonder` formu | Form → editör kuyruğu ("Okur" rozeti) → doğrulama | Topluluk duygusu ve özgün içerik. Doğrulanmadan yayına girmez; okur izin verirse adıyla anılır. |
| **G. Kendi ürettiğimiz dikey videolar** (yol haritası) | 15–30 sn "günün haberi" videoları | Canva/CapCut şablonu + seslendirme | TikTok/Reels/Shorts'ta büyüme motoru; siteye geri trafik getirir. |

### 1.2 Hukuki çerçeve (önemli)

- **Haberin kendisi (olgu) kimsenin malı değildir; ama metin, fotoğraf ve video telif ile korunur.** Bu yüzden sistem şu kurala göre tasarlandı: *metni kopyalamıyoruz, kendi cümlelerimizle kısa bir özet yazıyoruz ve orijinal habere bağlantı veriyoruz.* Editör formu kaynak bağlantısını zorunlu tutuyor.
- **Görseller:** RSS'ten gelen görsel, haber sitesinin malıdır. Varsayılan olarak Pexels/Unsplash gibi lisanslı görselleri tercih edin; haber sitesinin görselini kullanacaksanız izin alın. Form bu konuda uyarı gösteriyor.
- **Video:** Yalnızca resmi embed (YouTube) ya da izinli/kendi üretimimiz.
- **Sponsorlu içerik:** Reklam Kurulu düzenlemeleri gereği açıkça işaretlenmeli. Akışta "Sponsorlu · Marka" etiketi otomatik.
- **Bülten (KVKK + İYS):** E-posta toplarken aydınlatma metni gerekir; ticari ileti (sponsorlu bülten) göndermeden önce İleti Yönetim Sistemi (İYS) kaydı ve onay süreci tamamlanmalı.
- Yayına çıkmadan önce bir **bilişim/telif avukatıyla 1 saatlik görüşme** yapılmasını öneririm; bu doküman hukuki tavsiye değildir.

### 1.3 Şeffaflık ve okur bildirimleri

- Her kartta **yuvarlak içinde nokta** düğmesi: kaynak + ek kaynaklar, doğrulama durumu, haberi kimin getirdiği, yapay zekâ desteği.
- **Doğrulama seviyeleri:** ✅ *Doğrulandı* (ana kaynağa ek en az bir bağımsız kaynak — sistem bunu zorunlu tutar), 🔗 *Kaynağa dayalı* (tek güvenilir kaynak), ⏳ *Doğrulanmadı*.
- **Bildirim politikası:** Okurlar yanlış bilgi, sahte içerik, telif, uygunsuz içerik bildirebilir. Aynı hikâyeye 3 farklı okurdan açık bildirim gelirse hikâye otomatik gizlenir ve editör incelemesine düşer. Editör "asılsız" derse hikâye geri döner ve o bildirimler bir daha sayılmaz; "haklı" derse gizli kalır. Hedef: 24 saat içinde karar.
- Kötüye kullanım (toplu bildirimle beğenilmeyen haberi kaldırtma) riskine karşı eşik `REPORT_HIDE_THRESHOLD` ile yükseltilebilir.

### 1.4 Editoryal ilkeler

1. **Gerçek ve doğrulanabilir:** En az bir güvenilir kaynak; mümkünse birinci el.
2. **Tık tuzağı yok:** Başlık ne söylüyorsa haber o.
3. **"Toksik pozitiflik" yok:** Felaketin içindeki "güzel an"ı ön plana çıkarıp acıyı küçümseyen haberleri almıyoruz.
4. **Sıcak ama sade dil:** Başlık ≤ 90, özet ≤ 320 karakter (form bunu denetliyor).
5. **Çeşitlilik:** Akışta aynı kategoriden üst üste çok haber olmamasına dikkat; her gün en az bir Türkiye haberi.

---

## 2. Sistem nasıl işliyor?

```
  RSS kaynakları ──(günde 4 kez otomatik)──►  ADAY KUYRUĞU
                                               (pozitiflik skoruna göre sıralı)
                                                     │
                                         EDİTÖR (/admin) — tek karar verici
                                    oku → Türkçe başlık + özet yaz → kategori
                                    → görsel/video seç → kaynak linki → Yayınla
                                                     │
                                                     ▼
                       AKIŞ (/) — tam ekran dikey kartlar, kaydır-gülümse
                  ❤️ beğen · paylaş (/h/haber-linki) · bülten kartı · sponsorlu kart
```

### 2.1 Günlük editör rutini (sabah 30–45 dk)

1. `/admin` → **Kaynakları şimdi tara** (zaten otomatik çalışıyor; sabah bir kez de elle).
2. Kuyrukta üstteki 20–30 adaya göz at; uygun olmayanları **Reddet**.
3. 8–15 tanesini seç → **Düzenle ve yayınla**: Türkçe başlık, 2–3 cümle özet, kategori, görsel.
4. Gün içinde 2–3 kez kısa kontrol; akşam "günün en sevileni"ni not al (bülten için).

**Hedef hacim:** Başlangıçta günde 10, büyüdükçe 20–30 hikâye. Tek kişi için sürdürülebilir; ikinci editör günde 50 hikâyeye çıkarır.

### 2.2 Teknik mimari (özet)

- **Next.js + Tailwind:** Mobil öncelikli, PWA olarak ana ekrana eklenebilir.
- **SQLite / Turso:** Yerelde dosya, canlıda Turso'nun ücretsiz katmanı.
- **Vercel:** Ücretsiz katman başlangıç için yeterli. Aylık maliyet ≈ 0 TL (alan adı hariç).
- Detaylar ve kurulum için `README.md`.

---

## 3. Para nasıl kazanılacak?

Temel ilke: **Gelir modeli, markanın vaadini bozmamalı.** Akışa rastgele programatik reklam koymak (ör. bir kredi kartı ya da bahis reklamı) "huzurlu alan" hissini öldürür. Bu yüzden aşamalı ve seçici ilerliyoruz.

### 3.1 Aşamalar

| Aşama | Ne zaman | Gelir kalemi | Sistemde durum |
|---|---|---|---|
| **0. Kitle** | 0 → ~10 bin aylık kullanıcı | Gelir yok; bülten listesi ve sosyal medya büyütülür | Bülten kartı ✅ |
| **1. Okur desteği** | İlk günden | "Destek ol" (Patreon, Buy Me a Coffee, Kreosus vb.) — "kahve ısmarla" | `NEXT_PUBLIC_SUPPORT_URL` ile ✅ |
| **2. Bülten sponsorluğu** | ~2–5 bin abone | "Günün Pamuk Haberi" e-postasında tek sponsor satırı | Abone listesi ✅, gönderim harici servisle |
| **3. Native sponsorlu kart** | ~20 bin aylık kullanıcı | Değerleri uyumlu markalarla (organik gıda, kitapevi, sürdürülebilir moda, mama markaları, bankaların sosyal sorumluluk projeleri) haftalık kart | Sponsorlu kart ✅ (her 7 hikâyede bir, açık etiketli) |
| **4. Marka hikâyeleri** | ~50 bin+ | Şirketlerin gerçek sosyal sorumluluk projelerinin, editoryal standartla yazılmış "sponsorlu hikâye"si | Aynı altyapı |
| **5. B2B "iyi haber ekranı"** | Ürün oturunca | Hastane bekleme salonları, okul koridorları, ofis ekranları, otel lobileri için abonelikli tam ekran akış | Yol haritası (akış zaten tam ekran; kiosk modu eklenecek) |
| **6. Reklamsız üyelik** | ~100 bin+ | Aylık küçük ücretle sponsorsuz akış + özel bülten + erken erişim | Yol haritası |
| **7. Seçici programatik reklam** | Yüksek trafik | Yalnızca kategori engellemeli (bahis, kredi, alkol, siyaset, haber vb. kapalı) | Son çare; isteğe bağlı |

### 3.2 Kaba gelir senaryosu (varsayımlara dayalı)

> Bu rakamlar **örnek varsayımlardır**, piyasa teklifleriyle doğrulanmalıdır.

- **20 bin aylık kullanıcı, 5 bin bülten abonesi:**
  - Okur desteği: kullanıcıların %0,5'i ayda küçük bir miktar → küçük ama düzenli gelir.
  - Bülten sponsoru: haftada 1 sponsor slotu.
  - Native kart: ayda 2–4 marka.
  - Bu ölçekte hedef: sunucu + alan adı + bir yarı zamanlı editör maliyetini karşılamak.
- **200 bin aylık kullanıcı:** Sponsorlu hikâyeler + B2B ekran abonelikleri ana gelir; tam zamanlı 2 editör ve bir video üreticisi finanse edilebilir.

### 3.3 Sponsor seçim kriterleri

- Ürün/hizmet zararsız ve markanın vaadiyle uyumlu olmalı.
- Sponsor içeriği her zaman etiketli; editoryal hikâyeleri etkileyemez.
- Kara liste: bahis, kripto/hızlı zengin olma, kredi, alkol/tütün, siyasi parti, "mucize" sağlık ürünleri.

---

## 4. Büyüme

1. **Paylaşılabilirlik:** Her hikâyenin kendi bağlantısı (`/h/...`) ve sosyal medya önizlemesi var; paylaşılan link önce o hikâyeyi, sonra akışı açıyor. WhatsApp aile gruplarında "günaydın" mesajı yerine geçebilecek içerik.
2. **Kısa video kanalları:** Her gün en iyi 1–2 haberi 15–30 sn dikey videoya çevirip TikTok/Reels/Shorts'a koyup "Daha fazlası: pamukhaber" ile siteye yönlendirmek. Bu, en güçlü büyüme kanalı olacaktır.
3. **Bülten:** Her sabah tek haber. Açılma oranı yüksek olur, sponsorluğa en hızlı dönüşen kanal budur.
4. **İş birlikleri:** Hayvan ve çevre dernekleri, belediyeler, üniversiteler kendi iyi haberlerini paylaşmak ister; onlara "haberinizi bize gönderin" kanalı açın.
5. **SEO:** Uzun vadede kategori sayfaları ve haftalık "Bu haftanın 10 güzel haberi" derlemeleri.

---

## 5. Ölçütler (KPI)

| Ölçüt | Neden önemli | Hedef (ilk 3 ay) |
|---|---|---|
| Oturum başına görülen kart | Akışın sürükleyiciliği | ≥ 8 |
| Kart başına beğeni oranı | Editör seçiminin isabeti | ≥ %5 |
| Paylaşım sayısı / gün | Organik büyüme motoru | Sürekli artış |
| 7 gün içinde geri dönen kullanıcı | Alışkanlık oluşuyor mu | ≥ %25 |
| Bülten açılma oranı | Sponsor değeri | ≥ %45 |
| Editör başına günlük yayın | Operasyon verimi | 10–15 |

*Not: MVP'de beğeni sayaçları ve abone sayısı panelde görülüyor. Gizlilik dostu bir analitik (ör. Plausible, Umami) eklenmesi yol haritasında.*

---

## 6. Yol haritası

| Dönem | Neler |
|---|---|
| **Şimdi (MVP)** ✅ | Kaydırmalı akış, kategoriler, beğeni, paylaşım, bülten kaydı, sponsorlu kart, editör paneli, RSS toplama, PWA |
| **Ay 1** | Alan adı + Vercel + Turso kurulumu, gerçek kaynakların doğrulanması, ilk 300 hikâye, analitik, KVKK metinleri, bülten servisi (Buttondown/Brevo) entegrasyonu |
| **Faz 2** ✅ | Gemini ile yapay zekâ taslak + "başka kaynaklarda ara" doğrulama yardımı (**onay yine editörde**), TikTok/Reels gömme, bilgi paneli ve okur bildirimleri, okur gönderim formu |
| **Ay 3** | PWA bildirimleri ("Günün güzel haberi hazır ☀️"), haftalık derleme sayfası, okur gönderenlere "haberin yayında" e-postası |
| **Ay 4–6** | Kendi dikey video üretim hattı, B2B kiosk modu, reklamsız üyelik |
| **Sonrası** | Yerel haber haritası ("Senin şehrinden güzel haberler"), iOS/Android uygulaması, İngilizce sürüm |

---

## 7. Riskler ve önlemler

| Risk | Önlem |
|---|---|
| Yeterince içerik bulamamak | Çok katmanlı kaynak + yabancı kaynakların Türkçeleştirilmesi; günde 10 kaliteli hikâye yeterli |
| Monotonluk ("hep kedi haberi") | Kategori çeşitliliği kuralı, haftalık kategori dengesi kontrolü |
| Telif şikâyeti | Kendi özetimiz + link + lisanslı görsel; şikâyette 24 saatte kaldırma süreci |
| Editör tükenmişliği | Yapay zekâ taslak desteği, ikinci editör, haftalık planlama |
| Sponsorun güveni zedelemesi | Kara liste, açık etiket, editoryal bağımsızlık ilkesi |
| "Gerçek dışı iyimserlik" eleştirisi | Doğrulanmış kaynak şartı, toksik pozitiflik ilkesi, şeffaf "Haberleri nasıl seçiyoruz?" sayfası (`/hakkinda`) |
