DROP INDEX `students_user_id_unique`;--> statement-breakpoint
CREATE INDEX `students_user_idx` ON `students` (`user_id`);--> statement-breakpoint
ALTER TABLE `sessions` ADD `student_id` text REFERENCES students(id);--> statement-breakpoint
CREATE INDEX `auth_sessions_student_idx` ON `sessions` (`student_id`);