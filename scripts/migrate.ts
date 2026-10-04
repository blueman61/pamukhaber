/** drizzle/ klasöründeki SQL migration'larını veritabanına uygular. Kullanım: npm run db:migrate */
import { migrate } from "drizzle-orm/libsql/migrator";
import { databaseConfig } from "../src/db/config";

async function main() {
  // Netlify'da dosya sistemi kalıcı değil: veritabanı adresi yoksa sessizce yerel dosya
  // oluşturmak yerine derlemeyi anlaşılır bir hatayla durdur.
  if (process.env.NETLIFY && !databaseConfig().configured) {
    throw new Error(
      "DATABASE_URL tanımlı değil. Netlify → Site configuration → Environment variables bölümüne " +
        "Turso veritabanı adresini (libsql://…) ve DATABASE_AUTH_TOKEN'ı ekleyip yeniden yayınlayın. " +
        "Ayrıntı: docs/YAYINLAMA.md",
    );
  }
  const { db } = await import("../src/db");
  await migrate(db, { migrationsFolder: "drizzle" });
}

main().then(
  () => {
    console.log("Veritabanı güncel.");
    process.exit(0);
  },
  (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
