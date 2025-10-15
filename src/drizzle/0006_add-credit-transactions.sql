CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY DEFAULT ('ctxn_' || lower(hex(randomblob(12)))) NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`remaining_amount` integer DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`description` text(255) NOT NULL,
	`expiration_date` integer,
	`expiration_date_processed_at` integer,
	`payment_intent_id` text(255),
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credit_transactions_user_id_idx` ON `credit_transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `credit_transactions_type_idx` ON `credit_transactions` (`type`);--> statement-breakpoint
CREATE INDEX `credit_transactions_created_at_idx` ON `credit_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `credit_transactions_expiration_idx` ON `credit_transactions` (`expiration_date`);--> statement-breakpoint
CREATE INDEX `credit_transactions_payment_intent_idx` ON `credit_transactions` (`payment_intent_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `current_credits` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `last_credit_refresh_at` integer;
