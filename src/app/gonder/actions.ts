"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { visitorHash } from "@/lib/fingerprint";
import { parseSubmissionForm, submitStory } from "@/lib/submissions";

export type SubmitState = { ok?: boolean; duplicate?: boolean; error?: string; field?: "url" | "note" | "email" };

export async function submitReaderStory(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  const parsed = parseSubmissionForm(form, visitorHash(await headers(), "submit"));
  if ("ok" in parsed) return parsed;
  const result = await submitStory(db, parsed);
  if (result.ok) revalidatePath("/admin");
  return result;
}
