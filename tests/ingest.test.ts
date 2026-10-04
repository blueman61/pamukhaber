import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { findOgImage, ingestAll, itemsToCandidates, normalizeUrl } from "@/lib/ingest";

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Volunteers rescue stranded baby turtles</title>
      <link>https://news.example.com/turtles?utm_source=rss&amp;id=7</link>
      <description><![CDATA[<p>Hundreds of hatchlings were <b>saved</b> and returned to the sea.</p>]]></description>
      <pubDate>Fri, 03 Oct 2026 08:00:00 GMT</pubDate>
      <media:content url="https://img.example.com/turtle.jpg" medium="image" />
    </item>
    <item>
      <title>Volunteers rescue stranded baby turtles (duplicate)</title>
      <link>https://news.example.com/turtles?id=7&amp;utm_medium=feed</link>
      <description>Same story again.</description>
    </item>
    <item>
      <title>Storm causes crash on the highway, three injured</title>
      <link>https://news.example.com/storm</link>
      <description>A bad day.</description>
    </item>
    <item>
      <title>Town opens free community fridge</title>
      <link>https://news.example.com/fridge</link>
      <description>Neighbours share food.</description>
    </item>
  </channel>
</rss>`;

const ARTICLE = `<html><head><meta content="https://img.example.com/fridge.jpg" property="og:image"></head></html>`;

function makeFetch(calls: string[]) {
  return async (url: string) => {
    calls.push(url);
    if (url === "https://feed.example.com/rss") return new Response(FEED, { status: 200 });
    if (url === "https://broken.example.com/rss") return new Response("nope", { status: 500 });
    if (url.startsWith("https://news.example.com/")) return new Response(ARTICLE, { status: 200 });
    return new Response("", { status: 404 });
  };
}

let db: Db;

beforeEach(async () => {
  db = drizzle(createClient({ url: ":memory:" }), { schema }) as unknown as Db;
  await migrate(db, { migrationsFolder: "drizzle" });
  await db.insert(schema.sources).values([
    { name: "Test", feedUrl: "https://feed.example.com/rss" },
    { name: "Broken", feedUrl: "https://broken.example.com/rss" },
    { name: "Off", feedUrl: "https://off.example.com/rss", active: false },
  ]);
});

describe("helpers", () => {
  it("normalizeUrl strips tracking params and rejects non-http", () => {
    expect(normalizeUrl("https://a.com/x?utm_source=1&id=2#top")).toBe("https://a.com/x?id=2");
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });

  it("findOgImage handles attribute order", () => {
    expect(findOgImage(ARTICLE)).toBe("https://img.example.com/fridge.jpg");
    expect(findOgImage("<html></html>")).toBeNull();
  });

  it("itemsToCandidates dedupes by normalized URL", () => {
    const items = itemsToCandidates(
      [
        { title: "A", link: "https://a.com/1?utm_source=x" },
        { title: "A again", link: "https://a.com/1" },
        { title: "", link: "https://a.com/2" },
      ],
      1,
    );
    expect(items.map((i) => i.url)).toEqual(["https://a.com/1"]);
  });
});

describe("ingestAll", () => {
  it("adds scored candidates, records errors and is idempotent", async () => {
    const calls: string[] = [];
    const results = await ingestAll(db, makeFetch(calls));

    expect(results.find((r) => r.source === "Test")).toMatchObject({ found: 3, added: 3 });
    expect(results.find((r) => r.source === "Broken")?.error).toBe("HTTP 500");
    expect(calls).not.toContain("https://off.example.com/rss");

    const rows = await db.select().from(schema.candidates);
    const turtle = rows.find((r) => r.url === "https://news.example.com/turtles?id=7")!;
    expect(turtle.imageUrl).toBe("https://img.example.com/turtle.jpg");
    expect(turtle.excerpt).toContain("Hundreds of hatchlings were saved");
    expect(turtle.score).toBeGreaterThan(0);

    const storm = rows.find((r) => r.url.endsWith("/storm"))!;
    expect(storm.score).toBeLessThan(0);

    // Görseli olmayan öğe için og:image makaleden çekildi.
    const fridge = rows.find((r) => r.url.endsWith("/fridge"))!;
    expect(fridge.imageUrl).toBe("https://img.example.com/fridge.jpg");

    const broken = (await db.select().from(schema.sources)).find((s) => s.name === "Broken")!;
    expect(broken.lastError).toBe("HTTP 500");

    // İkinci çalıştırma yeni aday eklemez ve makaleleri tekrar çekmez.
    const secondCalls: string[] = [];
    const again = await ingestAll(db, makeFetch(secondCalls));
    expect(again.find((r) => r.source === "Test")?.added).toBe(0);
    expect(secondCalls.filter((u) => u.startsWith("https://news.example.com/"))).toHaveLength(0);
  });
});
