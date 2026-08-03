import { env } from "cloudflare:workers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, operatorUsers } from "../../../db/schema";
import { badRequest, makeId, serverError } from "../_utils";
import { hashPassword } from "../_auth";

type SetupEnv = {
  SETUP_KEY?: string;
};

type SetupPayload = {
  setupKey?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: "manager" | "director";
};

export async function GET() {
  try {
    const db = getDb();
    const users = await db.select().from(operatorUsers).limit(50);
    return Response.json({
      initialized: users.some((user) => Boolean(user.passwordHash)),
      operatorCount: users.length,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const setupKey = (env as SetupEnv).SETUP_KEY;
    if (!setupKey) {
      return Response.json({ error: "SETUP_KEY 未配置，不能初始化管理员。" }, { status: 500 });
    }

    const payload = (await request.json()) as SetupPayload;
    if (payload.setupKey !== setupKey) return Response.json({ error: "初始化密钥不正确。" }, { status: 403 });

    const email = payload.email?.trim().toLowerCase() ?? "";
    const name = payload.name?.trim() ?? "";
    const password = payload.password ?? "";
    const role = payload.role ?? "director";

    if (!email) return badRequest("email is required");
    if (!name) return badRequest("name is required");
    if (password.length < 10) return badRequest("password must be at least 10 characters");

    const db = getDb();
    const existing = await db.select().from(operatorUsers).limit(50);
    if (existing.some((user) => Boolean(user.passwordHash))) {
      return Response.json({ error: "管理员已初始化，不能重复初始化。" }, { status: 409 });
    }

    const { passwordHash, salt } = await hashPassword(password);
    const id = role === "director" ? "ou_director_admin" : "ou_manager_admin";
    const [user] = await db
      .insert(operatorUsers)
      .values({
        id,
        name,
        email,
        role,
        passwordHash,
        passwordSalt: salt,
        forcePasswordReset: false,
        status: "active",
        passwordUpdatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .onConflictDoUpdate({
        target: operatorUsers.id,
        set: {
          name,
          email,
          role,
          passwordHash,
          passwordSalt: salt,
          forcePasswordReset: false,
          status: "active",
          passwordUpdatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: "system",
      actorId: "setup",
      action: "operator.initialized",
      targetType: "operator_user",
      targetId: user.id,
      metadataJson: JSON.stringify({ email, role }),
    });

    return Response.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
