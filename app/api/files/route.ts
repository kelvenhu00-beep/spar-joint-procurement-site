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

function buyerVisibleStage(stage: string) {
  return stage.includes("二次确认") || stage.includes("合同") || stage.includes("预付款") || stage.includes("二段配送") || stage.includes("签收") || stage.includes("结算归档");
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\-\u4e00-\u9fa5]+/g, "_").slice(0, 120) || "upload.bin";
}

function contentDisposition(fileName: string) {
  const asciiName = fileName.replace(/[^\w.\-]+/g, "_") || "download.bin";
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();
    const download = searchParams.get("download") === "1";
    const productId = searchParams.get("productId")?.trim();
    const orderId = searchParams.get("orderId")?.trim();
    const db = getDb();

    if (download) {
      if (!id) return badRequest("id is required");
      const [upload] = await db.select().from(fileUploads).where(eq(fileUploads.id, id)).limit(1);
      if (!upload) return Response.json({ error: "文件不存在。" }, { status: 404 });

      const relatedDocuments = await db.select().from(businessDocuments).where(eq(businessDocuments.fileUploadId, id)).limit(10);
      if (user.userType === "enterprise_user") {
        const downloadableDocument = relatedDocuments.find(
          (document) =>
            document.enterpriseId === user.enterpriseId &&
            document.visibility !== "internal" &&
            (document.status === "approved" || document.status === "archived"),
        );
        if (!downloadableDocument) {
          return Response.json({ error: "当前企业账号无权下载该文件，或文件尚未审核通过。" }, { status: 403 });
        }
      }

      const bucket = (env as FilesEnv).FILES;
      if (!bucket) return Response.json({ error: "文件存储 FILES 未配置，无法下载真实文件。" }, { status: 500 });

      const object = await bucket.get(upload.storageKey);
      if (!object) return Response.json({ error: "文件对象不存在。" }, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Content-Type", upload.mimeType || headers.get("Content-Type") || "application/octet-stream");
      headers.set("Content-Length", String(upload.sizeBytes));
      headers.set("Content-Disposition", contentDisposition(upload.originalFileName));
      headers.set("Cache-Control", "private, max-age=0, no-store");

      await db.insert(auditLogs).values({
        id: makeId("audit"),
        actorType: user.userType,
        actorId: user.id,
        action: "file.downloaded",
        targetType: "file_upload",
        targetId: id,
        metadataJson: JSON.stringify({ productId: upload.productId, orderId: upload.orderId }),
      });

      return new Response(object.body, { headers });
    }

    const requirementsQuery = productId
      ? db.select().from(workflowFileRequirements).where(eq(workflowFileRequirements.productId, productId)).orderBy(asc(workflowFileRequirements.sequence))
      : db.select().from(workflowFileRequirements).orderBy(asc(workflowFileRequirements.productId), asc(workflowFileRequirements.sequence));

    const uploadsQuery = orderId
      ? db.select().from(fileUploads).where(eq(fileUploads.orderId, orderId)).orderBy(desc(fileUploads.uploadedAt))
      : productId
      ? db.select().from(fileUploads).where(eq(fileUploads.productId, productId)).orderBy(desc(fileUploads.uploadedAt))
      : db.select().from(fileUploads).orderBy(desc(fileUploads.uploadedAt)).limit(100);

    const [requirements, uploads] = await Promise.all([requirementsQuery, uploadsQuery]);

    if (user.userType === "enterprise_user") {
      const uploadIds = uploads.map((upload) => upload.id);
      const visibleDocuments = (await db.select().from(businessDocuments).orderBy(desc(businessDocuments.createdAt))).filter(
        (document) =>
          document.enterpriseId === user.enterpriseId &&
          document.fileUploadId &&
          uploadIds.includes(document.fileUploadId) &&
          document.visibility !== "internal",
      );
      const visibleUploadIds = new Set(visibleDocuments.map((document) => document.fileUploadId).filter(Boolean));
      return Response.json({ requirements, uploads: uploads.filter((upload) => visibleUploadIds.has(upload.id)) });
    }

    return Response.json({ requirements, uploads });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    const isManagerUpload = user.userType === "operator_user" && user.role === "manager";
    const isEnterpriseUpload = user.userType === "enterprise_user";
    if (!isManagerUpload && !isEnterpriseUpload) return Response.json({ error: "当前账号无权上传流程文件。" }, { status: 403 });

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
    if (isEnterpriseUpload) {
      if (!order) return badRequest("enterprise upload must be bound to an order");
      if (order.enterpriseId !== user.enterpriseId) return Response.json({ error: "企业账号不能上传其他企业订单文件。" }, { status: 403 });
      if (order.currentStage !== "deposit_payment" || stage !== "预付款" || requiredFileType !== "预付款证明") {
        return Response.json({ error: "企业账号当前只能在预付款阶段上传预付款证明。" }, { status: 403 });
      }
    }
    if (isManagerUpload && order && stage !== ({
      second_confirmation: "二次确认",
      contract: "合同签署",
      deposit_payment: "预付款",
      overseas_purchase: "海外采购",
      international_shipping: "国际运输",
      customs_clearance: "报关清关",
      warehouse_sorting: "入库分拣",
      domestic_delivery: "二段配送",
      signed: "签收",
      settlement: "结算归档",
    } as Record<string, string>)[order.currentStage]) {
      return Response.json({ error: "只能在订单当前阶段上传流程文件。" }, { status: 403 });
    }

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
        buyerVisibility: buyerVisibleStage(stage) ? "visible" : "hidden",
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
      visibility: buyerVisibleStage(stage) ? "buyer_visible_after_review" : "internal",
      createdByUserType: user.userType,
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
    const documentStatus =
      action === "ai_pass" ? "reviewing" : action === "ai_warning" ? "changes_requested" : manualStatus;

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

    if (documentStatus) {
      await db
        .update(businessDocuments)
        .set({
          status: documentStatus,
          reviewedByUserId: action === "approve" || action === "request_changes" || action === "reject" ? user.id : undefined,
          reviewedAt: action === "approve" || action === "request_changes" || action === "reject" ? sql`CURRENT_TIMESTAMP` : undefined,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(businessDocuments.fileUploadId, id));
    }

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
