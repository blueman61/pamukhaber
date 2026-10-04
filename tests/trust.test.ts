import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { findCorroboration, generateDraft, parseDraft, type Generator } from "@/lib/ai";
import { resolveShortLink } from "@/lib/links";
import { embedSrc, instagramShortcode, isTiktokShortLink, tiktokId } from "@/lib/media";
import { dismissReports, recordReport } from "@/lib/reports";
import { DAILY_SUBMISSION_LIMIT, isSafePublicUrl, parseSubmissionForm, submitStory, type SubmissionInput } from "@/lib/submissions";
import { validateStoryForm } from "@/lib/validation";

let db: Db;
let storyId: number;

beforeEach(async () => {
  db = drizzle(createClient({ url: ":memory:" }), { schema }) as unknown as Db;
  await migrate(db, { migrationsFolder: "drizzle" });
  const [row] = await db
    .insert(schema.stories)
    .values({ slug: "kedi", title: "Kedi", summary: "Özet", category: "hayvanlar" })
    .returning({ id: schema.stories.id });
  storyId = row.id;
});

describe("TikTok / Instagram links", () => {
  it.each([
    ["https://www.tiktok.com/@pamuk.haber/video/7312345678901234567", "7312345678901234567"],
    ["https://www.tiktok.com/@a_b/video/7312345678901234567?is_from_webapp=1&sender_device=pc", "7312345678901234567"],
    ["https://m.tiktok.com/@a/video/7312345678901234567", "7312345678901234567"],
    ["https://www.tiktok.com/embed/v2/7312345678901234567", "7312345678901234567"],
    ["https://www.tiktok.com/player/v1/7312345678901234567", "7312345678901234567"],
    ["https://vm.tiktok.com/ZMabc123/", null],
    ["https://www.tiktok.com/@a", null],
    ["https://evil.com/@a/video/7312345678901234567", null],
  ])("tiktokId(%s) → %s", (url, id) => expect(tiktokId(url)).toBe(id));

  it("recognises short links", () => {
    expect(isTiktokShortLink("https://vm.tiktok.com/ZMabc123/")).toBe(true);
    expect(isTiktokShortLink("https://www.tiktok.com/t/ZTabc/")).toBe(true);
    expect(isTiktokShortLink("https://www.tiktok.com/@a/video/7312345678901234567")).toBe(false);
  });

  it.each([
    ["https://www.instagram.com/reel/C1a2B3c4D5e/", "C1a2B3c4D5e"],
    ["https://www.instagram.com/reels/C1a2B3c4D5e/?igsh=abc", "C1a2B3c4D5e"],
    ["https://instagram.com/p/C1a2B3c4D5e", "C1a2B3c4D5e"],
    ["https://www.instagram.com/pamuk.haber/reel/C1a2B3c4D5e/", "C1a2B3c4D5e"],
    ["https://www.instagram.com/pamuk.haber/", null],
    ["https://instagram.evil.com/reel/C1a2B3c4D5e", null],
  ])("instagramShortcode(%s) → %s", (url, code) => expect(instagramShortcode(url)).toBe(code));

  it("builds embed URLs", () => {
    expect(embedSrc("tiktok", "https://www.tiktok.com/@a/video/7312345678901234567")).toMatch(
      /^https:\/\/www\.tiktok\.com\/player\/v1\/7312345678901234567\?autoplay=1/,
    );
    expect(embedSrc("instagram", "https://www.instagram.com/reel/C1a2B3c4D5e/")).toBe(
      "https://www.instagram.com/reel/C1a2B3c4D5e/embed/",
    );
    expect(embedSrc("tiktok", "https://example.com")).toBeNull();
  });

  it("resolves short links by following redirects", async () => {
    const fake = async () => ({ url: "https://www.tiktok.com/@a/video/7312345678901234567" }) as Response;
    expect(await resolveShortLink("https://vm.tiktok.com/ZMabc123/", fake)).toBe(
      "https://www.tiktok.com/@a/video/7312345678901234567",
    );
    const failing = async () => {
      throw new Error("network");
    };
    expect(await resolveShortLink("https://vm.tiktok.com/ZMabc123/", failing)).toBe("https://vm.tiktok.com/ZMabc123/");
    expect(await resolveShortLink("https://youtu.be/dQw4w9WgXcQ", failing)).toBe("https://youtu.be/dQw4w9WgXcQ");
  });
});

const form = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};

describe("story trust fields", () => {
  const base = { title: "Başlık", summary: "Özet", category: "iyilik", sourceUrl: "https://example.com/a" };

  it("validates TikTok and Instagram media", () => {
    expect(validateStoryForm(form({ ...base, mediaType: "tiktok", mediaUrl: "https://www.tiktok.com/@a/video/7312345678901234567" })).ok).toBe(true);
    expect(validateStoryForm(form({ ...base, mediaType: "tiktok", mediaUrl: "https://youtu.be/x" })).ok).toBe(false);
    expect(validateStoryForm(form({ ...base, mediaType: "instagram", mediaUrl: "https://www.instagram.com/reel/C1a2B3c4D5e/" })).ok).toBe(true);
  });

  it("requires an independent extra source for 'verified'", () => {
    const r = validateStoryForm(form({ ...base, verification: "verified" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.verification).toBeDefined();
    const ok = validateStoryForm(form({ ...base, verification: "verified", extraSources: "https://b.com/x\nhttps://b.com/x\n" }));
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.data.extraSources).toBe("https://b.com/x");
  });

  it("rejects non-URL extra sources and keeps submitter only for reader origin", () => {
    expect(validateStoryForm(form({ ...base, extraSources: "javascript:alert(1)" })).ok).toBe(false);
    const editor = validateStoryForm(form({ ...base, origin: "editor", submitterName: "Ayşe" }));
    expect(editor.ok && editor.data.submitterName).toBeNull();
    const reader = validateStoryForm(form({ ...base, origin: "reader", submitterName: "Ayşe" }));
    expect(reader.ok && reader.data.submitterName).toBe("Ayşe");
    const weird = validateStoryForm(form({ ...base, origin: "hacker", verification: "maybe" }));
    expect(weird.ok && [weird.data.origin, weird.data.verification]).toEqual(["editor", "source"]);
  });
});

describe("recordReport", () => {
  const report = (hash: string) => recordReport(db, { storyId, reason: "sahte", note: null, reporterHash: hash }, 3);

  it("hides a story after 3 distinct reporters and ignores repeats", async () => {
    expect(await report("a")).toMatchObject({ ok: true, duplicate: false, openReports: 1, hidden: false });
    expect(await report("a")).toMatchObject({ ok: true, duplicate: true, openReports: 1, hidden: false });
    expect(await report("b")).toMatchObject({ openReports: 2, hidden: false });
    expect(await report("c")).toMatchObject({ openReports: 3, hidden: true });

    const [s] = await db.select().from(schema.stories).where(eq(schema.stories.id, storyId));
    expect(s.status).toBe("hidden");
    expect(s.hiddenReason).toBe("reports");
  });

  it("dismissing restores the story and resets the count", async () => {
    await report("a");
    await report("b");
    await report("c");
    await dismissReports(db, storyId);
    const [s] = await db.select().from(schema.stories).where(eq(schema.stories.id, storyId));
    expect(s.status).toBe("published");
    expect(s.hiddenReason).toBeNull();
    // Reddedilen bildirimler sayılmaz; yeni bir kişi tek başına gizleyemez.
    expect(await report("d")).toMatchObject({ openReports: 1, hidden: false });
  });

  it("does not republish a story the editor hid manually", async () => {
    await db.update(schema.stories).set({ status: "hidden" }).where(eq(schema.stories.id, storyId));
    await report("a");
    await dismissReports(db, storyId);
    const [s] = await db.select().from(schema.stories).where(eq(schema.stories.id, storyId));
    expect(s.status).toBe("hidden");
  });

  it("returns not_found for unknown stories", async () => {
    expect(await recordReport(db, { storyId: 999, reason: "yanlis", note: null, reporterHash: "x" })).toEqual({
      ok: false,
      error: "not_found",
    });
  });
});

describe("reader submissions", () => {
  it("blocks private network URLs (SSRF)", () => {
    expect(isSafePublicUrl("https://haber.example.com/a")).toBe(true);
    for (const bad of [
      "http://localhost:3000/admin",
      "http://127.0.0.1/",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/",
      "http://intranet/",
      "http://printer.local/",
      "https://user:pw@example.com/",
      "https://example.com:8443/",
      "file:///etc/passwd",
    ]) {
      expect(isSafePublicUrl(bad), bad).toBe(false);
    }
  });

  it("parses the form, honouring the honeypot and name consent", () => {
    const f = form({ url: "https://haber.example.com/a?utm_source=x", note: "Komşular birlikte park yaptı, çok güzel." });
    const parsed = parseSubmissionForm(f, "h1");
    expect(parsed).toMatchObject({ url: "https://haber.example.com/a", allowName: false, email: null });
    expect(parseSubmissionForm(form({ url: "http://localhost/x", note: "yeterince uzun not" }), "h")).toMatchObject({
      ok: false,
      field: "url",
    });
    expect(parseSubmissionForm(form({ url: "https://a.com/x", note: "kısa" }), "h")).toMatchObject({ ok: false, field: "note" });
    expect(parseSubmissionForm(form({ website: "spam", url: "x", note: "x" }), "h")).toEqual({ ok: true, duplicate: false });
  });

  it("stores a reader candidate with page title and rate-limits per submitter", async () => {
    const html = `<html><head><title>Fallback</title><meta property="og:title" content="Köpek evine döndü &amp; mutlu son"><meta property="og:image" content="https://img.example.com/k.jpg"></head></html>`;
    const fetchImpl = async () => new Response(html, { status: 200 });
    const input = (n: number): SubmissionInput => ({
      url: `https://haber.example.com/${n}`,
      note: "Kaybolan köpek bulundu ve ailesine kavuştu.",
      name: "Ayşe",
      allowName: n === 0,
      email: null,
      submitterHash: "okur-1",
    });

    expect(await submitStory(db, input(0), fetchImpl)).toEqual({ ok: true, duplicate: false });
    expect(await submitStory(db, input(0), fetchImpl)).toEqual({ ok: true, duplicate: true });
    const [c] = await db.select().from(schema.candidates);
    expect(c).toMatchObject({
      origin: "reader",
      title: "Köpek evine döndü & mutlu son",
      imageUrl: "https://img.example.com/k.jpg",
      submitterName: "Ayşe",
    });
    expect(c.score).toBeGreaterThan(0);

    for (let i = 1; i < DAILY_SUBMISSION_LIMIT; i++) await submitStory(db, input(i), fetchImpl);
    const limited = await submitStory(db, input(99), fetchImpl);
    expect(limited.ok).toBe(false);
    // Ad onayı yoksa kaydedilmez.
    const rows = await db.select().from(schema.candidates).where(eq(schema.candidates.url, "https://haber.example.com/1"));
    expect(rows[0].submitterName).toBeNull();
  });
});

describe("Gemini draft helpers", () => {
  it("parses, clips and sanitises model output", () => {
    const draft = parseDraft(
      JSON.stringify({
        title: "Ç".repeat(150),
        summary: "Kısa özet.",
        category: "savas",
        isUplifting: false,
        concerns: "Kaynak tek.",
        claimsToVerify: ["a", "", 3, "b", "c", "d", "e"],
      }),
    );
    expect(draft.title.length).toBeLessThanOrEqual(90);
    expect(draft.category).toBe("iyilik");
    expect(draft.isUplifting).toBe(false);
    expect(draft.claimsToVerify).toEqual(["a", "b", "c", "d"]);
    expect(() => parseDraft("not json")).toThrow(/okunamadı/);
    expect(() => parseDraft(JSON.stringify({ title: "", summary: "" }))).toThrow(/boş/);
  });

  it("generateDraft sends the article context to the generator", async () => {
    let seenPrompt = "";
    const gen: Generator = {
      json: async (_system, prompt) => {
        seenPrompt = prompt;
        return JSON.stringify({ title: "Başlık", summary: "Özet", category: "doga", isUplifting: true, concerns: "", claimsToVerify: [] });
      },
      grounded: async () => ({ text: "", sources: [] }),
    };
    // URL yok: sayfa çekilmez, yalnızca başlık ve not kullanılır.
    const draft = await generateDraft({ url: null, title: "Trees planted", excerpt: "Volunteers planted trees" }, gen);
    expect(draft).toMatchObject({ title: "Başlık", category: "doga" });
    expect(seenPrompt).toContain("Trees planted");
    expect(seenPrompt).toContain("Haber metnine ulaşılamadı");
  });

  it("findCorroboration dedupes sources and drops the main source", async () => {
    const gen: Generator = {
      json: async () => "",
      grounded: async () => ({
        text: "Haber iki ayrı kaynakta doğrulanıyor.",
        sources: [
          { title: "a.com", url: "https://a.com/x" },
          { title: "a.com", url: "https://a.com/x" },
          { title: "main", url: "https://main.com/n" },
          { title: "b.com", url: "https://b.com/y" },
        ],
      }),
    };
    const res = await findCorroboration({ title: "T", summary: "S", sourceUrl: "https://main.com/n" }, gen);
    expect(res.sources.map((s) => s.url)).toEqual(["https://a.com/x", "https://b.com/y"]);
    expect(res.note).toContain("doğrulanıyor");
  });

  it("maps API errors to friendly messages", async () => {
    const gen: Generator = {
      json: async () => {
        throw Object.assign(new Error("quota"), { status: 429 });
      },
      grounded: async () => ({ text: "", sources: [] }),
    };
    await expect(generateDraft({ url: null, title: "T", excerpt: "" }, gen)).rejects.toThrow(/kotası/);
  });
});
