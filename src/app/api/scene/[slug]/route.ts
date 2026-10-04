import { NextResponse } from "next/server";
import { buildScene } from "@/remotion/scene-data";
import { getStoryBySlug } from "@/lib/stories";

export const dynamic = "force-dynamic";

/** Yayındaki bir haberin sahne verisi (MP4 üretimi için). Yalnızca zaten herkese açık içeriği döner. */
export async function GET(_req: Request, ctx: RouteContext<"/api/scene/[slug]">) {
  const { slug } = await ctx.params;
  const story = await getStoryBySlug(slug);
  if (!story || story.isSponsored) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(buildScene(story));
}
