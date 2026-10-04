import { NextResponse, type NextRequest } from "next/server";
import { isCategory } from "@/lib/categories";
import { getFeedPage } from "@/lib/stories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cursor = Number(params.get("cursor")) || null;
  const kategori = params.get("kategori");
  const page = await getFeedPage({ cursor, category: isCategory(kategori) ? kategori : null });
  return NextResponse.json(page);
}
