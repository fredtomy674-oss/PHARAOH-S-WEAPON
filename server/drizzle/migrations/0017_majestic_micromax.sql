CREATE TABLE `student_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`title` text NOT NULL,
	`kind` text DEFAULT 'homework' NOT NULL,
	`subject_id` text,
	`due_date` text NOT NULL,
	`notes` text,
	`done` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `student_tasks_student_due_idx` ON `student_tasks` (`student_id`,`due_date`);--> statement-breakpoint
CREATE INDEX `student_tasks_student_done_idx` ON `student_tasks` (`student_id`,`done`);