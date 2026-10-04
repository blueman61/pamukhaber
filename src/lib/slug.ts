const TR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i̇: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** Türkçe karakterleri sadeleştirip URL dostu bir slug üretir. */
export function slugify(input: string, maxLength = 60): string {
  const base = input
    .toLocaleLowerCase("tr-TR")
    .replace(/i̇|[çğıöşüâîû]/g, (ch) => TR_MAP[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const trimmed = base.slice(0, maxLength).replace(/-+$/g, "");
  return trimmed || "haber";
}

/** Çakışmayı önlemek için slug sonuna kısa rastgele bir ek koyar. */
export function uniqueSlug(input: string): string {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${slugify(input)}-${suffix}`;
}
