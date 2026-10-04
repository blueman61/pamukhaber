# Netlify'dan Vercel'e taşınma notları

Kod hosta bağımlı değildir: ortam değişkeni adları aynıdır, veritabanı Turso'da kalır, `vercel.json` hazırdır.

## Adımlar
1. Yeni Vercel hesabı → *Add New Project* → GitHub deposunu seçin. Üretim dalı olarak `yayin` dalını seçebilirsiniz (*Settings → Git → Production Branch*).
2. Ortam değişkenlerini Netlify'dakilerle aynı girin: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` ve isteğe bağlı `GEMINI_API_KEY`.
3. Build komutu: `npm run setup && npm run build` (tablolar ve ilk kurulum için). Silinen kaynaklar geri gelmez; ilk kurulum işareti veritabanında durur.
4. Alan adı ve `NEXT_PUBLIC_SITE_URL` değerini güncelleyin; GitHub'daki `SITE_URL` sırrını da yeni adrese çevirin (RSS taraması ve MP4 iş akışı kullanır).
5. Ayarlar sekmesindeki değerler veritabanında olduğu için taşınmaz kaybolmaz.

## Dikkat
- **Kullanım şartları:** Vercel ücretsiz (Hobby) planı ticari kullanıma kapalı olabilir. Reklam/sponsor geliri başlarsa Pro plan gerekebilir; güncel şartları kontrol edin.
- **Cron:** Hobby planda cron günde en çok bir kez çalışır. Daha sık RSS taraması için `.github/workflows/ingest.yml` (günde 4 kez) kalır.
- **Yerel SQLite** Vercel'de kalıcı değildir; Turso kullanın.
