import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

/** RSS kaynakları: aday haberlerin geldiği yerler. */
export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  feedUrl: text("feed_url").notNull().unique(),
  siteUrl: text("site_url"),
  lang: text("lang").notNull().default("en"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastFetchedAt: integer("last_fetched_at", { mode: "timestamp" }),
  lastError: text("last_error"),
  createdAt: createdAt(),
});

/** Otomatik toplanan, editör onayı bekleyen aday haberler. */
export const candidates = sqliteTable(
  "candidates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceId: integer("source_id").references(() => sources.id, { onDelete: "set null" }),
    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    imageUrl: text("image_url"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    score: integer("score").notNull().default(0),
    status: text("status", { enum: ["new", "approved", "rejected"] })
      .notNull()
      .default("new"),
    createdAt: createdAt(),
  },
  (t) => [index("candidates_status_score_idx").on(t.status, t.score)],
);

/** Editörün onayladığı, akışta görünen hikâyeler. */
export const stories = sqliteTable(
  "stories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    category: text("category").notNull(),
    mediaType: text("media_type", { enum: ["none", "image", "video", "youtube"] })
      .notNull()
      .default("none"),
    mediaUrl: text("media_url"),
    mediaCredit: text("media_credit"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "set null" }),
    isSponsored: integer("is_sponsored", { mode: "boolean" }).notNull().default(false),
    sponsorName: text("sponsor_name"),
    sponsorUrl: text("sponsor_url"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["published", "hidden"] })
      .notNull()
      .default("published"),
    likes: integer("likes").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("stories_feed_idx").on(t.status, t.isSponsored, t.category)],
);

/** "Günün Pamuk Haberi" bülten aboneleri. */
export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
});

export type Source = typeof sources.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
