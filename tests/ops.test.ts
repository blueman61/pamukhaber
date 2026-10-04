import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { removeSource } from "@/lib/sources-admin";

const root = process.cwd();
const tmp = () => mkdtempSync(path.join(tmpdir(), "pamuk-"));

describe("removeSource", () => {
  it("drops pending candidates, orphans decided ones and keeps stories", async () => {
    const db = drizzle(createClient({ url: ":memory:" }), { schema }) as unknown as Db;
    await migrate(db, { migrationsFolder: "drizzle" });
    const [src] = await db.insert(schema.sources).values({ name: "A", feedUrl: "https://a.example/feed" }).returning();
    const [other] = await db.insert(schema.sources).values({ name: "B", feedUrl: "https://b.example/feed" }).returning();
    await db.insert(schema.candidates).values([
      { sourceId: src.id, url: "https://a.example/1", title: "bekleyen" },
      { sourceId: src.id, url: "https://a.example/2", title: "onaylı", status: "approved" },
      { sourceId: src.id, url: "https://a.example/3", title: "reddedilmiş", status: "rejected" },
      { sourceId: other.id, url: "https://b.example/1", title: "başka kaynak" },
    ]);
    await db.insert(schema.stories).values({ slug: "s", title: "Hikâye", summary: "Ö", category: "iyilik", sourceName: "A" });

    expect(await removeSource(src.id, db)).toBe(1);

    const cands = await db.select().from(schema.candidates);
    expect(cands.map((c) => c.title).sort()).toEqual(["başka kaynak", "onaylı", "reddedilmiş"]);
    expect(cands.find((c) => c.title === "onaylı")!.sourceId).toBeNull();
    expect(cands.find((c) => c.title === "başka kaynak")!.sourceId).toBe(other.id);
    expect(await db.select().from(schema.sources)).toHaveLength(1);
    expect(await db.select().from(schema.stories)).toHaveLength(1);
  });
});

describe("seed", () => {
  it("does not bring back a source the editor deleted", () => {
    const dir = tmp();
    const env = { ...process.env, DATABASE_URL: `file:${path.join(dir, "t.db")}` };
    const run = (cmd: string, args: string[]) => execFileSync("npx", ["tsx", cmd, ...args], { cwd: root, env, encoding: "utf8" });
    run("scripts/migrate.ts", []);
    expect(run("src/db/seed.ts", ["--no-demo"])).toMatch(/7 yeni kaynak/);

    const db = createClient({ url: env.DATABASE_URL });
    return db.execute("DELETE FROM sources WHERE name = 'Good News Network'").then(async () => {
      expect(run("src/db/seed.ts", ["--no-demo"])).toMatch(/zaten yapılmış/);
      const rows = await db.execute("SELECT count(*) AS n FROM sources");
      expect(Number(rows.rows[0].n)).toBe(6);
    });
  }, 60_000);

  it("migration marks existing installs as already seeded", async () => {
    const client = createClient({ url: ":memory:" });
    const db = drizzle(client, { schema }) as unknown as Db;
    await migrate(db, { migrationsFolder: "drizzle" });
    // Boş kurulumda işaret yok; kaynak varsa migration işareti koymuş olmalı → 0003'ün SQL'ini kaynaklı bir DB'de tekrar uygula.
    await db.insert(schema.sources).values({ name: "X", feedUrl: "https://x.example/f" });
    await client.execute("DELETE FROM settings");
    const sql = readFileSync("drizzle/0003_settings.sql", "utf8").split("--> statement-breakpoint").pop()!;
    await client.execute(sql);
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "sources_seeded"));
    expect(row?.value).toBe("1");
  });
});

describe("netlify.toml ignore", () => {
  const cmd = /ignore = "(.+)"/.exec(readFileSync("netlify.toml", "utf8"))![1];

  function repo() {
    const dir = tmp();
    const git = (...a: string[]) => execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...a], { cwd: dir });
    git("init", "-q");
    for (const f of ["src/a.ts", "docs/a.md", "tests/a.test.ts"]) {
      mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
      writeFileSync(path.join(dir, f), "1");
    }
    git("add", "-A");
    git("commit", "-qm", "base");
    const base = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    return { dir, git, base };
  }
  const exitCode = (dir: string, base: string) =>
    spawnSync("sh", ["-c", cmd], { cwd: dir, env: { ...process.env, CACHED_COMMIT_REF: base, COMMIT_REF: "HEAD" } }).status;

  it("skips the build when only docs/tests change", () => {
    const { dir, git, base } = repo();
    writeFileSync(path.join(dir, "docs/a.md"), "2");
    writeFileSync(path.join(dir, "tests/a.test.ts"), "2");
    git("commit", "-qam", "docs");
    expect(exitCode(dir, base)).toBe(0);
  });

  it("builds when app code changes", () => {
    const { dir, git, base } = repo();
    writeFileSync(path.join(dir, "src/a.ts"), "2");
    git("commit", "-qam", "code");
    expect(exitCode(dir, base)).toBe(1);
  });

  it("builds when there is no previous deploy to compare with", () => {
    const { dir } = repo();
    const status = spawnSync("sh", ["-c", cmd], { cwd: dir, env: { ...process.env, CACHED_COMMIT_REF: "", COMMIT_REF: "HEAD" } }).status;
    expect(status).not.toBe(0);
  });
});
