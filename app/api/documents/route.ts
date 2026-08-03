import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, businessDocuments, enterprises, products, purchaseIntentions } from "../../../db/schema";
import { badRequest, makeId, serverError } from "../_utils";
import { getCurrentUser } from "../_auth";

type DocumentPayload = {
  documentType?: string;
  productId?: string;
  orderId?: string;
  enterpriseId?: string;
  purchaseIntentionId?: string;
  stage?: string;
  title?: string;
  visibility?: string;
  amountCny?: number | string;
  currency?: string;
  metadata?: Record<string, unknown>;
};

type DocumentReviewPayload = {
  id?: string;
  action?: "submit_review" | "approve" | "request_changes" | "archive" | "void";
  comment?: string;
};

function documentNo(type: string) {
  const normalized = type.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8) || "DOC";
  return `${normalized}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${makeId("").replace("_", "").slice(0, 8).toUpperCase()}`;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim();
    const orderId = searchParams.get("orderId")?.trim();
    const db = getDb();

    let rows = await db
      .select({
        id: businessDocuments.id,
        documentNo: businessDocuments.documentNo,
        documentType: businessDocuments.documentType,
        productId: businessDocuments.productId,
        productName: products.cnName,
        orderId: businessDocuments.orderId,
        enterpriseId: businessDocuments.enterpriseId,
        enterpriseName: enterprises.shortName,
        purchaseIntentionId: businessDocuments.purchaseIntentionId,
        fileUploadId: businessDocuments.fileUploadId,
        stage: businessDocuments.stage,
        title: businessDocuments.title,
        status: businessDocuments.status,
        visibility: businessDocuments.visibility,
        amountCny: businessDocuments.amountCny,
        currency: businessDocuments.currency,
        createdByUserType: businessDocuments.createdByUserType,
        createdByUserId: businessDocuments.createdByUserId,
        reviewedByUserId: businessDocuments.reviewedByUserId,
        reviewedAt: businessDocuments.reviewedAt,
        metadataJson: businessDocuments.metadataJson,
        createdAt: businessDocuments.createdAt,
        updatedAt: businessDocuments.updatedAt,
      })
      .from(businessDocuments)
      .leftJoin(products, eq(businessDocuments.productId, products.id))
      .leftJoin(enterprises, eq(businessDocuments.enterpriseId, enterprises.id))
      .orderBy(desc(businessDocuments.createdAt))
      .limit(100);

    if (productId) {
      rows = rows.filter((row) => row.productId === productId);
    }
    if (orderId) {
      rows = rows.filter((row) => row.orderId === orderId);
    }
    if (user.userType === "enterprise_user") {
      rows = rows.filter((row) => row.enterpriseId === user.enterpriseId && row.visibility !== "internal");
    }

    return Response.json({ documents: rows });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以生成业务单据。" }, { status: 403 });

    const payload = (await request.json()) as DocumentPayload;
    const documentType = payload.documentType?.trim() ?? "";
    const stage = payload.stage?.trim() ?? "";
    const title = payload.title?.trim() ?? "";
    if (!documentType) return badRequest("documentType is required");
    if (!stage) return badRequest("stage is required");
    if (!title) return badRequest("title is required");

    const db = getDb();
    if (payload.productId) {
      const [product] = await db.select().from(products).where(eq(products.id, payload.productId)).limit(1);
      if (!product) return badRequest("product does not exist");
    }
    if (payload.enterpriseId) {
      const [enterprise] = await db.select().from(enterprises).where(eq(enterprises.id, payload.enterpriseId)).limit(1);
      if (!enterprise) return badRequest("enterprise does not exist");
    }
    if (payload.purchaseIntentionId) {
      const [intention] = await db.select().from(purchaseIntentions).where(eq(purchaseIntentions.id, payload.purchaseIntentionId)).limit(1);
      if (!intention) return badRequest("purchase intention does not exist");
    }

    const [document] = await db
      .insert(businessDocuments)
      .values({
        id: makeId("doc"),
        documentNo: documentNo(documentType),
        documentType,
        productId: payload.productId?.trim() || null,
        orderId: payload.orderId?.trim() || null,
        enterpriseId: payload.enterpriseId?.trim() || null,
        purchaseIntentionId: payload.purchaseIntentionId?.trim() || null,
        stage,
        title,
        status: "draft",
        visibility: payload.visibility?.trim() || "internal",
        amountCny: payload.amountCny === undefined || payload.amountCny === "" ? null : Number(payload.amountCny),
        currency: payload.currency?.trim() || null,
        createdByUserType: user.userType,
        createdByUserId: user.id,
        metadataJson: JSON.stringify(payload.metadata ?? {}),
      })
      .returning();

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: user.userType,
      actorId: user.id,
      action: "document.created",
      targetType: "business_document",
      targetId: document.id,
      metadataJson: JSON.stringify({ documentNo: document.documentNo, documentType }),
    });

    return Response.json({ document }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以处理业务单据。" }, { status: 403 });

    const payload = (await request.json()) as DocumentReviewPayload;
    const id = payload.id?.trim() ?? "";
    const action = payload.action;
    if (!id) return badRequest("id is required");
    if (!action) return badRequest("action is required");
    if (action === "submit_review" && user.role !== "manager") {
      return Response.json({ error: "只有商品运营经理可以提交单据复核。" }, { status: 403 });
    }
    if ((action === "approve" || action === "request_changes" || action === "archive" || action === "void") && user.role !== "director") {
      return Response.json({ error: "只有商品总监可以审批、归档或作废业务单据。" }, { status: 403 });
    }

    const nextStatusByAction = {
      submit_review: "reviewing",
      approve: "approved",
      request_changes: "changes_requested",
      archive: "archived",
      void: "voided",
    } as const;

    const db = getDb();
    const [document] = await db
      .update(businessDocuments)
      .set({
        status: nextStatusByAction[action],
        reviewedByUserId: action === "approve" || action === "archive" || action === "void" ? user.id : undefined,
        reviewedAt: action === "approve" || action === "archive" || action === "void" ? sql`CURRENT_TIMESTAMP` : undefined,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(businessDocuments.id, id))
      .returning();

    if (!document) return badRequest("document does not exist");

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: user.userType,
      actorId: user.id,
      action: `document.${action}`,
      targetType: "business_document",
      targetId: id,
      metadataJson: JSON.stringify({ comment: payload.comment ?? "" }),
    });

    return Response.json({ document });
  } catch (error) {
    return serverError(error);
  }
}
