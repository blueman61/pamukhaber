/**
 * Aday haberleri editör kuyruğunda SIRALAMAK için kaba bir pozitiflik skoru.
 * Bu skor hiçbir haberi otomatik olarak yayına almaz; son karar editördedir.
 *
 * Terimler kelime başından eşleşen regex parçalarıdır ("kurtar" → "kurtardı",
 * "kurtarıldı"). Sonu kesin olması gerekenler için negatif lookahead kullanılır
 * (ör. "kaza(?!n)" → "kazandı" eşleşmez, "kazada" eşleşir).
 */

const POSITIVE = [
  // Türkçe
  "kurtar", "iyilik", "bağış", "gönüllü", "umut", "mutlu", "sevin", "başarı", "ödül", "keşf",
  "keşif", "buluş", "iyileş", "şifa", "dayanışma", "yardım", "sahiplen", "yuva", "kavuş", "rekor",
  "mezun", "ilk kez", "fidan", "ağaç dik", "temiz enerji", "gülümse", "kahraman", "minnet",
  "teşekkür", "burs", "koruma altına", "kazan", "doğdu", "yavru",
  // İngilizce
  "rescu", "kindness", "donat", "volunteer", "hope", "happ", "joy", "celebrat", "award",
  "discover", "breakthrough", "heal", "recover", "reunit", "adopt", "record", "graduat",
  "first ever", "cure", "restor", "planted", "clean energy", "renewable", "smil", "hero",
  "grateful", "thank", "scholarship", "protect", "thriv", "bloom", "communit", "inspir",
  "uplift", "good news", "milestone", "comeback", "saved",
];

const NEGATIVE = [
  // Türkçe
  "öldü", "ölüm", "hayatını kaybet", "cinayet", "savaş", "saldırı", "bomba", "terör",
  "kaza(?!n)", "deprem", "yangın", "sel(?!\\p{L})", "taciz", "şiddet", "tutukla", "gözaltı",
  "skandal", "kriz", "iflas", "intihar", "yaralı", "felaket", "salgın", "katliam",
  // İngilizce
  "dead(?!line)", "death", "died", "kill", "murder", "wars?(?!\\p{L})", "attack", "bomb",
  "terror", "crash", "earthquake", "wildfire", "flood", "abuse", "violen", "arrest", "scandal",
  "crisis", "bankrupt", "suicide", "injur", "disaster", "pandemic", "shooting", "lawsuit",
];

const toRegexes = (terms: string[]) => terms.map((t) => new RegExp(`(?<!\\p{L})${t}`, "u"));
const POSITIVE_RE = toRegexes(POSITIVE);
const NEGATIVE_RE = toRegexes(NEGATIVE);

export const NEGATIVE_WEIGHT = 3;

export function scorePositivity(text: string): number {
  // Türkçe küçük harf "I"yı "ı" yapar; İngilizce metinler için normal küçültmeyi de deneriz.
  const variants = [text.toLocaleLowerCase("tr-TR"), text.toLowerCase()];
  const matches = (re: RegExp) => variants.some((v) => re.test(v));
  let score = 0;
  for (const re of POSITIVE_RE) if (matches(re)) score += 1;
  for (const re of NEGATIVE_RE) if (matches(re)) score -= NEGATIVE_WEIGHT;
  return score;
}
