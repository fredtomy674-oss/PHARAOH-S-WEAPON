DROP INDEX `chunks_content_hash_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `chunks_content_hash_lesson_unique` ON `chunks` (`content_hash`,`lesson_id`);--> statement-breakpoint
ALTER TABLE `document_versions` ADD `data` blob;