import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enterpriseUsers, operatorUsers } from "../../../../db/schema";
import { badRequest, serverError } from "../../_utils";
import { buildSessionCookie, createSession, verifyPassword } from "../../_auth";

type LoginPayload = {
  portal?: "buyer" | "operator";
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LoginPayload;
    const portal = payload.portal;
    const email = payload.email?.trim().toLowerCase() ?? "";
    const password = payload.password ?? "";

    if (portal !== "buyer" && portal !== "operator") return badRequest("portal is required");
    if (!email) return badRequest("email is required");
    if (!password) return badRequest("password is required");

    const db = getDb();

    if (portal === "buyer") {
      const [user] = await db.select().from(enterpriseUsers).where(eq(enterpriseUsers.email, email)).limit(1);
      if (!user || user.status !== "active" || !(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
        return Response.json({ error: "账号或密码不正确。" }, { status: 401 });
      }
      await db.update(enterpriseUsers).set({ lastLoginAt: sql`CURRENT_TIMESTAMP` }).where(eq(enterpriseUsers.id, user.id));
      const authUser = {
        userType: "enterprise_user" as const,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        enterpriseId: user.enterpriseId,
      };
      const session = await createSession(authUser, request);
      return Response.json({ user: authUser }, { headers: { "Set-Cookie": buildSessionCookie(session.token, session.expiresAt) } });
    }

    const [user] = await db.select().from(operatorUsers).where(eq(operatorUsers.email, email)).limit(1);
    if (!user || user.status !== "active" || !(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
      return Response.json({ error: "账号或密码不正确。" }, { status: 401 });
    }
    await db.update(operatorUsers).set({ lastLoginAt: sql`CURRENT_TIMESTAMP` }).where(eq(operatorUsers.id, user.id));
    const authUser = {
      userType: "operator_user" as const,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const session = await createSession(authUser, request);
    return Response.json({ user: authUser }, { headers: { "Set-Cookie": buildSessionCookie(session.token, session.expiresAt) } });
  } catch (error) {
    return serverError(error);
  }
}
