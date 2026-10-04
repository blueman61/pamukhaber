export const CATEGORIES = [
  { slug: "hayvanlar", label: "Hayvanlar", emoji: "🐾", gradient: "from-amber-200 via-orange-200 to-rose-300" },
  { slug: "iyilik", label: "İyilik", emoji: "🤝", gradient: "from-rose-200 via-pink-200 to-fuchsia-300" },
  { slug: "bilim", label: "Bilim", emoji: "🔬", gradient: "from-sky-200 via-indigo-200 to-violet-300" },
  { slug: "doga", label: "Doğa", emoji: "🌿", gradient: "from-lime-200 via-emerald-200 to-teal-300" },
  { slug: "saglik", label: "Sağlık", emoji: "💚", gradient: "from-teal-200 via-cyan-200 to-sky-300" },
  { slug: "basari", label: "Başarı", emoji: "🏆", gradient: "from-yellow-200 via-amber-200 to-orange-300" },
  { slug: "topluluk", label: "Topluluk", emoji: "🏘️", gradient: "from-violet-200 via-purple-200 to-pink-300" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function isCategory(value: unknown): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[1];
}
