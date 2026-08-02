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
