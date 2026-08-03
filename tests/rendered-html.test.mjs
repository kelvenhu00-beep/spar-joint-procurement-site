import { readdirSync, statSync } from "node:fs";
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
  assert.ok(statSync(join(root, "app", "api", "users", "route.ts")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0000_daffy_stark_industries.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0001_seed_initial_data.sql")).isFile());
  assert.ok(statSync(join(root, "drizzle", "0002_accounts_documents_sessions.sql")).isFile());
});
