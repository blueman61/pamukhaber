CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `settings` (`key`, `value`) SELECT 'sources_seeded', '1' WHERE EXISTS (SELECT 1 FROM `sources`);
