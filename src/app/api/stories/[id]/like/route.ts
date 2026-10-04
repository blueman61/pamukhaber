import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stories } from "@/db/schema";

export async function POST(request: Request, ctx: RouteContext<"/api/stories/[id]/like">) {
  const { id } = await ctx.params;
  const storyId = Number(id);
  if (!Number.isInteger(storyId) || storyId <= 0) {
    return NextResponse.json({ error: "Geçersiz hikâye" }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { delta?: number };
  const delta = body.delta === -1 ? -1 : 1;

  const [row] = await db
    .update(stories)
    .set({ likes: sql`max(0, ${stories.likes} + ${delta})` })
    .where(and(eq(stories.id, storyId), eq(stories.status, "published")))
    .returning({ likes: stories.likes });

  if (!row) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(row);
}
