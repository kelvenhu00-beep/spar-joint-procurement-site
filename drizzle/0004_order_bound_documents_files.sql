ALTER TABLE `file_uploads` ADD `order_id` text;
--> statement-breakpoint
CREATE INDEX `file_uploads_order_id_idx` ON `file_uploads` (`order_id`);
--> statement-breakpoint
ALTER TABLE `business_documents` ADD `order_id` text;
--> statement-breakpoint
CREATE INDEX `business_documents_order_id_idx` ON `business_documents` (`order_id`);
