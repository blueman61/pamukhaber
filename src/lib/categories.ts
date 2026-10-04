/** Kategoriye özel illüstrasyon paleti: gökyüzü (üst→alt), güneş, iki tepe, motif rengi. */
export type ArtPalette = { sky: [string, string]; sun: string; hills: [string, string]; motif: string };

export const CATEGORIES = [
  {
    slug: "hayvanlar",
    label: "Hayvanlar",
    emoji: "🐾",
    color: "#f59e6b",
    art: { sky: ["#ffe1c7", "#ffc9b8"], sun: "#fff3c4", hills: ["#ffb59c", "#f7957f"], motif: "#e0735a" },
  },
  {
    slug: "iyilik",
    label: "İyilik",
    emoji: "🤝",
    color: "#ec5f9b",
    art: { sky: ["#ffe0ec", "#ffc6dc"], sun: "#fff1f6", hills: ["#f9a8c9", "#ee86b1"], motif: "#e2508f" },
  },
  {
    slug: "bilim",
    label: "Bilim",
    emoji: "🔬",
    color: "#7c83f2",
    art: { sky: ["#dfe4ff", "#c9cbff"], sun: "#f4f0ff", hills: ["#aeb3f7", "#8f93ea"], motif: "#6a6fe0" },
  },
  {
    slug: "doga",
    label: "Doğa",
    emoji: "🌿",
    color: "#3fb57e",
    art: { sky: ["#e3f7e9", "#c6eed7"], sun: "#fffbd6", hills: ["#9adbb6", "#6fc79a"], motif: "#3a9f6e" },
  },
  {
    slug: "saglik",
    label: "Sağlık",
    emoji: "💚",
    color: "#2fb3b3",
    art: { sky: ["#dcf6f6", "#bfeaf0"], sun: "#f2fffd", hills: ["#93dcd8", "#68c7c6"], motif: "#2a9d9f" },
  },
  {
    slug: "basari",
    label: "Başarı",
    emoji: "🏆",
    color: "#f2a93b",
    art: { sky: ["#fff3cf", "#ffe1a8"], sun: "#fffbea", hills: ["#ffd07a", "#f7b955"], motif: "#e0952a" },
  },
  {
    slug: "topluluk",
    label: "Topluluk",
    emoji: "🏘️",
    color: "#a07cf0",
    art: { sky: ["#efe5ff", "#ddcdfd"], sun: "#fbf6ff", hills: ["#c4aaf7", "#a98ae9"], motif: "#8a63dd" },
  },
] as const satisfies readonly { slug: string; label: string; emoji: string; color: string; art: ArtPalette }[];

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export function getCategory(slug: string): Category {
  return CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[1];
}
