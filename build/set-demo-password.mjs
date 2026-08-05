#!/usr/bin/env node
/**
 * Sets (or resets) the password for one demo/seed account directly in the
 * local D1 database used by `vinext dev`.
 *
 * Never commit plaintext passwords to this repository (not in code, seed
 * SQL, README, commit messages, or PR descriptions). Use this script to set
 * your own password locally instead — it hashes the password with the same
 * PBKDF2 scheme as app/api/_auth.ts and writes only the hash to the DB.
 *
 * Usage:
 *   node build/set-demo-password.mjs <email> <new-password>
 *
 * Example:
 *   node build/set-demo-password.mjs buyer@jiarong.example 'My$trongPassw0rd'
 */
import { webcrypto as nodeCrypto } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const crypto = nodeCrypto;
const PASSWORD_ITERATIONS = 100000;
const DATABASE_NAME = "site-creator-d1";
const PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";
const PERSIST_DIR = resolve(process.cwd(), ".wrangler/state");

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node build/set-demo-password.mjs <email> <new-password>");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters (matches the app's own rule).");
  process.exit(1);
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return Buffer.from(binary, "binary").toString("base64");
}
function createRandomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
function base64UrlToBytes(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = Buffer.from(padded, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function hashPassword(rawPassword, salt = createRandomToken(18)) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(rawPassword), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: base64UrlToBytes(salt), iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return { salt, passwordHash: `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${bytesToBase64(new Uint8Array(bits))}` };
}

const { salt, passwordHash } = await hashPassword(password);
const normalizedEmail = email.trim().toLowerCase().replaceAll("'", "''");

const sql = [
  `UPDATE enterprise_users SET password_hash = '${passwordHash}', password_salt = '${salt}', force_password_reset = 0, password_updated_at = CURRENT_TIMESTAMP WHERE email = '${normalizedEmail}';`,
  `UPDATE operator_users SET password_hash = '${passwordHash}', password_salt = '${salt}', force_password_reset = 0, password_updated_at = CURRENT_TIMESTAMP WHERE email = '${normalizedEmail}';`,
].join("\n");

const tempDir = mkdtempSync(join(tmpdir(), "spar-set-password-"));
const configPath = join(tempDir, "wrangler.toml");
const sqlPath = join(tempDir, "update.sql");
writeFileSync(sqlPath, sql);
writeFileSync(
  configPath,
  [
    `name = "site-creator-set-password"`,
    `compatibility_date = "2024-01-01"`,
    "",
    "[[d1_databases]]",
    `binding = "DB"`,
    `database_name = "${DATABASE_NAME}"`,
    `database_id = "${PLACEHOLDER_DATABASE_ID}"`,
    "",
  ].join("\n"),
);

try {
  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "execute", DATABASE_NAME, "--local", "--config", configPath, "--persist-to", PERSIST_DIR, "--file", sqlPath],
    { stdio: "inherit", env: { ...process.env, CI: "true" } },
  );
  if (result.status === 0) {
    console.log(`\nPassword updated for ${normalizedEmail} in the local D1 database.`);
  }
  process.exit(result.status ?? 0);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
