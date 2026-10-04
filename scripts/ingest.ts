/** Aktif RSS kaynaklarını tarar ve yeni adayları editör kuyruğuna ekler. Kullanım: npm run ingest */
import { db } from "../src/db";
import { ingestAll } from "../src/lib/ingest";

ingestAll(db).then(
  (results) => {
    for (const r of results) {
      console.log(`${r.error ? "✗" : "✓"} ${r.source}: ${r.found} bulundu, ${r.added} yeni${r.error ? ` — ${r.error}` : ""}`);
    }
    process.exit(0);
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
