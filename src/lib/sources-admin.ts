import { and, count, eq } from "drizzle-orm";
import { db as defaultDb, type Db } from "@/db";
import { candidates, sources } from "@/db/schema";

/**
 * Kaynağı ve bekleyen adaylarını siler. Onaylanmış/reddedilmiş adayların kaynağı boşaltılır
 * (yabancı anahtar zincirine güvenmeyiz). Silinen bekleyen aday sayısını döner.
 */
export async function removeSource(id: number, db: Db = defaultDb): Promise<number> {
  const [{ value: pending }] = await db
    .select({ value: count() })
    .from(candidates)
    .where(and(eq(candidates.sourceId, id), eq(candidates.status, "new")));
  await db.delete(candidates).where(and(eq(candidates.sourceId, id), eq(candidates.status, "new")));
  await db.update(candidates).set({ sourceId: null }).where(eq(candidates.sourceId, id));
  await db.delete(sources).where(eq(sources.id, id));
  return pending;
}
