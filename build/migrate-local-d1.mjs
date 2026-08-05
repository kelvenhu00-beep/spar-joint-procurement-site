#!/usr/bin/env node
/**
 * Applies drizzle/*.sql migrations (schema + seed data + demo passwords) to
 * the local D1 database used by `vinext dev` / `wrangler dev`.
 *
 * Without running this once, the local D1 database has no tables at all,
 * so every API route (login, products, orders, ...) fails with
 * "no such table" / "数据库表尚未创建" and the app is unusable locally.
 *
 * Run again any time `.wrangler/state` is deleted/reset.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DATABASE_NAME = "site-creator-d1";
const PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";
const PERSIST_DIR = "./.wrangler/state";
const PROJECT_ROOT = process.cwd();
const MIGRATIONS_DIR = resolve(PROJECT_ROOT, "drizzle");

const tempDir = mkdtempSync(join(tmpdir(), "spar-d1-migrate-"));
const configPath = join(tempDir, "wrangler.toml");

writeFileSync(
  configPath,
  [
    `name = "site-creator-migrate"`,
    `compatibility_date = "2024-01-01"`,
    "",
    "[[d1_databases]]",
    `binding = "DB"`,
    `database_name = "${DATABASE_NAME}"`,
    `database_id = "${PLACEHOLDER_DATABASE_ID}"`,
    // Absolute path: wrangler resolves `migrations_dir` relative to the
    // config file's directory (the temp dir), not the process cwd.
    `migrations_dir = "${MIGRATIONS_DIR}"`,
    `migrations_table = "d1_migrations"`,
    "",
  ].join("\n"),
);

try {
  const result = spawnSync(
    "npx",
    [
      "wrangler",
      "d1",
      "migrations",
      "apply",
      DATABASE_NAME,
      "--local",
      "--config",
      configPath,
      "--persist-to",
      PERSIST_DIR,
    ],
    { stdio: "inherit", env: { ...process.env, CI: "true" } },
  );
  process.exit(result.status ?? 0);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
