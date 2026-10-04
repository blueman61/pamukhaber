ALTER TABLE `stories` ADD `categories` text;--> statement-breakpoint
UPDATE `stories` SET `categories` = '|' || `category` || '|' WHERE `categories` IS NULL;