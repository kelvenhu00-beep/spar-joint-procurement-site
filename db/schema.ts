import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const enterprises = sqliteTable("enterprises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  type: text("type").notNull(),
  region: text("region").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const enterpriseUsers = sqliteTable("enterprise_users", {
  id: text("id").primaryKey(),
  enterpriseId: text("enterprise_id").notNull().references(() => enterprises.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  forcePasswordReset: integer("force_password_reset", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("active"),
  passwordUpdatedAt: text("password_updated_at"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("enterprise_users_email_unique").on(table.email),
  index("enterprise_users_enterprise_id_idx").on(table.enterpriseId),
]);

export const operatorUsers = sqliteTable("operator_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  forcePasswordReset: integer("force_password_reset", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("active"),
  passwordUpdatedAt: text("password_updated_at"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("operator_users_email_unique").on(table.email),
  index("operator_users_role_idx").on(table.role),
]);

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  cnName: text("cn_name").notNull(),
  brand: text("brand").notNull(),
  enName: text("en_name").notNull(),
  country: text("country").notNull(),
  category: text("category").notNull(),
  spec: text("spec").notNull(),
  caseSpec: text("case_spec").notNull(),
  shelfLifeMonths: integer("shelf_life_months").notNull(),
  estimatedLandedCostCny: real("estimated_landed_cost_cny").notNull(),
  retailPriceBand: text("retail_price_band").notNull(),
  grossMarginBand: text("gross_margin_band").notNull(),
  moqBoxes: integer("moq_boxes").notNull(),
  last12MonthBoxes: integer("last_12_month_boxes").notNull().default(0),
  targetBoxes20ft: integer("target_boxes_20ft").notNull(),
  status: text("status").notNull().default("draft"),
  authorizationStatus: text("authorization_status").notNull().default("pending"),
  labelStatus: text("label_status").notNull().default("pending"),
  hsCode: text("hs_code"),
  storageRequirement: text("storage_requirement").notNull().default("常温干燥"),
  imagePath: text("image_path").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("products_country_idx").on(table.country),
  index("products_status_idx").on(table.status),
]);

export const procurementGroups = sqliteTable("procurement_groups", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  containerType: text("container_type").notNull().default("20ft"),
  targetBoxes: integer("target_boxes").notNull(),
  currentBoxes: integer("current_boxes").notNull().default(0),
  status: text("status").notNull().default("collecting"),
  expectedArrivalWindow: text("expected_arrival_window"),
  finalQuoteVersion: text("final_quote_version"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("procurement_groups_product_id_idx").on(table.productId),
  index("procurement_groups_status_idx").on(table.status),
]);

export const purchaseIntentions = sqliteTable("purchase_intentions", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  enterpriseId: text("enterprise_id").notNull().references(() => enterprises.id),
  enterpriseUserId: text("enterprise_user_id").references(() => enterpriseUsers.id),
  quantityBoxes: integer("quantity_boxes").notNull(),
  receivingRegion: text("receiving_region").notNull(),
  expectedArrivalWindow: text("expected_arrival_window").notNull(),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("submitted"),
  submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("purchase_intentions_product_id_idx").on(table.productId),
  index("purchase_intentions_enterprise_id_idx").on(table.enterpriseId),
  index("purchase_intentions_status_idx").on(table.status),
]);

export const workflowFileRequirements = sqliteTable("workflow_file_requirements", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  stage: text("stage").notNull(),
  requiredFileType: text("required_file_type").notNull(),
  ownerRole: text("owner_role").notNull(),
  requiredBeforeStatus: text("required_before_status").notNull(),
  buyerVisibility: text("buyer_visibility").notNull().default("hidden"),
  sequence: integer("sequence").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("workflow_file_requirements_product_id_idx").on(table.productId),
]);

export const fileUploads = sqliteTable("file_uploads", {
  id: text("id").primaryKey(),
  requirementId: text("requirement_id").notNull().references(() => workflowFileRequirements.id),
  productId: text("product_id").notNull().references(() => products.id),
  orderId: text("order_id"),
  businessNo: text("business_no").notNull(),
  originalFileName: text("original_file_name").notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  aiReviewStatus: text("ai_review_status").notNull().default("pending"),
  aiReviewSummary: text("ai_review_summary"),
  manualReviewStatus: text("manual_review_status").notNull().default("pending"),
  uploadedByUserId: text("uploaded_by_user_id").notNull(),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("file_uploads_product_id_idx").on(table.productId),
  index("file_uploads_order_id_idx").on(table.orderId),
  index("file_uploads_business_no_idx").on(table.businessNo),
  index("file_uploads_manual_review_status_idx").on(table.manualReviewStatus),
]);

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  userType: text("user_type").notNull(),
  userId: text("user_id").notNull(),
  sessionHash: text("session_hash").notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  expiresAt: text("expires_at").notNull(),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("auth_sessions_session_hash_unique").on(table.sessionHash),
  index("auth_sessions_user_idx").on(table.userType, table.userId),
  index("auth_sessions_expires_at_idx").on(table.expiresAt),
]);

export const businessDocuments = sqliteTable("business_documents", {
  id: text("id").primaryKey(),
  documentNo: text("document_no").notNull(),
  documentType: text("document_type").notNull(),
  productId: text("product_id").references(() => products.id),
  orderId: text("order_id"),
  enterpriseId: text("enterprise_id").references(() => enterprises.id),
  purchaseIntentionId: text("purchase_intention_id").references(() => purchaseIntentions.id),
  fileUploadId: text("file_upload_id").references(() => fileUploads.id),
  stage: text("stage").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").notNull().default("internal"),
  amountCny: real("amount_cny"),
  currency: text("currency"),
  createdByUserType: text("created_by_user_type").notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  reviewedByUserId: text("reviewed_by_user_id"),
  reviewedAt: text("reviewed_at"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("business_documents_document_no_unique").on(table.documentNo),
  index("business_documents_product_id_idx").on(table.productId),
  index("business_documents_order_id_idx").on(table.orderId),
  index("business_documents_enterprise_id_idx").on(table.enterpriseId),
  index("business_documents_status_idx").on(table.status),
  index("business_documents_stage_idx").on(table.stage),
]);

export const procurementOrders = sqliteTable("procurement_orders", {
  id: text("id").primaryKey(),
  orderNo: text("order_no").notNull(),
  productId: text("product_id").notNull().references(() => products.id),
  enterpriseId: text("enterprise_id").notNull().references(() => enterprises.id),
  purchaseIntentionId: text("purchase_intention_id").references(() => purchaseIntentions.id),
  quantityBoxes: integer("quantity_boxes").notNull(),
  containerType: text("container_type").notNull().default("20ft"),
  currentStage: text("current_stage").notNull().default("second_confirmation"),
  status: text("status").notNull().default("second_confirmation"),
  confirmedUnitCostCny: real("confirmed_unit_cost_cny"),
  totalAmountCny: real("total_amount_cny"),
  receivingRegion: text("receiving_region").notNull(),
  expectedArrivalWindow: text("expected_arrival_window").notNull(),
  etd: text("etd"),
  eta: text("eta"),
  containerNo: text("container_no"),
  sealNo: text("seal_no"),
  customsDeclarationNo: text("customs_declaration_no"),
  overseasSupplierName: text("overseas_supplier_name"),
  overseasPoNo: text("overseas_po_no"),
  proformaInvoiceNo: text("proforma_invoice_no"),
  overseasCurrency: text("overseas_currency"),
  overseasAmount: real("overseas_amount"),
  overseasPaymentStatus: text("overseas_payment_status"),
  createdByUserId: text("created_by_user_id").notNull(),
  updatedByUserId: text("updated_by_user_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("procurement_orders_order_no_unique").on(table.orderNo),
  index("procurement_orders_product_id_idx").on(table.productId),
  index("procurement_orders_enterprise_id_idx").on(table.enterpriseId),
  index("procurement_orders_status_idx").on(table.status),
  index("procurement_orders_stage_idx").on(table.currentStage),
]);

export const procurementOrderEvents = sqliteTable("procurement_order_events", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => procurementOrders.id),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  action: text("action").notNull(),
  actorType: text("actor_type").notNull(),
  actorId: text("actor_id").notNull(),
  note: text("note").notNull().default(""),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("procurement_order_events_order_id_idx").on(table.orderId),
  index("procurement_order_events_to_stage_idx").on(table.toStage),
]);

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  requestedByUserId: text("requested_by_user_id").notNull(),
  approverUserId: text("approver_user_id"),
  requiredRole: text("required_role").notNull(),
  status: text("status").notNull().default("pending"),
  comment: text("comment").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  decidedAt: text("decided_at"),
}, (table) => [
  index("approvals_target_idx").on(table.targetType, table.targetId),
  index("approvals_status_idx").on(table.status),
]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorType: text("actor_type").notNull(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("audit_logs_target_idx").on(table.targetType, table.targetId),
  index("audit_logs_actor_idx").on(table.actorType, table.actorId),
]);
