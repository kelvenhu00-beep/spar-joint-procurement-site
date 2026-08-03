ALTER TABLE `procurement_orders` ADD `signed_at` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `signer_name` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `signed_boxes` integer;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `rejected_boxes` integer;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `receipt_status` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `damage_claim_status` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `statement_no` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `invoice_no` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `service_fee_cny` real;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `receivable_amount_cny` real;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `received_amount_cny` real;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `settlement_status` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `settled_at` text;
