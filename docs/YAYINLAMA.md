# Pamuk Haber'i yayınlama (Netlify + Turso, ücretsiz)

Bu rehberle siteyi yaklaşık 15 dakikada, ücretsiz olarak internete açarsınız. Sonunda telefonda ve bilgisayarda açılan bir adresiniz olur (ör. `https://pamukhaber.netlify.app`).

- **Turso:** veritabanı. Ücretsiz plan kredi kartı istemez; 5 GB depolama, ayda 500 milyon satır okuma, 10 milyon satır yazma verir. Pamuk Haber'in ihtiyacının çok üstündedir.
- **Netlify:** siteyi çalıştıran sunucu. Next.js 16'yı ek ayar gerektirmeden destekler.

> **Netlify ücretsiz plan uyarısı:** Ücretsiz planda ayda **300 kredi** vardır.
> - Her canlı yayın (deploy) **15 kredi** harcar. Trafik ve sunucu kullanımı da kredi harcar.
> - Krediler bitince site ay sonuna kadar **durur**.
> - Bu yüzden her küçük değişiklikte yeniden yayınlamayın. Gerekirse 2. adımdaki "otomatik yayını durdurma" ayarını kullanın.
> - Trafik büyüyünce Netlify'ın ücretli planına geçebilir ya da Vercel gibi başka bir servise taşıyabilirsiniz. Kodda değişiklik gerekmez.

---

## 1. Turso veritabanını oluşturun

1. <https://turso.tech> adresine gidin, **Sign up** → **Continue with GitHub** ile giriş yapın.
2. Panelde **Create Database**'e tıklayın.
   - Ad: `pamukhaber`
   - Bölge: Avrupa'da bir konum (ör. Frankfurt). Türkiye'ye yakın olduğu için hızlı olur.
3. Veritabanı sayfasında iki bilgiyi alın ve bir yere not edin:
   - **Database URL:** `libsql://pamukhaber-kullaniciadi.turso.io` biçiminde bir adres. Bu sizin `DATABASE_URL` değerinizdir.
   - **Token:** "Create Token" / "Generate Token" düğmesiyle (yetki: okuma + yazma, süresiz) oluşturun. Bu sizin `DATABASE_AUTH_TOKEN` değerinizdir.

   Token bir şifredir; kimseyle paylaşmayın.

## 2. Netlify'da siteyi oluşturun

1. <https://www.netlify.com> adresine gidin, **Sign up** → **GitHub** ile giriş yapın.
2. **Add new project → Import an existing project → GitHub** seçin.
   - Netlify GitHub uygulaması depolarınıza erişim isterse `blueman61/pamukhaber` deposuna izin verin.
3. Depo olarak **pamukhaber**'i seçin.
   - **Branch to deploy:** `ccr-bca953b7-met524` (kod şu an bu dalda; ileride `main`'e birleştirirseniz `main` seçin).
   - Derleme ayarlarını değiştirmeyin; `netlify.toml` dosyası bunları otomatik verir.
4. Aynı ekrandaki **Add environment variables** bölümüne şunları ekleyin:

| Değişken | Değer |
|---|---|
| `DATABASE_URL` | 1. adımdaki `libsql://…` adresi |
| `DATABASE_AUTH_TOKEN` | 1. adımdaki token |
| `ADMIN_PASSWORD` | Editör paneline girerken kullanacağınız şifre (güçlü bir şifre seçin) |
| `AUTH_SECRET` | En az 32 karakterlik rastgele bir dize (aşağıya bakın) |
| `GEMINI_API_KEY` | *(isteğe bağlı)* Yapay zekâ taslağı için: <https://aistudio.google.com/apikey> |

   **`AUTH_SECRET` nasıl üretilir?** Tarayıcıda herhangi bir sayfadayken F12 ile konsolu açın ve şunu yazın:
   ```js
   crypto.randomUUID() + crypto.randomUUID()
   ```
   Çıkan uzun metni (tırnaklar olmadan) değer olarak yapıştırın.

5. **Deploy**'a tıklayın. İlk yayın 2–4 dakika sürer. Bu sırada:
   - Veritabanı tabloları otomatik oluşturulur.
   - Örnek içerikler eklenir. Bunlar "Örnek içerik" etiketli, gerçek haber olmayan kartlardır; editör panelinden tek tıkla silinir.
6. Yayın bitince Netlify size `https://rastgele-ad.netlify.app` gibi bir adres verir.
   - Adı değiştirmek için: **Site configuration → Change site name** (ör. `pamukhaber`).

**Kredi tasarrufu (isteğe bağlı):** Her `git push` otomatik yeni yayın başlatır (15 kredi). Bunu durdurmak için:
- **Site configuration → Build & deploy → Continuous deployment → Stop builds** seçin.
- Yayın istediğinizde **Deploys → Trigger deploy** ile elle başlatın.

## 3. Son dokunuş: site adresini tanıtın

Paylaşılan haber bağlantılarının WhatsApp vb. önizlemelerinde doğru adres görünsün diye:

1. **Site configuration → Environment variables → Add a variable**: `NEXT_PUBLIC_SITE_URL` = `https://sizin-adiniz.netlify.app`
2. **Deploys → Trigger deploy → Deploy site** ile bir kez yeniden yayınlayın.

## 4. Kullanmaya başlayın

- **Telefonda:** adresi Safari/Chrome'da açın.
  - iPhone: Paylaş → **Ana Ekrana Ekle**.
  - Android: ⋮ → **Ana ekrana ekle**.

  Pamuk Haber uygulama gibi tam ekran açılır.
- **Bilgisayarda:** aynı adresi açın.
  - Masaüstü düzeninde solda kategoriler, ortada kayan haber kartı, sağda bülten ve haber gönderme kutuları görünür.
  - Klavyede ↑ ↓ (veya J / K, boşluk) ile haberler arasında gezilir.
- **Editör paneli:** `https://sizin-adiniz.netlify.app/admin` → `ADMIN_PASSWORD` ile giriş.
  - **Kaynakları şimdi tara:** RSS'ten aday haberleri toplar.
  - **Düzenle ve yayınla:** adayı Türkçe özetleyip yayınlar.
  - **Yayında → Örnek içerikleri sil:** demo kartları kaldırır.

## 5. (İsteğe bağlı) Haberleri otomatik toplama

RSS kaynaklarının günde 4 kez kendiliğinden taranması için GitHub Actions kullanılır (`.github/workflows/ingest.yml`):

1. Netlify'da bir ortam değişkeni daha ekleyin: `CRON_SECRET` = rastgele bir dize (`AUTH_SECRET` gibi üretin). Ardından yeniden yayınlayın.
2. GitHub'da depo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `SITE_URL` = `https://sizin-adiniz.netlify.app`
   - `CRON_SECRET` = Netlify'a girdiğiniz değerin aynısı

Bu tarama Netlify yayını tetiklemez; yalnızca birkaç sunucu isteği harcar.

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| Yayın "DATABASE_URL tanımlı değil" hatasıyla duruyor | 2. adımdaki ortam değişkenlerini kontrol edin, **Deploys → Trigger deploy** ile tekrar deneyin. |
| Yayın Turso bağlantı hatası veriyor | `DATABASE_URL`'in `libsql://` ile başladığından ve token'ın tam kopyalandığından emin olun; gerekirse yeni token oluşturun. |
| `/admin`'de "Giriş kapalı" uyarısı | `ADMIN_PASSWORD` ve `AUTH_SECRET` (en az 16 karakter) tanımlı olmalı; ekledikten sonra yeniden yayınlayın. |
| Akış boş, "Bu kategoride henüz haber yok" | Örnek içerikleri sildiyseniz normaldir: `/admin` → Kaynakları tara → aday seçip yayınlayın. |
| RSS taramasında kaynaklar hata veriyor | `/admin` → **Kaynaklar** sekmesinde hata veren adresi güncelleyin veya kapatın. |
| "Gemini API anahtarı geçersiz" | <https://aistudio.google.com/apikey> adresinden anahtarı yeniden kopyalayın (başında/sonunda boşluk olmasın), `GEMINI_API_KEY`'i güncelleyip yeniden yayınlayın. |
| "Gemini modeli bulunamadı" | `GEMINI_MODEL` tanımladıysanız silin (varsayılan `gemini-flash-latest` kullanılır) ya da AI Studio'daki güncel bir model adını girin. |
| "Yapay zekâ zamanında yanıt veremedi" | Netlify ücretsiz planı sunucu işlerini 10 saniyede keser. Tekrar deneyin; sık oluyorsa `GEMINI_MODEL=gemini-flash-lite-latest` (daha hızlı) deneyin. |
| Yapay zekâ başka bir hata veriyor | Mesajın sonundaki parantez içindeki ayrıntıya bakın; tam kayıt **Netlify → Logs → Functions** bölümünde `[ai]` ile başlayan satırlardadır. |
| Site "Site not available" diyor | Netlify aylık kredisi bitmiş olabilir; **Team → Billing / Usage** bölümüne bakın. |
