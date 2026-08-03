ALTER TABLE `procurement_orders` ADD `overseas_supplier_name` text;
--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `overseas_po_no` text;
--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `proforma_invoice_no` text;
--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `overseas_currency` text;
--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `overseas_amount` real;
--> statement-breakpoint
ALTER TABLE `procurement_orders` ADD `overseas_payment_status` text;
