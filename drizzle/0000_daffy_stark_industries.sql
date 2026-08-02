CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`requested_by_user_id` text NOT NULL,
	`approver_user_id` text,
	`required_role` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`decided_at` text
);
--> statement-breakpoint
CREATE INDEX `approvals_target_idx` ON `approvals` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `approvals_status_idx` ON `approvals` (`status`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_target_idx` ON `audit_logs` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_type`,`actor_id`);--> statement-breakpoint
CREATE TABLE `enterprise_users` (
	`id` text PRIMARY KEY NOT NULL,
	`enterprise_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`enterprise_id`) REFERENCES `enterprises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enterprise_users_email_unique` ON `enterprise_users` (`email`);--> statement-breakpoint
CREATE INDEX `enterprise_users_enterprise_id_idx` ON `enterprise_users` (`enterprise_id`);--> statement-breakpoint
CREATE TABLE `enterprises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text,
	`type` text NOT NULL,
	`region` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `file_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`requirement_id` text NOT NULL,
	`product_id` text NOT NULL,
	`business_no` text NOT NULL,
	`original_file_name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`ai_review_status` text DEFAULT 'pending' NOT NULL,
	`ai_review_summary` text,
	`manual_review_status` text DEFAULT 'pending' NOT NULL,
	`uploaded_by_user_id` text NOT NULL,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`requirement_id`) REFERENCES `workflow_file_requirements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `file_uploads_product_id_idx` ON `file_uploads` (`product_id`);--> statement-breakpoint
CREATE INDEX `file_uploads_business_no_idx` ON `file_uploads` (`business_no`);--> statement-breakpoint
CREATE INDEX `file_uploads_manual_review_status_idx` ON `file_uploads` (`manual_review_status`);--> statement-breakpoint
CREATE TABLE `operator_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `operator_users_email_unique` ON `operator_users` (`email`);--> statement-breakpoint
CREATE INDEX `operator_users_role_idx` ON `operator_users` (`role`);--> statement-breakpoint
CREATE TABLE `procurement_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`container_type` text DEFAULT '20ft' NOT NULL,
	`target_boxes` integer NOT NULL,
	`current_boxes` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'collecting' NOT NULL,
	`expected_arrival_window` text,
	`final_quote_version` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `procurement_groups_product_id_idx` ON `procurement_groups` (`product_id`);--> statement-breakpoint
CREATE INDEX `procurement_groups_status_idx` ON `procurement_groups` (`status`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`cn_name` text NOT NULL,
	`brand` text NOT NULL,
	`en_name` text NOT NULL,
	`country` text NOT NULL,
	`category` text NOT NULL,
	`spec` text NOT NULL,
	`case_spec` text NOT NULL,
	`shelf_life_months` integer NOT NULL,
	`estimated_landed_cost_cny` real NOT NULL,
	`retail_price_band` text NOT NULL,
	`gross_margin_band` text NOT NULL,
	`moq_boxes` integer NOT NULL,
	`last_12_month_boxes` integer DEFAULT 0 NOT NULL,
	`target_boxes_20ft` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`authorization_status` text DEFAULT 'pending' NOT NULL,
	`label_status` text DEFAULT 'pending' NOT NULL,
	`hs_code` text,
	`storage_requirement` text DEFAULT '常温干燥' NOT NULL,
	`image_path` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_country_idx` ON `products` (`country`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE TABLE `purchase_intentions` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`enterprise_id` text NOT NULL,
	`enterprise_user_id` text,
	`quantity_boxes` integer NOT NULL,
	`receiving_region` text NOT NULL,
	`expected_arrival_window` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enterprise_id`) REFERENCES `enterprises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enterprise_user_id`) REFERENCES `enterprise_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_intentions_product_id_idx` ON `purchase_intentions` (`product_id`);--> statement-breakpoint
CREATE INDEX `purchase_intentions_enterprise_id_idx` ON `purchase_intentions` (`enterprise_id`);--> statement-breakpoint
CREATE INDEX `purchase_intentions_status_idx` ON `purchase_intentions` (`status`);--> statement-breakpoint
CREATE TABLE `workflow_file_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`stage` text NOT NULL,
	`required_file_type` text NOT NULL,
	`owner_role` text NOT NULL,
	`required_before_status` text NOT NULL,
	`buyer_visibility` text DEFAULT 'hidden' NOT NULL,
	`sequence` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `workflow_file_requirements_product_id_idx` ON `workflow_file_requirements` (`product_id`);