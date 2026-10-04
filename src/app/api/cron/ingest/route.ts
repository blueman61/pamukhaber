import { NextResponse } from "next/server";
import { db } from "@/db";
import { ingestAll } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Zamanlanmış görev (Vercel Cron / GitHub Actions) RSS kaynaklarını buradan tarar. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const results = await ingestAll(db);
  return NextResponse.json({ results });
}
