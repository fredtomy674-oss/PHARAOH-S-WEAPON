ALTER TABLE `curricula` ADD `language` text;--> statement-breakpoint
ALTER TABLE `curricula` ADD `variant_of` text;--> statement-breakpoint
ALTER TABLE `curricula` ADD `language_role` text;--> statement-breakpoint
CREATE INDEX `curricula_variant_of_idx` ON `curricula` (`variant_of`);--> statement-breakpoint
ALTER TABLE `students` ADD `study_language` text;--> statement-breakpoint
ALTER TABLE `students` ADD `first_foreign_language` text;--> statement-breakpoint
ALTER TABLE `students` ADD `second_foreign_language` text;--> statement-breakpoint
ALTER TABLE `students` ADD `religion` text;