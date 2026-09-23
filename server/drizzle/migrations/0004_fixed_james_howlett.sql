ALTER TABLE `students` ADD `parent_link_code` text;--> statement-breakpoint
CREATE UNIQUE INDEX `students_parent_link_code_unique` ON `students` (`parent_link_code`);