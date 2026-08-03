import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, enterprises, enterpriseUsers, operatorUsers } from "../../../db/schema";
import { badRequest, makeId, serverError } from "../_utils";
import { getCurrentUser, hashPassword } from "../_auth";

type UserPayload = {
  id?: string;
  action?: "activate" | "deactivate" | "reset_password";
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

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以维护账号。" }, { status: 403 });

    const payload = (await request.json()) as UserPayload;
    const id = payload.id?.trim() ?? "";
    const action = payload.action;
    const userType = payload.userType;
    if (!id) return badRequest("id is required");
    if (action !== "activate" && action !== "deactivate" && action !== "reset_password") return badRequest("action is required");
    if (userType !== "enterprise_user" && userType !== "operator_user") return badRequest("userType is required");

    const db = getDb();
    if (userType === "operator_user" && user.role !== "director") {
      return Response.json({ error: "只有总监账号可以维护内部账号。" }, { status: 403 });
    }
    if (userType === "enterprise_user" && user.role !== "director" && user.role !== "manager") {
      return Response.json({ error: "只有经理或总监账号可以维护企业账号。" }, { status: 403 });
    }

    const updateValues: {
      status?: string;
      passwordHash?: string;
      passwordSalt?: string;
      forcePasswordReset?: boolean;
      passwordUpdatedAt?: ReturnType<typeof sql>;
    } = {};
    if (action === "activate") updateValues.status = "active";
    if (action === "deactivate") updateValues.status = "disabled";
    if (action === "reset_password") {
      const password = payload.password ?? "";
      if (password.length < 10) return badRequest("password must be at least 10 characters");
      const { passwordHash, salt } = await hashPassword(password);
      updateValues.passwordHash = passwordHash;
      updateValues.passwordSalt = salt;
      updateValues.forcePasswordReset = true;
      updateValues.passwordUpdatedAt = sql`CURRENT_TIMESTAMP`;
      updateValues.status = "active";
    }

    const table = userType === "enterprise_user" ? enterpriseUsers : operatorUsers;
    const [updated] = await db.update(table).set(updateValues).where(eq(table.id, id)).returning();
    if (!updated) return badRequest("user does not exist");

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: user.userType,
      actorId: user.id,
      action: `${userType}.${action}`,
      targetType: userType,
      targetId: id,
      metadataJson: JSON.stringify({ email: updated.email, role: updated.role }),
    });

    const { passwordHash, passwordSalt, ...safeUser } = updated;
    return Response.json({ user: { ...safeUser, hasPassword: Boolean(passwordHash && passwordSalt) } });
  } catch (error) {
    return serverError(error);
  }
}
