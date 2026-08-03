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
