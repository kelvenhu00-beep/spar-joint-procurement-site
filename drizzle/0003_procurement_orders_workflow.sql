CREATE TABLE `procurement_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_no` text NOT NULL,
	`product_id` text NOT NULL,
	`enterprise_id` text NOT NULL,
	`purchase_intention_id` text,
	`quantity_boxes` integer NOT NULL,
	`container_type` text DEFAULT '20ft' NOT NULL,
	`current_stage` text DEFAULT 'second_confirmation' NOT NULL,
	`status` text DEFAULT 'second_confirmation' NOT NULL,
	`confirmed_unit_cost_cny` real,
	`total_amount_cny` real,
	`receiving_region` text NOT NULL,
	`expected_arrival_window` text NOT NULL,
	`etd` text,
	`eta` text,
	`container_no` text,
	`seal_no` text,
	`customs_declaration_no` text,
	`created_by_user_id` text NOT NULL,
	`updated_by_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enterprise_id`) REFERENCES `enterprises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_intention_id`) REFERENCES `purchase_intentions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `procurement_orders_order_no_unique` ON `procurement_orders` (`order_no`);
--> statement-breakpoint
CREATE INDEX `procurement_orders_product_id_idx` ON `procurement_orders` (`product_id`);
--> statement-breakpoint
CREATE INDEX `procurement_orders_enterprise_id_idx` ON `procurement_orders` (`enterprise_id`);
--> statement-breakpoint
CREATE INDEX `procurement_orders_status_idx` ON `procurement_orders` (`status`);
--> statement-breakpoint
CREATE INDEX `procurement_orders_stage_idx` ON `procurement_orders` (`current_stage`);
--> statement-breakpoint
CREATE TABLE `procurement_order_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`from_stage` text,
	`to_stage` text NOT NULL,
	`action` text NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `procurement_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `procurement_order_events_order_id_idx` ON `procurement_order_events` (`order_id`);
--> statement-breakpoint
CREATE INDEX `procurement_order_events_to_stage_idx` ON `procurement_order_events` (`to_stage`);
