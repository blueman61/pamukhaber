import { isCategory, type CategorySlug } from "@/lib/categories";

export const FPS = 30;
export const SCENE_W = 1080;
export const SCENE_H = 1920;
export const MAX_BEATS = 3;
const BEAT_MAX_CHARS = 110;
const MIN_SECONDS = 8;
const MAX_SECONDS = 22;

export type SceneMotif =
  | CategorySlug
  | "kitap"
  | "ekmek"
  | "cicek"
  | "dalga"
  | "kedi"
  | "gunes"
  | "damla";

export type SceneData = {
  title: string;
  beats: string[];
  motifs: SceneMotif[];
  category: string;
  categories: string[];
  sourceName: string;
  seed: number;
  durationInFrames: number;
};

const ABBREVIATIONS = /(?:^|\s)(?:Dr|Prof|Doç|Av|Sn|Yrd|Müh|Uzm|Op|Bkz|vb|vs|örn|No)\.$/;

/** Özeti en çok 3 kısa parçaya böler; her parça ekranda rahat okunur (~110 karakter). */
export function splitBeats(summary: string): string[] {
  const text = summary.replace(/\s+/g, " ").trim();
  if (!text) return [];

  const raw = text.split(/(?<=[.!?…])\s+(?=[A-ZÇĞİÖŞÜ0-9"“'‘(])/u);
  const sentences: string[] = [];
  for (const piece of raw) {
    const last = sentences.length - 1;
    if (last >= 0 && ABBREVIATIONS.test(sentences[last])) sentences[last] += ` ${piece}`;
    else sentences.push(piece);
  }

  // Çok uzun cümleleri virgül ya da boşlukta böl.
  const parts: string[] = [];
  for (const sentence of sentences) {
    let rest = sentence;
    while (rest.length > BEAT_MAX_CHARS) {
      const window = rest.slice(0, BEAT_MAX_CHARS);
      let cut = Math.max(window.lastIndexOf(", "), window.lastIndexOf("; "));
      if (cut < BEAT_MAX_CHARS * 0.4) cut = window.lastIndexOf(" ");
      if (cut <= 0) cut = BEAT_MAX_CHARS;
      parts.push(rest.slice(0, cut + 1).trim().replace(/[,;]$/, ""));
      rest = rest.slice(cut + 1).trim();
    }
    if (rest) parts.push(rest);
  }

  // Çok kısa parçaları komşusuyla birleştir, sonra en çok MAX_BEATS parçaya indir.
  const merged: string[] = [];
  for (const part of parts) {
    const last = merged.length - 1;
    if (last >= 0 && (merged[last].length < 32 || part.length < 24) && merged[last].length + part.length < BEAT_MAX_CHARS + 20) {
      merged[last] += ` ${part}`;
    } else merged.push(part);
  }
  while (merged.length > MAX_BEATS) {
    // En kısa komşu çiftini birleştir.
    let best = 0;
    let bestLen = Infinity;
    for (let i = 0; i < merged.length - 1; i++) {
      const len = merged[i].length + merged[i + 1].length;
      if (len < bestLen) [best, bestLen] = [i, len];
    }
    merged.splice(best, 2, `${merged[best]} ${merged[best + 1]}`);
  }
  return merged;
}

/** Türkçe karakterleri sadeleştirir ("İ/ı" dahil) ve küçük harfe çevirir. */
function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g");
}

type Rule = { motif: SceneMotif; stems: string[]; exact?: string[] };

const RULES: Rule[] = [
  { motif: "kedi", stems: ["kedi", "yavru kedi"] },
  { motif: "hayvanlar", stems: ["kopek", "pati", "hayvan", "barinak", "sahiplen", "yavru", "kus"], exact: ["at"] },
  { motif: "kitap", stems: ["kitap", "okul", "ogretmen", "ogrenci", "kutuphane", "okuma", "egitim", "burs"] },
  { motif: "ekmek", stems: ["ekmek", "firin", "yemek", "corba", "mutfak", "gida", "askida"] },
  { motif: "dalga", stems: ["deniz", "kaplumbaga", "balik", "okyanus", "dalga", "sahil", "dalgic"] },
  { motif: "cicek", stems: ["cicek", "bahce", "lale", "papatya", "bahar"], exact: ["ari"] },
  { motif: "gunes", stems: ["gunes", "enerji", "panel", "elektrik", "isik"] },
  { motif: "damla", stems: ["yagmur", "damla", "kuraklik", "icme suyu", "musluk"], exact: ["su"] },
  { motif: "doga", stems: ["agac", "orman", "fidan", "dogal", "ekosistem", "geri donusum", "temizlik"] },
  { motif: "sevgi", stems: ["kalp", "sevgi", "evlilik", "evlen", "sevgili", "dugun", "annesi", "babasi"], exact: ["ask", "cift"] },
  { motif: "saglik", stems: ["saglik", "hastane", "doktor", "tedavi", "iyilesti", "ameliyat", "organ", "kan bagisi"] },
  { motif: "bilim", stems: ["bilim", "bulus", "uzay", "arastirma", "kesif", "yapay zeka", "teknoloji", "robot"] },
  { motif: "basari", stems: ["odul", "sampiyon", "basari", "madalya", "birinci", "rekor", "diploma"] },
  { motif: "topluluk", stems: ["mahalle", "komsu", "belediye", "gonullu", "dayanisma"], exact: ["ev", "koy"] },
  { motif: "iyilik", stems: ["hediye", "bagis", "yardim", "iyilik", "destek", "paylas"] },
];

/** Metindeki anahtar kelimelere göre motif; bulunamazsa kategorinin kendi motifi. */
export function pickMotif(text: string, category: string): SceneMotif {
  const norm = normalize(text);
  const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
  let best: SceneMotif | null = null;
  let bestScore = 0;
  for (const rule of RULES) {
    let score = 0;
    for (const stem of rule.stems) {
      const s = stem.trim();
      if (!s) continue;
      if (s.includes(" ")) {
        if (norm.includes(s)) score += 2;
      } else if (s.length < 3) {
        if (tokens.includes(s)) score += 1;
      } else if (tokens.some((t) => t.startsWith(s))) score += 1;
    }
    for (const word of rule.exact ?? []) if (tokens.includes(word)) score += 1;
    if (score > bestScore) [best, bestScore] = [rule.motif, score];
  }
  return best ?? (isCategory(category) ? category : "iyilik");
}

/** Okuma hızına göre süre (kare): 8–22 sn arası. */
export function sceneDuration(title: string, beats: string[]): number {
  const chars = title.length + beats.reduce((n, b) => n + b.length, 0);
  const seconds = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, 4 + chars / 18));
  return Math.round(seconds * FPS);
}

export type SceneSource = {
  id: number;
  title: string;
  summary: string;
  category: string;
  categories?: string[];
  sourceName?: string | null;
};

export function buildScene(story: SceneSource): SceneData {
  const beats = splitBeats(story.summary);
  const motifs = beats.length
    ? beats.map((b) => pickMotif(`${b} ${story.title}`, story.category))
    : [pickMotif(story.title, story.category)];
  return {
    title: story.title,
    beats,
    motifs,
    category: story.category,
    categories: story.categories?.length ? story.categories : [story.category],
    sourceName: story.sourceName ?? "",
    seed: story.id,
    durationInFrames: sceneDuration(story.title, beats),
  };
}
