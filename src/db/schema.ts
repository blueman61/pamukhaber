import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { MEDIA_TYPES } from "../lib/media";

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
    /** feed: RSS'ten otomatik, reader: okur gönderimi */
    origin: text("origin", { enum: ["feed", "reader"] })
      .notNull()
      .default("feed"),
    /** Okur adı — yalnızca "adımla anılabilir" onayı verildiyse dolu. */
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    submitterNote: text("submitter_note"),
    submitterHash: text("submitter_hash"),
    createdAt: createdAt(),
  },
  (t) => [
    index("candidates_status_score_idx").on(t.status, t.score),
    index("candidates_submitter_idx").on(t.submitterHash, t.createdAt),
  ],
);

/** Editörün onayladığı, akışta görünen hikâyeler. */
export const stories = sqliteTable(
  "stories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    /** Ana kategori: illüstrasyon ve renk buradan gelir. */
    category: text("category").notNull(),
    /** Tüm kategoriler (ana dahil), biçim: "|sevgi|hayvanlar|" */
    categories: text("categories"),
    mediaType: text("media_type", { enum: MEDIA_TYPES })
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
    /** Bildirim eşiği aşıldığı için otomatik gizlendiyse "reports". */
    hiddenReason: text("hidden_reason", { enum: ["reports"] }),
    likes: integer("likes").notNull().default(0),
    /** Haberi kim getirdi: editör seçkisi, okur gönderimi ya da kurum bülteni. */
    origin: text("origin", { enum: ["editor", "reader", "partner"] })
      .notNull()
      .default("editor"),
    submitterName: text("submitter_name"),
    /** verified: birden çok bağımsız kaynakla teyit, source: tek güvenilir kaynak, unverified: teyit edilmedi */
    verification: text("verification", { enum: ["verified", "source", "unverified"] })
      .notNull()
      .default("source"),
    verificationNote: text("verification_note"),
    /** Ek kaynak bağlantıları, satır başına bir URL. */
    extraSources: text("extra_sources"),
    aiAssisted: integer("ai_assisted", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("stories_feed_idx").on(t.status, t.isSponsored, t.category)],
);

/** Okurların "yanlış bilgi / sahte içerik" bildirimleri. */
export const reports = sqliteTable(
  "reports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    storyId: integer("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    reason: text("reason", { enum: ["yanlis", "sahte", "telif", "uygunsuz", "diger"] }).notNull(),
    note: text("note"),
    reporterHash: text("reporter_hash").notNull(),
    status: text("status", { enum: ["open", "upheld", "dismissed"] })
      .notNull()
      .default("open"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("reports_story_reporter_idx").on(t.storyId, t.reporterHash),
    index("reports_status_idx").on(t.status, t.storyId),
  ],
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
export type Report = typeof reports.$inferSelect;
