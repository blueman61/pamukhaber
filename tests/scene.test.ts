import { describe, expect, it } from "vitest";
import { buildScene, pickMotif, sceneDuration, splitBeats } from "@/remotion/scene-data";

describe("splitBeats", () => {
  it("splits sentences and caps at 3", () => {
    const beats = splitBeats("Bir köpek kayboldu. Mahalleli günlerce aradı. Sonunda buldular. Herkes çok sevindi. Mutlu son oldu.");
    expect(beats.length).toBeLessThanOrEqual(3);
    expect(beats.join(" ")).toContain("Mutlu son oldu.");
  });
  it("does not split after Turkish abbreviations", () => {
    const beats = splitBeats("Dr. Ayşe Yılmaz yeni bir tedavi yöntemi geliştirdi ve hastalar çok memnun kaldı. Bu bir başlangıç.");
    expect(beats[0].startsWith("Dr. Ayşe")).toBe(true);
  });
  it("breaks one long sentence into short beats", () => {
    const long = "Köydeki çocuklar için ".repeat(12).trim() + ".";
    const beats = splitBeats(long);
    expect(beats.length).toBeGreaterThan(1);
    for (const b of beats) expect(b.length).toBeLessThanOrEqual(135);
  });
  it("handles empty text", () => {
    expect(splitBeats("   ")).toEqual([]);
  });
});

describe("pickMotif", () => {
  it("matches keywords with suffixes", () => {
    expect(pickMotif("Öğretmenler kütüphanede kitap dağıttı", "topluluk")).toBe("kitap");
    expect(pickMotif("Fırından çıkan sıcak ekmekler askıda", "iyilik")).toBe("ekmek");
    expect(pickMotif("Kaplumbağalar denize döndü", "doga")).toBe("dalga");
  });
  it("handles Turkish İ/ı", () => {
    expect(pickMotif("KİTAP KULÜBÜ ÖĞRENCİLERİ", "iyilik")).toBe("kitap");
    expect(pickMotif("Yağmur DAMLALARI", "doga")).toBe("damla");
  });
  it("does not match short stems inside other words", () => {
    expect(pickMotif("Devlet yeni bir karar aldı", "basari")).toBe("basari");
  });
  it("falls back to the category", () => {
    expect(pickMotif("Sıradan bir cümle", "bilim")).toBe("bilim");
    expect(pickMotif("Sıradan bir cümle", "bilinmeyen")).toBe("iyilik");
  });
});

describe("sceneDuration", () => {
  it("is clamped to 8–22 seconds", () => {
    expect(sceneDuration("a", ["b"])).toBe(8 * 30);
    expect(sceneDuration("x".repeat(500), ["y".repeat(500)])).toBe(22 * 30);
  });
});

describe("buildScene", () => {
  it("returns a motif for every beat", () => {
    const s = buildScene({ id: 3, title: "Güzel haber", summary: "Kedi kurtarıldı. Herkes sevindi.", category: "hayvanlar" });
    expect(s.motifs).toHaveLength(Math.max(1, s.beats.length));
    expect(s.motifs[0]).toBe("kedi");
  });
});
