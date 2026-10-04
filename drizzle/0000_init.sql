CREATE TABLE `candidates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` integer,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`image_url` text,
	`published_at` integer,
	`score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `candidates_url_unique` ON `candidates` (`url`);--> statement-breakpoint
CREATE INDEX `candidates_status_score_idx` ON `candidates` (`status`,`score`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`feed_url` text NOT NULL,
	`site_url` text,
	`lang` text DEFAULT 'en' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_fetched_at` integer,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sources_feed_url_unique` ON `sources` (`feed_url`);--> statement-breakpoint
CREATE TABLE `stories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`category` text NOT NULL,
	`media_type` text DEFAULT 'none' NOT NULL,
	`media_url` text,
	`media_credit` text,
	`source_name` text,
	`source_url` text,
	`candidate_id` integer,
	`is_sponsored` integer DEFAULT false NOT NULL,
	`sponsor_name` text,
	`sponsor_url` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stories_slug_unique` ON `stories` (`slug`);--> statement-breakpoint
CREATE INDEX `stories_feed_idx` ON `stories` (`status`,`is_sponsored`,`category`);--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_unique` ON `subscribers` (`email`);