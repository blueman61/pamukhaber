export const DEFAULT_DATABASE_URL = "file:./data/pamuk.db";

/**
 * Veritabanı bağlantı ayarı. Turso panelinden kopyalanan adlarla
 * (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN) girilse de çalışır.
 */
export function databaseConfig() {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "";
  const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined;
  return { url: url || DEFAULT_DATABASE_URL, authToken, configured: Boolean(url) };
}
