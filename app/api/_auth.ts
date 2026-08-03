import { eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { authSessions, enterpriseUsers, operatorUsers } from "../../db/schema";
import { makeId } from "./_utils";

const SESSION_COOKIE = "spar_session";
const PASSWORD_ITERATIONS = 100000;

export type AuthenticatedUser = {
  userType: "enterprise_user" | "operator_user";
  id: string;
  name: string;
  email: string;
  role: string;
  enterpriseId?: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function createRandomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function hashText(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

export async function hashPassword(password: string, salt = createRandomToken(18)) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64UrlToBytes(salt),
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256
  );
  return {
    salt,
    passwordHash: `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${bytesToBase64(new Uint8Array(bits))}`,
  };
}

export async function verifyPassword(password: string, storedHash: string | null, storedSalt: string | null) {
  if (!storedHash || !storedSalt) return false;
  const hashed = await hashPassword(password, storedSalt);
  return hashed.passwordHash === storedHash;
}

export function getSessionCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const cookie = cookies.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : "";
}

export function buildSessionCookie(token: string, expiresAt: Date) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expiresAt.toUTCString()}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function createSession(user: AuthenticatedUser, request: Request) {
  const token = createRandomToken(36);
  const sessionHash = await hashText(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);
  const db = getDb();

  await db.insert(authSessions).values({
    id: makeId("sess"),
    userType: user.userType,
    userId: user.id,
    sessionHash,
    userAgent: request.headers.get("user-agent"),
    ipAddress: request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for"),
    expiresAt: expiresAt.toISOString(),
  });

  return {
    token,
    expiresAt,
  };
}

export async function getCurrentUser(request: Request): Promise<AuthenticatedUser | null> {
  const token = getSessionCookie(request);
  if (!token) return null;

  const db = getDb();
  const sessionHash = await hashText(token);
  const [session] = await db
    .select()
    .from(authSessions)
    .where(eq(authSessions.sessionHash, sessionHash))
    .limit(1);

  if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  if (session.userType === "enterprise_user") {
    const [user] = await db.select().from(enterpriseUsers).where(eq(enterpriseUsers.id, session.userId)).limit(1);
    if (!user || user.status !== "active") return null;
    return {
      userType: "enterprise_user",
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      enterpriseId: user.enterpriseId,
    };
  }

  if (session.userType === "operator_user") {
    const [user] = await db.select().from(operatorUsers).where(eq(operatorUsers.id, session.userId)).limit(1);
    if (!user || user.status !== "active") return null;
    return {
      userType: "operator_user",
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  return null;
}

export async function revokeSession(request: Request) {
  const token = getSessionCookie(request);
  if (!token) return;

  const db = getDb();
  const sessionHash = await hashText(token);
  await db
    .update(authSessions)
    .set({ revokedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(authSessions.sessionHash, sessionHash));
}
