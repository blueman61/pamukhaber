/** drizzle/ klasöründeki SQL migration'larını veritabanına uygular. Kullanım: npm run db:migrate */
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "../src/db";

migrate(db, { migrationsFolder: "drizzle" }).then(
  () => {
    console.log("Veritabanı güncel.");
    process.exit(0);
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
