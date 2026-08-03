ALTER TABLE `enterprise_users` ADD `password_hash` text;
--> statement-breakpoint
ALTER TABLE `enterprise_users` ADD `password_salt` text;
--> statement-breakpoint
ALTER TABLE `enterprise_users` ADD `force_password_reset` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `enterprise_users` ADD `password_updated_at` text;
--> statement-breakpoint
ALTER TABLE `enterprise_users` ADD `last_login_at` text;
--> statement-breakpoint
ALTER TABLE `operator_users` ADD `password_hash` text;
--> statement-breakpoint
ALTER TABLE `operator_users` ADD `password_salt` text;
--> statement-breakpoint
ALTER TABLE `operator_users` ADD `force_password_reset` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `operator_users` ADD `password_updated_at` text;
--> statement-breakpoint
ALTER TABLE `operator_users` ADD `last_login_at` text;
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_type` text NOT NULL,
	`user_id` text NOT NULL,
	`session_hash` text NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_session_hash_unique` ON `auth_sessions` (`session_hash`);
--> statement-breakpoint
CREATE INDEX `auth_sessions_user_idx` ON `auth_sessions` (`user_type`,`user_id`);
--> statement-breakpoint
CREATE INDEX `auth_sessions_expires_at_idx` ON `auth_sessions` (`expires_at`);
--> statement-breakpoint
CREATE TABLE `business_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`document_no` text NOT NULL,
	`document_type` text NOT NULL,
	`product_id` text,
	`enterprise_id` text,
	`purchase_intention_id` text,
	`file_upload_id` text,
	`stage` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`visibility` text DEFAULT 'internal' NOT NULL,
	`amount_cny` real,
	`currency` text,
	`created_by_user_type` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`reviewed_by_user_id` text,
	`reviewed_at` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enterprise_id`) REFERENCES `enterprises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_intention_id`) REFERENCES `purchase_intentions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`file_upload_id`) REFERENCES `file_uploads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_documents_document_no_unique` ON `business_documents` (`document_no`);
--> statement-breakpoint
CREATE INDEX `business_documents_product_id_idx` ON `business_documents` (`product_id`);
--> statement-breakpoint
CREATE INDEX `business_documents_enterprise_id_idx` ON `business_documents` (`enterprise_id`);
--> statement-breakpoint
CREATE INDEX `business_documents_status_idx` ON `business_documents` (`status`);
--> statement-breakpoint
CREATE INDEX `business_documents_stage_idx` ON `business_documents` (`stage`);
