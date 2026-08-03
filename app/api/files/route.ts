import { and, asc, desc, eq, sql } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { auditLogs, businessDocuments, fileUploads, procurementOrders, products, workflowFileRequirements } from "../../../db/schema";
import { badRequest, makeId, serverError } from "../_utils";
import { getCurrentUser } from "../_auth";

type FilesEnv = {
  FILES?: R2Bucket;
};

type FileReviewPayload = {
  id?: string;
  action?: "ai_pass" | "ai_warning" | "approve" | "request_changes" | "reject";
  actorRole?: "manager" | "director";
  summary?: string;
};

function safeFileName(name: string) {
  return name.replace(/[^\w.\-\u4e00-\u9fa5]+/g, "_").slice(0, 120) || "upload.bin";
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim();
    const orderId = searchParams.get("orderId")?.trim();
    const db = getDb();

    const requirementsQuery = productId
      ? db.select().from(workflowFileRequirements).where(eq(workflowFileRequirements.productId, productId)).orderBy(asc(workflowFileRequirements.sequence))
      : db.select().from(workflowFileRequirements).orderBy(asc(workflowFileRequirements.productId), asc(workflowFileRequirements.sequence));

    const uploadsQuery = orderId
      ? db.select().from(fileUploads).where(eq(fileUploads.orderId, orderId)).orderBy(desc(fileUploads.uploadedAt))
      : productId
      ? db.select().from(fileUploads).where(eq(fileUploads.productId, productId)).orderBy(desc(fileUploads.uploadedAt))
      : db.select().from(fileUploads).orderBy(desc(fileUploads.uploadedAt)).limit(100);

    const [requirements, uploads] = await Promise.all([requirementsQuery, uploadsQuery]);

    return Response.json({ requirements, uploads });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user" || user.role !== "manager") {
      return Response.json({ error: "只有商品运营经理可以上传流程文件。" }, { status: 403 });
    }

    const bucket = (env as FilesEnv).FILES;
    if (!bucket) {
      return Response.json({ error: "文件存储 FILES 未配置，无法保存真实文件。" }, { status: 500 });
    }

    const formData = await request.formData();
    const productId = String(formData.get("productId") ?? "").trim();
    const orderId = String(formData.get("orderId") ?? "").trim();
    const stage = String(formData.get("stage") ?? "").trim();
    const requiredFileType = String(formData.get("requiredFileType") ?? "").trim();
    const ownerRole = String(formData.get("ownerRole") ?? "manager").trim();
    const businessNo = String(formData.get("businessNo") ?? "").trim();
    const file = formData.get("file");

    if (!productId) return badRequest("productId is required");
    if (!stage) return badRequest("stage is required");
    if (!requiredFileType) return badRequest("requiredFileType is required");
    if (!businessNo) return badRequest("businessNo is required");
    if (!(file instanceof File)) return badRequest("file is required");

    const db = getDb();
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return badRequest("product does not exist");

    const [order] = orderId ? await db.select().from(procurementOrders).where(eq(procurementOrders.id, orderId)).limit(1) : [];
    if (orderId && !order) return badRequest("order does not exist");
    if (order && order.productId !== productId) return badRequest("order product does not match productId");

    const [existingRequirement] = await db
      .select()
      .from(workflowFileRequirements)
      .where(and(eq(workflowFileRequirements.productId, productId), eq(workflowFileRequirements.stage, stage), eq(workflowFileRequirements.requiredFileType, requiredFileType)))
      .limit(1);

    const requirementId = existingRequirement?.id ?? makeId("req");
    if (!existingRequirement) {
      await db.insert(workflowFileRequirements).values({
        id: requirementId,
        productId,
        stage,
        requiredFileType,
        ownerRole,
        requiredBeforeStatus: "next_stage",
        buyerVisibility: stage.includes("二次确认") || stage.includes("合同") || stage.includes("交付") ? "visible" : "hidden",
        sequence: Number(formData.get("sequence") ?? 99),
      });
    }

    const uploadId = makeId("file");
    const originalFileName = safeFileName(file.name);
    const storageKey = `${productId}/${requirementId}/${uploadId}/${originalFileName}`;
    await bucket.put(storageKey, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const [upload] = await db
      .insert(fileUploads)
      .values({
        id: uploadId,
        requirementId,
        productId,
        orderId: orderId || null,
        businessNo,
        originalFileName,
        storageKey,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        aiReviewStatus: "pending",
        aiReviewSummary: "已上传，等待 AI 初审。",
        manualReviewStatus: "pending",
        uploadedByUserId: user.id,
      })
      .returning();

    await db.insert(businessDocuments).values({
      id: makeId("doc"),
      documentNo: `DOC-${Date.now()}-${uploadId.slice(-6)}`,
      documentType: requiredFileType,
      productId,
      orderId: orderId || null,
      enterpriseId: order?.enterpriseId ?? null,
      purchaseIntentionId: order?.purchaseIntentionId ?? null,
      fileUploadId: uploadId,
      stage,
      title: `${product.cnName} · ${requiredFileType}`,
      status: "ai_review",
      visibility: stage.includes("二次确认") || stage.includes("合同") || stage.includes("交付") ? "buyer_visible_after_review" : "internal",
      createdByUserType: "operator_user",
      createdByUserId: user.id,
      metadataJson: JSON.stringify({ businessNo, originalFileName, orderId: orderId || null }),
    });

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: "operator_user",
      actorId: user.id,
      action: "file.uploaded",
      targetType: "file_upload",
      targetId: uploadId,
      metadataJson: JSON.stringify({ productId, orderId: orderId || null, stage, requiredFileType, businessNo }),
    });

    return Response.json({ upload }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以审核文件。" }, { status: 403 });

    const payload = (await request.json()) as FileReviewPayload;
    const id = payload.id?.trim() ?? "";
    const action = payload.action;
    const actorRole = payload.actorRole;
    const summary = payload.summary?.trim() ?? "";

    if (!id) return badRequest("id is required");
    if (!action) return badRequest("action is required");
    if (!actorRole) return badRequest("actorRole is required");

    if ((action === "approve" || action === "request_changes" || action === "reject") && actorRole !== "director") {
      return badRequest("only director can approve, request changes or reject files");
    }
    if (actorRole !== user.role) return Response.json({ error: "请求角色与当前登录账号不一致。" }, { status: 403 });

    const aiStatus = action === "ai_pass" ? "passed" : action === "ai_warning" ? "warning" : undefined;
    const manualStatus =
      action === "approve" ? "approved" : action === "request_changes" ? "changes_requested" : action === "reject" ? "rejected" : undefined;

    const db = getDb();
    const [upload] = await db
      .update(fileUploads)
      .set({
        aiReviewStatus: aiStatus ? aiStatus : undefined,
        aiReviewSummary: summary || undefined,
        manualReviewStatus: manualStatus ? manualStatus : undefined,
      })
      .where(eq(fileUploads.id, id))
      .returning();

    if (!upload) return badRequest("file upload does not exist");

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: "operator_user",
      actorId: user.id,
      action: `file.${action}`,
      targetType: "file_upload",
      targetId: id,
      metadataJson: JSON.stringify({ summary }),
    });

    await db
      .update(products)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(products.id, upload.productId));

    return Response.json({ upload });
  } catch (error) {
    return serverError(error);
  }
}
