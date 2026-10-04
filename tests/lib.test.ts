import { describe, expect, it } from "vitest";
import { buildSlides, NEWSLETTER_AFTER, SPONSOR_EVERY } from "@/lib/feed";
import { youtubeId } from "@/lib/media";
import { scorePositivity } from "@/lib/positivity";
import { slugify } from "@/lib/slug";
import type { FeedStory } from "@/lib/stories";
import { normalizeEmail, validateStoryForm } from "@/lib/validation";

describe("scorePositivity", () => {
  it("ranks uplifting stories above grim ones", () => {
    const good = scorePositivity("Gönüllüler yaralı yavru kediyi kurtardı ve yeni yuvasına kavuşturdu");
    const bad = scorePositivity("Depremde 12 kişi hayatını kaybetti");
    expect(good).toBeGreaterThan(0);
    expect(bad).toBeLessThan(0);
    expect(good).toBeGreaterThan(bad);
  });

  it("does not confuse words that merely contain negative terms", () => {
    expect(scorePositivity("Team wins award for clean energy")).toBeGreaterThan(0);
    expect(scorePositivity("Öğrenci yarışmayı kazandı")).toBeGreaterThan(0);
    expect(scorePositivity("Yeni deadline açıklandı")).toBe(0);
  });

  it("handles English capital I correctly", () => {
    expect(scorePositivity("Inspiring teens plant 10,000 trees")).toBeGreaterThan(0);
    expect(scorePositivity("INJURED in attack")).toBeLessThan(0);
  });
});

describe("slugify", () => {
  it("transliterates Turkish characters", () => {
    expect(slugify("Şehrin İlk Çiğ Köftecisi Öğrencilere Ücretsiz!")).toBe("sehrin-ilk-cig-koftecisi-ogrencilere-ucretsiz");
    expect(slugify("Işık ve Ağaç")).toBe("isik-ve-agac");
  });

  it("falls back for empty input", () => {
    expect(slugify("!!!")).toBe("haber");
  });
});

describe("youtubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/abcDEF12345", "abcDEF12345"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=5", "dQw4w9WgXcQ"],
    ["https://vimeo.com/123", null],
    ["not a url", null],
  ])("%s → %s", (url, id) => {
    expect(youtubeId(url)).toBe(id);
  });
});

const form = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};

describe("validateStoryForm", () => {
  const valid = {
    title: "Mahalleli kedilere kış evi yaptı",
    summary: "Kısa ve sıcak bir özet.",
    category: "hayvanlar",
    mediaType: "none",
    sourceUrl: "https://example.com/haber",
  };

  it("accepts a valid story", () => {
    const r = validateStoryForm(form(valid));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.mediaUrl).toBeNull();
  });

  it("requires a source link for editorial stories", () => {
    const r = validateStoryForm(form({ ...valid, sourceUrl: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.sourceUrl).toBeDefined();
  });

  it("rejects bad media and categories", () => {
    const r = validateStoryForm(form({ ...valid, category: "savas", mediaType: "youtube", mediaUrl: "https://vimeo.com/1" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.category).toBeDefined();
      expect(r.errors.mediaUrl).toBeDefined();
    }
  });

  it("rejects javascript: URLs", () => {
    const r = validateStoryForm(form({ ...valid, sourceUrl: "javascript:alert(1)" }));
    expect(r.ok).toBe(false);
  });

  it("requires a sponsor name for sponsored stories", () => {
    const r = validateStoryForm(form({ ...valid, sourceUrl: "", isSponsored: "on" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.sponsorName).toBeDefined();
  });
});

describe("normalizeEmail", () => {
  it("normalizes and validates", () => {
    expect(normalizeEmail("  Ayse@Ornek.COM ")).toBe("ayse@ornek.com");
    expect(normalizeEmail("ayse@")).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });
});

describe("buildSlides", () => {
  const story = (id: number): FeedStory => ({
    id,
    slug: `s-${id}`,
    title: `Hikâye ${id}`,
    summary: "",
    category: "iyilik",
    categories: ["iyilik"],
    mediaType: "none",
    mediaUrl: null,
    mediaCredit: null,
    sourceName: null,
    sourceUrl: null,
    isSponsored: false,
    sponsorName: null,
    sponsorUrl: null,
    isDemo: false,
    likes: 0,
    origin: "editor",
    submitterName: null,
    verification: "source",
    verificationNote: null,
    extraSources: [],
    aiAssisted: false,
    createdAt: new Date(0).toISOString(),
  });

  it("interleaves newsletter and rotating sponsored cards", () => {
    const stories = Array.from({ length: SPONSOR_EVERY * 2 }, (_, i) => story(i + 1));
    const ads = [{ ...story(100), isSponsored: true }, { ...story(101), isSponsored: true }];
    const slides = buildSlides(stories, ads, false);

    expect(slides.filter((s) => s.kind === "newsletter")).toHaveLength(1);
    expect(slides[NEWSLETTER_AFTER].kind).toBe("newsletter");
    const sponsored = slides.filter((s) => s.kind === "sponsored");
    expect(sponsored.map((s) => s.kind === "sponsored" && s.story.id)).toEqual([100, 101]);
    expect(slides.at(-1)?.kind).toBe("end");
    expect(new Set(slides.map((s) => s.key)).size).toBe(slides.length);
  });

  it("omits the end card while more pages exist", () => {
    expect(buildSlides([story(1)], [], true).map((s) => s.kind)).toEqual(["story"]);
  });

  it("shows only the end card when there are no stories", () => {
    expect(buildSlides([], [], false).map((s) => s.kind)).toEqual(["end"]);
  });
});
