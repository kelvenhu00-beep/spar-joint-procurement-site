import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, enterprises, enterpriseUsers, operatorUsers } from "../../../db/schema";
import { badRequest, makeId, serverError } from "../_utils";
import { getCurrentUser, hashPassword } from "../_auth";

type UserPayload = {
  userType?: "enterprise_user" | "operator_user";
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  enterpriseShortName?: string;
  enterpriseType?: string;
  enterpriseRegion?: string;
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以查看账号列表。" }, { status: 403 });

    const db = getDb();
    const [enterpriseRows, operatorRows] = await Promise.all([
      db.select().from(enterpriseUsers).orderBy(asc(enterpriseUsers.enterpriseId), asc(enterpriseUsers.name)),
      db.select().from(operatorUsers).orderBy(asc(operatorUsers.role), asc(operatorUsers.name)),
    ]);

    return Response.json({
      enterpriseUsers: enterpriseRows.map(({ passwordHash, passwordSalt, ...row }) => ({
        ...row,
        hasPassword: Boolean(passwordHash && passwordSalt),
      })),
      operatorUsers: operatorRows.map(({ passwordHash, passwordSalt, ...row }) => ({
        ...row,
        hasPassword: Boolean(passwordHash && passwordSalt),
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以创建账号。" }, { status: 403 });

    const payload = (await request.json()) as UserPayload;
    const userType = payload.userType;
    const name = payload.name?.trim() ?? "";
    const email = payload.email?.trim().toLowerCase() ?? "";
    const password = payload.password ?? "";
    const role = payload.role?.trim() ?? "";

    if (userType !== "enterprise_user" && userType !== "operator_user") return badRequest("userType is required");
    if (!name) return badRequest("name is required");
    if (!email) return badRequest("email is required");
    if (!role) return badRequest("role is required");
    if (password.length < 10) return badRequest("password must be at least 10 characters");

    const db = getDb();
    const { passwordHash, salt } = await hashPassword(password);

    if (userType === "operator_user") {
      if (user.role !== "director") return Response.json({ error: "只有总监账号可以创建内部账号。" }, { status: 403 });
      const id = makeId("ou");
      const [created] = await db
        .insert(operatorUsers)
        .values({
          id,
          name,
          email,
          role,
          passwordHash,
          passwordSalt: salt,
          forcePasswordReset: true,
          status: "active",
          passwordUpdatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .returning();

      await db.insert(auditLogs).values({
        id: makeId("audit"),
        actorType: user.userType,
        actorId: user.id,
        action: "operator_user.created",
        targetType: "operator_user",
        targetId: created.id,
        metadataJson: JSON.stringify({ email, role }),
      });

      return Response.json({ user: { ...created, passwordHash: undefined, passwordSalt: undefined } }, { status: 201 });
    }

    const enterpriseId = payload.enterpriseId?.trim() || makeId("ent");
    await db
      .insert(enterprises)
      .values({
        id: enterpriseId,
        name: payload.enterpriseName?.trim() || payload.enterpriseShortName?.trim() || "未命名企业",
        shortName: payload.enterpriseShortName?.trim() || payload.enterpriseName?.trim() || "未命名企业",
        type: payload.enterpriseType?.trim() || "区域零售企业",
        region: payload.enterpriseRegion?.trim() || "待补充",
      })
      .onConflictDoNothing();

    const id = makeId("eu");
    const [created] = await db
      .insert(enterpriseUsers)
      .values({
        id,
        enterpriseId,
        name,
        email,
        role,
        passwordHash,
        passwordSalt: salt,
        forcePasswordReset: true,
        status: "active",
        passwordUpdatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: user.userType,
      actorId: user.id,
      action: "enterprise_user.created",
      targetType: "enterprise_user",
      targetId: created.id,
      metadataJson: JSON.stringify({ email, role, enterpriseId }),
    });

    return Response.json({ user: { ...created, passwordHash: undefined, passwordSalt: undefined } }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
