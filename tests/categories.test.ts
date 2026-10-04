import { createClient } from "@libsql/client";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { CATEGORIES, decodeCategories, encodeCategories, getCategory } from "@/lib/categories";
import { categoryFilter } from "@/lib/stories";
import { validateStoryForm } from "@/lib/validation";

const form = (entries: [string, string][]) => {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
};
const base: [string, string][] = [
  ["title", "Başlık"],
  ["summary", "Özet"],
  ["sourceUrl", "https://example.com/a"],
];

describe("Sevgi kategorisi", () => {
  it("exists with its own colour", () => {
    expect(getCategory("sevgi")).toMatchObject({ label: "Sevgi", color: "#e8456b" });
    expect(new Set(CATEGORIES.map((c) => c.color)).size).toBe(CATEGORIES.length);
  });
});

describe("encode/decodeCategories", () => {
  it("round-trips and keeps the primary first", () => {
    expect(encodeCategories(["sevgi", "hayvanlar"])).toBe("|sevgi|hayvanlar|");
    expect(decodeCategories("|hayvanlar|sevgi|", "sevgi")).toEqual(["sevgi", "hayvanlar"]);
    expect(decodeCategories(null, "doga")).toEqual(["doga"]);
    expect(decodeCategories("|bogus|bilim|")).toEqual(["bilim"]);
  });
});

describe("validateStoryForm (çoklu kategori)", () => {
  it("accepts up to three categories in selection order", () => {
    const r = validateStoryForm(form([...base, ["categories", "sevgi"], ["categories", "hayvanlar"], ["categories", "iyilik"]]));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.category).toBe("sevgi");
      expect(r.data.categories).toBe("|sevgi|hayvanlar|iyilik|");
    }
  });

  it("rejects none, too many, and unknown categories", () => {
    const none = validateStoryForm(form(base));
    expect(!none.ok && none.errors.category).toMatch(/En az bir/);
    const many = validateStoryForm(
      form([...base, ...["sevgi", "hayvanlar", "iyilik", "doga"].map((c) => ["categories", c] as [string, string])]),
    );
    expect(!many.ok && many.errors.category).toMatch(/En fazla 3/);
    const bad = validateStoryForm(form([...base, ["categories", "savas"]]));
    expect(!bad.ok && bad.errors.category).toMatch(/Geçerli/);
  });

  it("still accepts the legacy single category field and dedupes", () => {
    const r = validateStoryForm(form([...base, ["categories", "doga"], ["categories", "doga"], ["category", "doga"]]));
    expect(r.ok && r.data.categories).toBe("|doga|");
  });
});

describe("migration + categoryFilter", () => {
  it("backfills old rows and matches secondary categories", async () => {
    const client = createClient({ url: ":memory:" });
    const db = drizzle(client, { schema }) as unknown as Db;
    // Önce yalnızca ilk iki migration: eski şema ile kayıt ekle.
    await migrate(db, { migrationsFolder: "drizzle" });
    await client.execute("UPDATE stories SET categories = NULL"); // tablo boş; aşağıda eski tarz kayıt
    await client.execute(
      "INSERT INTO stories (slug, title, summary, category, categories) VALUES ('eski', 'Eski', 'Ö', 'bilim', NULL)",
    );
    await client.execute("UPDATE `stories` SET `categories` = '|' || `category` || '|' WHERE `categories` IS NULL");
    await db.insert(schema.stories).values({
      slug: "cok",
      title: "Çok kategorili",
      summary: "Ö",
      category: "hayvanlar",
      categories: encodeCategories(["hayvanlar", "sevgi"]),
    });

    const titles = async (slug: Parameters<typeof categoryFilter>[0]) =>
      (await db.select().from(schema.stories).where(and(eq(schema.stories.status, "published"), categoryFilter(slug)))).map(
        (r) => r.slug,
      );
    expect(await titles("sevgi")).toEqual(["cok"]);
    expect(await titles("hayvanlar")).toEqual(["cok"]);
    expect(await titles("bilim")).toEqual(["eski"]);
    const [eski] = await db.select().from(schema.stories).where(eq(schema.stories.slug, "eski"));
    expect(eski.categories).toBe("|bilim|");
  });

  it("the shipped migration contains the backfill statement", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const file = readdirSync("drizzle").find((f) => f.startsWith("0002_"))!;
    expect(readFileSync(`drizzle/${file}`, "utf8")).toMatch(/UPDATE `stories` SET `categories` = '\|' \|\| `category` \|\| '\|'/);
  });
});
