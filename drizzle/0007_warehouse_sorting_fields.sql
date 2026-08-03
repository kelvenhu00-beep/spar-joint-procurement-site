ALTER TABLE `procurement_orders` ADD `warehouse_name` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `warehouse_inbound_no` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `warehouse_inbound_at` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `received_boxes` integer;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `damaged_boxes` integer;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `shortage_boxes` integer;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `sorting_batch_no` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `allocation_status` text;
