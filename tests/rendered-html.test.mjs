import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const clientDir = join(root, "dist", "client");
const assetsDir = join(clientDir, "assets");
const productAssetsDir = join(clientDir, "product-assets");

test("build output contains deployable client assets", () => {
  const clientAssets = readdirSync(assetsDir);
  assert.ok(clientAssets.some((file) => file.endsWith(".js")), "missing client JavaScript asset");
  assert.ok(clientAssets.some((file) => file.endsWith(".css")), "missing client CSS asset");
});

test("build output carries Sites configuration", () => {
  assert.ok(statSync(join(root, "dist", ".openai", "hosting.json")).isFile());
});

test("build output includes product imagery used by the platform", () => {
  const productImages = readdirSync(productAssetsDir).filter((file) => file.endsWith(".png"));
  assert.ok(productImages.includes("haribo.png"));
  assert.ok(productImages.includes("manner.png"));
  assert.ok(productImages.includes("walkers.png"));
});

test("source includes real implementation entry points", () => {
  assert.ok(statSync(join(root, "app", "api", "purchase-intentions", "route.ts")).isFile());
  assert.ok(statSync(join(root, "app", "api", "products", "route.ts")).isFile());
  assert.ok(statSync(join(root, "app", "api", "files", "route.ts")).isFile());
  assert.ok(statSync(join(root, "app", "api", "auth", "login", "route.ts")).isFile());
  assert.ok(statSync(join(root, "app", "api", "documents", "route.ts")).isFile());
  assert.ok(statSync(join(root, "app", "api", "orders", "route.ts")).isFile());
  assert.ok(statSync(join(root, "app", "api", "users", "route.ts")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0000_daffy_stark_industries.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0001_seed_initial_data.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0002_accounts_documents_sessions.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0003_procurement_orders_workflow.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0004_order_bound_documents_files.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0005_overseas_purchase_fields.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0006_customs_clearance_fields.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0007_warehouse_sorting_fields.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0008_domestic_delivery_fields.sql")).isFile());
});

test("order workflow enforces reviewed stage documents", () => {
  const orderRoute = readFileSync(join(root, "app", "api", "orders", "route.ts"), "utf8");
  const fileRoute = readFileSync(join(root, "app", "api", "files", "route.ts"), "utf8");
  assert.ok(orderRoute.includes("stageGate"), "missing order stage gate");
  assert.ok(orderRoute.includes("blockedDocuments"), "missing blocked document response");
  assert.ok(fileRoute.includes("businessDocuments"), "file review must update business documents");
  assert.ok(fileRoute.includes("fileUploadId"), "file review must locate linked business document");
});

test("file downloads are permission checked", () => {
  const fileRoute = readFileSync(join(root, "app", "api", "files", "route.ts"), "utf8");
  assert.ok(fileRoute.includes("download") && fileRoute.includes("Content-Disposition"), "missing real file download response");
  assert.ok(fileRoute.includes("document.enterpriseId === user.enterpriseId"), "buyer downloads must be enterprise scoped");
  assert.ok(fileRoute.includes("document.visibility !== \"internal\""), "buyer downloads must hide internal files");
  assert.ok(fileRoute.includes("document.status === \"approved\""), "buyer downloads must require approved files");
});

test("enterprise upload is limited to payment proof", () => {
  const fileRoute = readFileSync(join(root, "app", "api", "files", "route.ts"), "utf8");
  const page = readFileSync(join(root, "app", "page.tsx"), "utf8");
  assert.ok(fileRoute.includes("企业账号当前只能在预付款阶段上传预付款证明。"), "enterprise upload must be restricted to payment proof");
  assert.ok(fileRoute.includes("order.currentStage !== \"deposit_payment\""), "enterprise payment upload must require deposit payment stage");
  assert.ok(page.includes("canBuyerUploadPaymentProof"), "buyer payment proof upload form must exist on order detail");
});

test("overseas purchase stage has structured fields and full document gate", () => {
  const orderRoute = readFileSync(join(root, "app", "api", "orders", "route.ts"), "utf8");
  const page = readFileSync(join(root, "app", "page.tsx"), "utf8");
  assert.ok(orderRoute.includes("供应商订单确认") && orderRoute.includes("对外付款证明"), "overseas purchase gate must include supplier confirmation and outbound payment proof");
  assert.ok(orderRoute.includes("overseasSupplierName") && orderRoute.includes("proformaInvoiceNo"), "orders API must expose overseas purchase fields");
  assert.ok(page.includes("overseas-purchase-panel"), "order detail must render overseas purchase form");
});

test("international shipping stage has transport fields", () => {
  const orderRoute = readFileSync(join(root, "app", "api", "orders", "route.ts"), "utf8");
  const page = readFileSync(join(root, "app", "page.tsx"), "utf8");
  assert.ok(orderRoute.includes("international_shipping: [\"Booking\", \"提单\", \"装柜照片\"]"), "shipping gate must require booking, bill of lading and loading photos");
  assert.ok(orderRoute.includes("containerNo") && orderRoute.includes("sealNo") && orderRoute.includes("etd") && orderRoute.includes("eta"), "orders API must expose shipping fields");
  assert.ok(page.includes("shipping-info-panel") && page.includes("saveShippingFields"), "order detail must render shipping form");
});

test("customs clearance stage has declaration, broker and tax fields", () => {
  const orderRoute = readFileSync(join(root, "app", "api", "orders", "route.ts"), "utf8");
  const page = readFileSync(join(root, "app", "page.tsx"), "utf8");
  const migration = readFileSync(join(root, "drizzle", "0006_customs_clearance_fields.sql"), "utf8");
  assert.ok(orderRoute.includes("customs_clearance: [\"Commercial Invoice\", \"Packing List\", \"报关单\", \"税单\"]"), "customs gate must require invoice, packing list, declaration and tax form");
  assert.ok(orderRoute.includes("customsBrokerName") && orderRoute.includes("actualTaxPaidCny"), "orders API must expose customs clearance fields");
  assert.ok(page.includes("customs-clearance-panel") && page.includes("saveCustomsFields"), "order detail must render customs clearance form");
  assert.ok(migration.includes("customs_broker_name") && migration.includes("actual_tax_paid_cny"), "customs migration must add broker and tax fields");
});

test("warehouse sorting stage has inbound and allocation fields", () => {
  const orderRoute = readFileSync(join(root, "app", "api", "orders", "route.ts"), "utf8");
  const page = readFileSync(join(root, "app", "page.tsx"), "utf8");
  const migration = readFileSync(join(root, "drizzle", "0007_warehouse_sorting_fields.sql"), "utf8");
  assert.ok(orderRoute.includes("warehouse_sorting: [\"入库单\", \"分货清单\"]"), "warehouse sorting gate must require inbound and allocation documents");
  assert.ok(orderRoute.includes("warehouseName") && orderRoute.includes("receivedBoxes") && orderRoute.includes("allocationStatus"), "orders API must expose warehouse sorting fields");
  assert.ok(orderRoute.includes("receivedBoxes must be a non-negative integer"), "warehouse numeric fields must be validated");
  assert.ok(page.includes("warehouse-sorting-panel") && page.includes("saveWarehouseFields"), "order detail must render warehouse sorting form");
  assert.ok(migration.includes("warehouse_inbound_no") && migration.includes("received_boxes") && migration.includes("allocation_status"), "warehouse migration must add inbound and allocation fields");
});

test("domestic delivery stage has carrier and dispatch fields", () => {
  const orderRoute = readFileSync(join(root, "app", "api", "orders", "route.ts"), "utf8");
  const page = readFileSync(join(root, "app", "page.tsx"), "utf8");
  const migration = readFileSync(join(root, "drizzle", "0008_domestic_delivery_fields.sql"), "utf8");
  assert.ok(orderRoute.includes("domestic_delivery: [\"二段配送单\", \"出库单\"]"), "domestic delivery gate must require delivery and outbound documents");
  assert.ok(orderRoute.includes("domesticCarrierName") && orderRoute.includes("domesticDeliveryNo") && orderRoute.includes("deliveredBoxes"), "orders API must expose domestic delivery fields");
  assert.ok(orderRoute.includes("deliveredBoxes must be a non-negative integer"), "delivered boxes must be validated");
  assert.ok(page.includes("domestic-delivery-panel") && page.includes("saveDomesticDeliveryFields"), "order detail must render domestic delivery form");
  assert.ok(migration.includes("domestic_delivery_no") && migration.includes("dispatch_at") && migration.includes("delivered_boxes"), "domestic delivery migration must add carrier and dispatch fields");
});
