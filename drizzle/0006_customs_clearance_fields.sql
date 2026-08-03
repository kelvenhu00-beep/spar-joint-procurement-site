ALTER TABLE `procurement_orders` ADD `customs_broker_name` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `customs_release_status` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `customs_released_at` text;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `estimated_duty_cny` real;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `estimated_vat_cny` real;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `actual_tax_paid_cny` real;--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `customs_inspection_status` text;
