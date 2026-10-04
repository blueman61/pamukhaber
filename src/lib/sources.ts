/**
 * Başlangıç RSS kaynakları. Editör panelindeki "Kaynaklar" sekmesinden
 * yenileri eklenebilir veya kapatılabilir. Çalışmayan bir kaynak panelde
 * hata mesajıyla görünür.
 */
export const DEFAULT_SOURCES = [
  // Yalnızca iyi haber yayınlayan siteler
  { name: "Good News Network", feedUrl: "https://www.goodnewsnetwork.org/feed/", siteUrl: "https://www.goodnewsnetwork.org", lang: "en" },
  { name: "Positive News", feedUrl: "https://www.positive.news/feed/", siteUrl: "https://www.positive.news", lang: "en" },
  { name: "Reasons to be Cheerful", feedUrl: "https://reasonstobecheerful.world/feed/", siteUrl: "https://reasonstobecheerful.world", lang: "en" },
  { name: "The Optimist Daily", feedUrl: "https://www.optimistdaily.com/feed/", siteUrl: "https://www.optimistdaily.com", lang: "en" },
  { name: "Good Good Good", feedUrl: "https://www.goodgoodgood.co/articles/rss.xml", siteUrl: "https://www.goodgoodgood.co", lang: "en" },
  // Genel Türkçe kaynaklar: pozitiflik skoru kuyruğu sıralar, editör seçer
  { name: "BBC Türkçe", feedUrl: "https://feeds.bbci.co.uk/turkce/rss.xml", siteUrl: "https://www.bbc.com/turkce", lang: "tr" },
  { name: "NTV Bilim-Teknoloji", feedUrl: "https://www.ntv.com.tr/bilim-teknoloji.rss", siteUrl: "https://www.ntv.com.tr", lang: "tr" },
] as const;
