import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { stories, type Story } from "@/db/schema";
import type { CategorySlug } from "./categories";
import type { MediaType } from "./media";

export const PAGE_SIZE = 8;

/** İstemciye giden, JSON'a çevrilebilir hikâye biçimi. */
export type FeedStory = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  mediaType: MediaType;
  mediaUrl: string | null;
  mediaCredit: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  isSponsored: boolean;
  sponsorName: string | null;
  sponsorUrl: string | null;
  isDemo: boolean;
  likes: number;
  origin: "editor" | "reader" | "partner";
  submitterName: string | null;
  verification: "verified" | "source" | "unverified";
  verificationNote: string | null;
  extraSources: string[];
  aiAssisted: boolean;
  createdAt: string;
};

export function toFeedStory(s: Story): FeedStory {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    category: s.category,
    mediaType: s.mediaType,
    mediaUrl: s.mediaUrl,
    mediaCredit: s.mediaCredit,
    sourceName: s.sourceName,
    sourceUrl: s.sourceUrl,
    isSponsored: s.isSponsored,
    sponsorName: s.sponsorName,
    sponsorUrl: s.sponsorUrl,
    isDemo: s.isDemo,
    likes: s.likes,
    origin: s.origin,
    submitterName: s.submitterName,
    verification: s.verification,
    verificationNote: s.verificationNote,
    extraSources: s.extraSources ? s.extraSources.split("\n").filter(Boolean) : [],
    aiAssisted: s.aiAssisted,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function getFeedPage(opts: { cursor?: number | null; category?: CategorySlug | null }) {
  const conditions = [eq(stories.status, "published"), eq(stories.isSponsored, false)];
  if (opts.category) conditions.push(eq(stories.category, opts.category));
  if (opts.cursor) conditions.push(lt(stories.id, opts.cursor));

  const rows = await db
    .select()
    .from(stories)
    .where(and(...conditions))
    .orderBy(desc(stories.id))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE).map(toFeedStory);
  return { stories: page, nextCursor: hasMore ? page[page.length - 1].id : null };
}

export async function getSponsoredStories(): Promise<FeedStory[]> {
  const rows = await db
    .select()
    .from(stories)
    .where(and(eq(stories.status, "published"), eq(stories.isSponsored, true)))
    .orderBy(desc(stories.id))
    .limit(10);
  return rows.map(toFeedStory);
}

export async function getStoryBySlug(slug: string): Promise<FeedStory | null> {
  const [row] = await db
    .select()
    .from(stories)
    .where(and(eq(stories.slug, slug), eq(stories.status, "published")))
    .limit(1);
  return row ? toFeedStory(row) : null;
}
