CREATE TABLE `message_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`session_id` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_name` text,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`data` blob NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `learning_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attachments_session_idx` ON `message_attachments` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attachments_message_unique` ON `message_attachments` (`message_id`);