import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { visitorHash } from "@/lib/fingerprint";
import { isReportReason, recordReport } from "@/lib/reports";

export async function POST(request: Request, ctx: RouteContext<"/api/stories/[id]/report">) {
  const { id } = await ctx.params;
  const storyId = Number(id);
  if (!Number.isInteger(storyId) || storyId <= 0) {
    return NextResponse.json({ error: "Geçersiz hikâye" }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { reason?: unknown; note?: unknown };
  if (!isReportReason(body.reason)) {
    return NextResponse.json({ error: "Lütfen bir neden seçin." }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.trim() : "";

  const result = await recordReport(db, {
    storyId,
    reason: body.reason,
    note: note || null,
    reporterHash: visitorHash(request.headers, "report"),
  });
  if (!result.ok) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (result.hidden) revalidatePath("/");
  // Gizlenme bilgisini okura dönmüyoruz; bildirim sistemini kötüye kullanmayı zorlaştırır.
  return NextResponse.json({ ok: true, duplicate: result.duplicate });
}
