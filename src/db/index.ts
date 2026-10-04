import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const DEFAULT_DATABASE_URL = "file:./data/pamuk.db";

function createDb() {
  const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  if (url.startsWith("file:")) {
    // Yerel SQLite dosyasının klasörü yoksa oluştur.
    mkdirSync(path.dirname(url.slice("file:".length)), { recursive: true });
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { pamukDb?: Db };

export const db: Db = globalForDb.pamukDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.pamukDb = db;

export { schema };
