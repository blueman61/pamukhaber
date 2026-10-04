"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { candidates, sources, stories } from "@/db/schema";
import { checkPassword, requireAdmin } from "@/lib/auth";
import { ingestAll } from "@/lib/ingest";
import { createSessionToken, isAuthConfigured, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { uniqueSlug } from "@/lib/slug";
import { isHttpUrl, validateStoryForm, type FieldErrors } from "@/lib/validation";

const idOf = (form: FormData, key = "id") => {
  const n = Number(form.get(key));
  return Number.isInteger(n) && n > 0 ? n : null;
};

const back = (tab: string, message?: string): never => {
  const params = new URLSearchParams({ tab });
  if (message) params.set("mesaj", message);
  redirect(`/admin?${params}`);
};

// ---------- Oturum ----------

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  if (!isAuthConfigured()) return { error: "ADMIN_PASSWORD ve AUTH_SECRET ortam değişkenlerini tanımlayın." };
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // kaba kuvvet denemelerini yavaşlat
    return { error: "Şifre hatalı." };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/giris");
}

// ---------- Aday kuyruğu ----------

export async function runIngest() {
  await requireAdmin();
  const results = await ingestAll(db);
  const added = results.reduce((sum, r) => sum + r.added, 0);
  const failed = results.filter((r) => r.error).length;
  revalidatePath("/admin");
  back("kuyruk", `${added} yeni aday eklendi${failed ? `, ${failed} kaynakta hata var (Kaynaklar sekmesine bakın)` : ""}.`);
}

export async function rejectCandidate(form: FormData) {
  await requireAdmin();
  const id = idOf(form);
  if (id) await db.update(candidates).set({ status: "rejected" }).where(eq(candidates.id, id));
  revalidatePath("/admin");
}

// ---------- Hikâyeler ----------

export type StoryFormState = { errors?: FieldErrors; message?: string };

export async function saveStory(_prev: StoryFormState, form: FormData): Promise<StoryFormState> {
  await requireAdmin();
  const result = validateStoryForm(form);
  if (!result.ok) return { errors: result.errors, message: "Lütfen işaretli alanları düzeltin." };

  const storyId = idOf(form, "storyId");
  const candidateId = idOf(form, "candidateId");

  if (storyId) {
    await db.update(stories).set(result.data).where(eq(stories.id, storyId));
  } else {
    await db.insert(stories).values({ ...result.data, slug: uniqueSlug(result.data.title), candidateId });
    if (candidateId) await db.update(candidates).set({ status: "approved" }).where(eq(candidates.id, candidateId));
  }
  revalidatePath("/");
  revalidatePath("/admin");
  back("yayinda", storyId ? "Hikâye güncellendi." : "Hikâye yayında! 🎉");
  return {};
}

export async function setStoryStatus(form: FormData) {
  await requireAdmin();
  const id = idOf(form);
  const status = form.get("status") === "hidden" ? "hidden" : "published";
  if (id) await db.update(stories).set({ status }).where(eq(stories.id, id));
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteStory(form: FormData) {
  await requireAdmin();
  const id = idOf(form);
  if (id) await db.delete(stories).where(eq(stories.id, id));
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteDemoStories() {
  await requireAdmin();
  await db.delete(stories).where(eq(stories.isDemo, true));
  revalidatePath("/");
  back("yayinda", "Örnek içerikler silindi.");
}

// ---------- Kaynaklar ----------

export async function addSource(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const feedUrl = String(form.get("feedUrl") ?? "").trim();
  const lang = form.get("lang") === "tr" ? "tr" : "en";
  if (!name || !isHttpUrl(feedUrl)) back("kaynaklar", "Kaynak adı ve geçerli bir RSS adresi gerekli.");
  await db.insert(sources).values({ name, feedUrl, lang }).onConflictDoNothing();
  revalidatePath("/admin");
  back("kaynaklar", `${name} eklendi.`);
}

export async function toggleSource(form: FormData) {
  await requireAdmin();
  const id = idOf(form);
  if (id) await db.update(sources).set({ active: form.get("active") === "1" }).where(eq(sources.id, id));
  revalidatePath("/admin");
}
