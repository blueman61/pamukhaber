CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`story_id` integer NOT NULL,
	`reason` text NOT NULL,
	`note` text,
	`reporter_hash` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reports_story_reporter_idx` ON `reports` (`story_id`,`reporter_hash`);--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`,`story_id`);--> statement-breakpoint
ALTER TABLE `candidates` ADD `origin` text DEFAULT 'feed' NOT NULL;--> statement-breakpoint
ALTER TABLE `candidates` ADD `submitter_name` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `submitter_email` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `submitter_note` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `submitter_hash` text;--> statement-breakpoint
CREATE INDEX `candidates_submitter_idx` ON `candidates` (`submitter_hash`,`created_at`);--> statement-breakpoint
ALTER TABLE `stories` ADD `hidden_reason` text;--> statement-breakpoint
ALTER TABLE `stories` ADD `origin` text DEFAULT 'editor' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `submitter_name` text;--> statement-breakpoint
ALTER TABLE `stories` ADD `verification` text DEFAULT 'source' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `verification_note` text;--> statement-breakpoint
ALTER TABLE `stories` ADD `extra_sources` text;--> statement-breakpoint
ALTER TABLE `stories` ADD `ai_assisted` integer DEFAULT false NOT NULL;