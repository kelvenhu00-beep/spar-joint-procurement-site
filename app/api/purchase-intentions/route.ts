import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { approvals, auditLogs, enterprises, procurementGroups, products, purchaseIntentions } from "../../../db/schema";
import { badRequest, makeId, serverError } from "../_utils";
import { getCurrentUser } from "../_auth";

type PurchaseIntentionPayload = {
  productId?: string;
  quantityBoxes?: number | string;
  receivingRegion?: string;
  expectedArrivalWindow?: string;
  note?: string;
};

type PurchaseIntentionReviewPayload = {
  id?: string;
  action?: "submit_for_director" | "approve" | "request_changes" | "reject" | "withdraw";
  actorRole?: "manager" | "director" | "buyer";
  comment?: string;
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    const db = getDb();
    const rows = await db
      .select({
        id: purchaseIntentions.id,
        productId: purchaseIntentions.productId,
        productName: products.cnName,
        enterpriseId: purchaseIntentions.enterpriseId,
        enterpriseName: enterprises.shortName,
        quantityBoxes: purchaseIntentions.quantityBoxes,
        receivingRegion: purchaseIntentions.receivingRegion,
        expectedArrivalWindow: purchaseIntentions.expectedArrivalWindow,
        note: purchaseIntentions.note,
        status: purchaseIntentions.status,
        submittedAt: purchaseIntentions.submittedAt,
      })
      .from(purchaseIntentions)
      .leftJoin(products, eq(purchaseIntentions.productId, products.id))
      .leftJoin(enterprises, eq(purchaseIntentions.enterpriseId, enterprises.id))
      .orderBy(desc(purchaseIntentions.submittedAt))
      .limit(50);

    return Response.json({
      purchaseIntentions: user?.userType === "enterprise_user" ? rows.filter((row) => row.enterpriseId === user.enterpriseId) : rows,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "enterprise_user" || !user.enterpriseId) {
      return Response.json({ error: "只有企业采购账号可以提交采购意向。" }, { status: 403 });
    }

    const payload = (await request.json()) as PurchaseIntentionPayload;
    const productId = payload.productId?.trim() ?? "";
    const quantityBoxes = Number(payload.quantityBoxes);
    const receivingRegion = payload.receivingRegion?.trim() ?? "";
    const expectedArrivalWindow = payload.expectedArrivalWindow?.trim() ?? "";
    const note = payload.note?.trim() ?? "";

    if (!productId) return badRequest("productId is required");
    if (!Number.isInteger(quantityBoxes) || quantityBoxes <= 0) {
      return badRequest("quantityBoxes must be a positive integer");
    }
    if (!receivingRegion) return badRequest("receivingRegion is required");
    if (!expectedArrivalWindow) return badRequest("expectedArrivalWindow is required");
    if (note.length > 200) return badRequest("note must be at most 200 characters");

    const db = getDb();
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return badRequest("product does not exist");
    if (quantityBoxes < product.moqBoxes) {
      return badRequest(`quantityBoxes must be at least the product MOQ: ${product.moqBoxes}`);
    }

    await db
      .insert(enterprises)
      .values({
        id: user.enterpriseId,
        name: "广东嘉荣超市有限公司",
        shortName: "广东嘉荣集团",
        type: "区域头部超市",
        region: "华南",
      })
      .onConflictDoNothing();

    const id = makeId("pi");
    const [intention] = await db
      .insert(purchaseIntentions)
      .values({
        id,
        productId,
        enterpriseId: user.enterpriseId,
        enterpriseUserId: user.id,
        quantityBoxes,
        receivingRegion,
        expectedArrivalWindow,
        note,
      })
      .returning();

    await db
      .update(products)
      .set({
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(products.id, productId));

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: "enterprise_user",
      actorId: user.id,
      action: "purchase_intention.submitted",
      targetType: "purchase_intention",
      targetId: id,
      metadataJson: JSON.stringify({ productId, quantityBoxes, receivingRegion, expectedArrivalWindow }),
    });

    return Response.json({ purchaseIntention: intention }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });

    const payload = (await request.json()) as PurchaseIntentionReviewPayload;
    const id = payload.id?.trim() ?? "";
    const action = payload.action;
    const actorRole = payload.actorRole;
    const comment = payload.comment?.trim() ?? "";

    if (!id) return badRequest("id is required");
    if (!action) return badRequest("action is required");
    if (!actorRole) return badRequest("actorRole is required");

    const db = getDb();
    const [intention] = await db.select().from(purchaseIntentions).where(eq(purchaseIntentions.id, id)).limit(1);
    if (!intention) return badRequest("purchase intention does not exist");

    if (user.userType === "enterprise_user" && action !== "withdraw") {
      return Response.json({ error: "企业账号只能撤回本企业采购意向。" }, { status: 403 });
    }
    if (user.userType === "operator_user" && actorRole !== user.role) {
      return Response.json({ error: "请求角色与当前登录账号不一致。" }, { status: 403 });
    }
    if (user.userType === "enterprise_user" && intention.enterpriseId !== user.enterpriseId) {
      return Response.json({ error: "不能处理其他企业的采购意向。" }, { status: 403 });
    }

    if (action === "submit_for_director" && actorRole !== "manager") {
      return badRequest("only manager can submit for director review");
    }
    if ((action === "approve" || action === "request_changes" || action === "reject") && actorRole !== "director") {
      return badRequest("only director can approve or reject");
    }
    if (action === "withdraw" && actorRole !== "buyer") {
      return badRequest("only buyer can withdraw");
    }

    const nextStatusByAction = {
      submit_for_director: "director_review",
      approve: "confirmed",
      request_changes: "changes_requested",
      reject: "rejected",
      withdraw: "withdrawn",
    } as const;

    const [updated] = await db
      .update(purchaseIntentions)
      .set({
        status: nextStatusByAction[action],
        note: comment ? `${intention.note}\n[${actorRole}] ${comment}`.trim() : intention.note,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(purchaseIntentions.id, id))
      .returning();

    if (action === "submit_for_director") {
      await db.insert(approvals).values({
        id: makeId("appr"),
        targetType: "purchase_intention",
        targetId: id,
        requestedByUserId: user.id,
        requiredRole: "director",
        status: "pending",
        comment,
      });
    }

    if (action === "approve") {
      const [group] = await db.select().from(procurementGroups).where(eq(procurementGroups.productId, intention.productId)).limit(1);
      if (group) {
        const nextBoxes = group.currentBoxes + intention.quantityBoxes;
        await db
          .update(procurementGroups)
          .set({
            currentBoxes: nextBoxes,
            status: nextBoxes >= group.targetBoxes ? "ready_for_second_confirmation" : group.status,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(procurementGroups.id, group.id));
      }
      await db
        .update(approvals)
        .set({
          status: "approved",
          approverUserId: user.id,
          comment,
          decidedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(approvals.targetId, id));
    }

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: actorRole === "buyer" ? "enterprise_user" : "operator_user",
      actorId: user.id,
      action: `purchase_intention.${action}`,
      targetType: "purchase_intention",
      targetId: id,
      metadataJson: JSON.stringify({ comment }),
    });

    return Response.json({ purchaseIntention: updated });
  } catch (error) {
    return serverError(error);
  }
}
