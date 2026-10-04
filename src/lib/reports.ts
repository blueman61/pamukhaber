import { and, count, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { reports, stories } from "@/db/schema";
import type { ReportReason } from "./report-reasons";

export { isReportReason, REPORT_REASONS, reportReasonLabel, type ReportReason } from "./report-reasons";

/** Aynı hikâyeye bu kadar farklı kişiden açık bildirim gelirse hikâye otomatik gizlenir. */
export function reportHideThreshold(): number {
  const n = Number(process.env.REPORT_HIDE_THRESHOLD);
  return Number.isInteger(n) && n > 0 ? n : 3;
}

export type ReportResult =
  | { ok: true; duplicate: boolean; openReports: number; hidden: boolean }
  | { ok: false; error: "not_found" };

export async function recordReport(
  db: Db,
  input: { storyId: number; reason: ReportReason; note: string | null; reporterHash: string },
  threshold = reportHideThreshold(),
): Promise<ReportResult> {
  const [story] = await db
    .select({ id: stories.id, status: stories.status })
    .from(stories)
    .where(eq(stories.id, input.storyId))
    .limit(1);
  if (!story) return { ok: false, error: "not_found" };

  const inserted = await db
    .insert(reports)
    .values({ ...input, note: input.note?.slice(0, 500) || null })
    .onConflictDoNothing()
    .returning({ id: reports.id });

  const [{ value: openReports }] = await db
    .select({ value: count() })
    .from(reports)
    .where(and(eq(reports.storyId, input.storyId), eq(reports.status, "open")));

  let hidden = story.status === "hidden";
  if (!hidden && openReports >= threshold) {
    await db
      .update(stories)
      .set({ status: "hidden", hiddenReason: "reports" })
      .where(eq(stories.id, input.storyId));
    hidden = true;
  }
  return { ok: true, duplicate: inserted.length === 0, openReports, hidden };
}

/** Editör bildirimleri asılsız buldu: bildirimler kapanır, otomatik gizlenen hikâye geri yayına alınır. */
export async function dismissReports(db: Db, storyId: number): Promise<void> {
  await db
    .update(reports)
    .set({ status: "dismissed" })
    .where(and(eq(reports.storyId, storyId), eq(reports.status, "open")));
  await db
    .update(stories)
    .set({ status: "published", hiddenReason: null })
    .where(and(eq(stories.id, storyId), eq(stories.hiddenReason, "reports")));
}

/** Editör bildirimleri haklı buldu: hikâye gizli kalır. */
export async function upholdReports(db: Db, storyId: number): Promise<void> {
  await db
    .update(reports)
    .set({ status: "upheld" })
    .where(and(eq(reports.storyId, storyId), eq(reports.status, "open")));
  await db.update(stories).set({ status: "hidden" }).where(eq(stories.id, storyId));
}
