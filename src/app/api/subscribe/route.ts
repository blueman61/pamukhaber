import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { normalizeEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  await db.insert(subscribers).values({ email }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
