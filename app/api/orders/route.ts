import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  auditLogs,
  businessDocuments,
  enterprises,
  fileUploads,
  procurementOrderEvents,
  procurementOrders,
  products,
  purchaseIntentions,
} from "../../../db/schema";
import { getCurrentUser } from "../_auth";
import { badRequest, makeId, serverError } from "../_utils";

const workflowStages = [
  "second_confirmation",
  "contract",
  "deposit_payment",
  "overseas_purchase",
  "international_shipping",
  "customs_clearance",
  "warehouse_sorting",
  "domestic_delivery",
  "signed",
  "settlement",
] as const;

type WorkflowStage = (typeof workflowStages)[number];

const stageLabels: Record<WorkflowStage, string> = {
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
};

const stageRequiredDocuments: Record<WorkflowStage, string[]> = {
  second_confirmation: ["最终报价确认单", "企业二次确认回执"],
  contract: ["销售合同", "采购订单"],
  deposit_payment: ["付款通知书", "预付款证明"],
  overseas_purchase: ["海外 PO", "Proforma Invoice", "供应商订单确认", "对外付款证明"],
  international_shipping: ["Booking", "提单", "装柜照片"],
  customs_clearance: ["Commercial Invoice", "Packing List", "报关单", "税单"],
  warehouse_sorting: ["入库单", "分货清单"],
  domestic_delivery: ["二段配送单", "出库单"],
  signed: ["签收单", "回单照片"],
  settlement: ["对账单", "发票", "服务费账单"],
};

type CreateOrderPayload = {
  purchaseIntentionId?: string;
  confirmedUnitCostCny?: number | string;
};

type UpdateOrderPayload = {
  id?: string;
  action?: "advance" | "request_changes" | "mark_exception" | "complete";
  nextStage?: WorkflowStage;
  note?: string;
  confirmedUnitCostCny?: number | string;
  etd?: string;
  eta?: string;
  containerNo?: string;
  sealNo?: string;
  customsDeclarationNo?: string;
  customsBrokerName?: string;
  customsReleaseStatus?: string;
  customsReleasedAt?: string;
  estimatedDutyCny?: number | string;
  estimatedVatCny?: number | string;
  actualTaxPaidCny?: number | string;
  customsInspectionStatus?: string;
  warehouseName?: string;
  warehouseInboundNo?: string;
  warehouseInboundAt?: string;
  receivedBoxes?: number | string;
  damagedBoxes?: number | string;
  shortageBoxes?: number | string;
  sortingBatchNo?: string;
  allocationStatus?: string;
  domesticCarrierName?: string;
  domesticDeliveryNo?: string;
  dispatchAt?: string;
  expectedDeliveryAt?: string;
  deliveryRegion?: string;
  deliveryWarehouseName?: string;
  deliveredBoxes?: number | string;
  deliveryStatus?: string;
  overseasSupplierName?: string;
  overseasPoNo?: string;
  proformaInvoiceNo?: string;
  overseasCurrency?: string;
  overseasAmount?: number | string;
  overseasPaymentStatus?: string;
};

type BusinessDocumentRecord = typeof businessDocuments.$inferSelect;

const approvedDocumentStatuses = new Set(["approved", "archived"]);

function orderNo() {
  return `SPAR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${makeId("").replace("_", "").slice(0, 8).toUpperCase()}`;
}

function nextStageOf(currentStage: string): WorkflowStage | null {
  const currentIndex = workflowStages.indexOf(currentStage as WorkflowStage);
  if (currentIndex < 0 || currentIndex >= workflowStages.length - 1) return null;
  return workflowStages[currentIndex + 1];
}

function progressOfStage(stage: string) {
  const index = workflowStages.indexOf(stage as WorkflowStage);
  if (index < 0) return 0;
  return Math.round(((index + 1) / workflowStages.length) * 100);
}

function stageGate(documents: BusinessDocumentRecord[], stage: WorkflowStage) {
  const label = stageLabels[stage];
  const requiredDocuments = stageRequiredDocuments[stage] ?? [];
  const requiredStatuses = requiredDocuments.map((documentType) => {
    const stageDocuments = documents.filter((document) => document.stage === label && document.documentType === documentType);
    const approvedDocument = stageDocuments.find((document) => approvedDocumentStatuses.has(document.status));
    const latestDocument = stageDocuments[0];
    return {
      documentType,
      status: approvedDocument?.status ?? latestDocument?.status ?? "missing",
      ready: Boolean(approvedDocument),
    };
  });

  return {
    ready: requiredStatuses.every((item) => item.ready),
    requiredStatuses,
    blockedDocuments: requiredStatuses.filter((item) => !item.ready).map((item) => item.documentType),
  };
}

async function createStageDocuments(params: {
  orderId: string;
  orderNo: string;
  productId: string;
  enterpriseId: string;
  purchaseIntentionId: string | null;
  stage: WorkflowStage;
  actorType: string;
  actorId: string;
}) {
  const db = getDb();
  const docs = stageRequiredDocuments[params.stage] ?? [];
  for (const documentType of docs) {
    await db.insert(businessDocuments).values({
      id: makeId("doc"),
      documentNo: `${params.orderNo}-${documentType}-${makeId("").replace("_", "").slice(0, 4).toUpperCase()}`,
      documentType,
      productId: params.productId,
      orderId: params.orderId,
      enterpriseId: params.enterpriseId,
      purchaseIntentionId: params.purchaseIntentionId,
      stage: stageLabels[params.stage],
      title: `${params.orderNo} · ${documentType}`,
      status: "draft",
      visibility: params.stage === "overseas_purchase" || params.stage === "customs_clearance" ? "internal" : "buyer_visible_after_review",
      createdByUserType: params.actorType,
      createdByUserId: params.actorId,
      metadataJson: JSON.stringify({ orderId: params.orderId, orderNo: params.orderNo, stage: params.stage }),
    }).onConflictDoNothing();
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();
    const db = getDb();
    let rows = await db
      .select({
        id: procurementOrders.id,
        orderNo: procurementOrders.orderNo,
        productId: procurementOrders.productId,
        productName: products.cnName,
        enterpriseId: procurementOrders.enterpriseId,
        enterpriseName: enterprises.shortName,
        purchaseIntentionId: procurementOrders.purchaseIntentionId,
        quantityBoxes: procurementOrders.quantityBoxes,
        containerType: procurementOrders.containerType,
        currentStage: procurementOrders.currentStage,
        status: procurementOrders.status,
        confirmedUnitCostCny: procurementOrders.confirmedUnitCostCny,
        totalAmountCny: procurementOrders.totalAmountCny,
        receivingRegion: procurementOrders.receivingRegion,
        expectedArrivalWindow: procurementOrders.expectedArrivalWindow,
        etd: procurementOrders.etd,
        eta: procurementOrders.eta,
        containerNo: procurementOrders.containerNo,
        sealNo: procurementOrders.sealNo,
        customsDeclarationNo: procurementOrders.customsDeclarationNo,
        customsBrokerName: procurementOrders.customsBrokerName,
        customsReleaseStatus: procurementOrders.customsReleaseStatus,
        customsReleasedAt: procurementOrders.customsReleasedAt,
        estimatedDutyCny: procurementOrders.estimatedDutyCny,
        estimatedVatCny: procurementOrders.estimatedVatCny,
        actualTaxPaidCny: procurementOrders.actualTaxPaidCny,
        customsInspectionStatus: procurementOrders.customsInspectionStatus,
        warehouseName: procurementOrders.warehouseName,
        warehouseInboundNo: procurementOrders.warehouseInboundNo,
        warehouseInboundAt: procurementOrders.warehouseInboundAt,
        receivedBoxes: procurementOrders.receivedBoxes,
        damagedBoxes: procurementOrders.damagedBoxes,
        shortageBoxes: procurementOrders.shortageBoxes,
        sortingBatchNo: procurementOrders.sortingBatchNo,
        allocationStatus: procurementOrders.allocationStatus,
        domesticCarrierName: procurementOrders.domesticCarrierName,
        domesticDeliveryNo: procurementOrders.domesticDeliveryNo,
        dispatchAt: procurementOrders.dispatchAt,
        expectedDeliveryAt: procurementOrders.expectedDeliveryAt,
        deliveryRegion: procurementOrders.deliveryRegion,
        deliveryWarehouseName: procurementOrders.deliveryWarehouseName,
        deliveredBoxes: procurementOrders.deliveredBoxes,
        deliveryStatus: procurementOrders.deliveryStatus,
        overseasSupplierName: procurementOrders.overseasSupplierName,
        overseasPoNo: procurementOrders.overseasPoNo,
        proformaInvoiceNo: procurementOrders.proformaInvoiceNo,
        overseasCurrency: procurementOrders.overseasCurrency,
        overseasAmount: procurementOrders.overseasAmount,
        overseasPaymentStatus: procurementOrders.overseasPaymentStatus,
        createdAt: procurementOrders.createdAt,
        updatedAt: procurementOrders.updatedAt,
      })
      .from(procurementOrders)
      .leftJoin(products, eq(procurementOrders.productId, products.id))
      .leftJoin(enterprises, eq(procurementOrders.enterpriseId, enterprises.id))
      .orderBy(desc(procurementOrders.updatedAt))
      .limit(100);

    if (user.userType === "enterprise_user") {
      rows = rows.filter((row) => row.enterpriseId === user.enterpriseId);
    }

    if (id) {
      const order = rows.find((row) => row.id === id);
      if (!order) return Response.json({ error: "采购项目不存在或当前账号无权查看。" }, { status: 404 });

      const [events, documents, uploads] = await Promise.all([
        db.select().from(procurementOrderEvents).where(eq(procurementOrderEvents.orderId, id)).orderBy(desc(procurementOrderEvents.createdAt)),
        db.select().from(businessDocuments).where(eq(businessDocuments.orderId, id)).orderBy(desc(businessDocuments.createdAt)),
        db.select().from(fileUploads).where(eq(fileUploads.orderId, id)).orderBy(desc(fileUploads.uploadedAt)),
      ]);
      const visibleDocuments = user.userType === "enterprise_user" ? documents.filter((document) => document.visibility !== "internal") : documents;
      const visibleUploadIds = new Set(visibleDocuments.map((document) => document.fileUploadId).filter(Boolean));

      return Response.json({
        order: {
          ...order,
          stageLabel: stageLabels[order.currentStage as WorkflowStage] ?? order.currentStage,
          progress: progressOfStage(order.currentStage),
          nextStage: nextStageOf(order.currentStage),
        },
        workflow: workflowStages.map((stage, index) => ({
          stage,
          label: stageLabels[stage],
          requiredDocuments: stageRequiredDocuments[stage],
          progress: Math.round(((index + 1) / workflowStages.length) * 100),
          gate: stageGate(documents, stage),
        })),
        events,
        documents: visibleDocuments,
        uploads: user.userType === "enterprise_user" ? uploads.filter((upload) => visibleUploadIds.has(upload.id)) : uploads,
      });
    }

    return Response.json({
      orders: rows.map((row) => ({
        ...row,
        stageLabel: stageLabels[row.currentStage as WorkflowStage] ?? row.currentStage,
        progress: progressOfStage(row.currentStage),
        nextStage: nextStageOf(row.currentStage),
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
    if (user.userType !== "operator_user" || user.role !== "manager") {
      return Response.json({ error: "只有商品运营经理可以从采购意向生成采购项目。" }, { status: 403 });
    }

    const payload = (await request.json()) as CreateOrderPayload;
    const purchaseIntentionId = payload.purchaseIntentionId?.trim() ?? "";
    if (!purchaseIntentionId) return badRequest("purchaseIntentionId is required");

    const db = getDb();
    const [intention] = await db.select().from(purchaseIntentions).where(eq(purchaseIntentions.id, purchaseIntentionId)).limit(1);
    if (!intention) return badRequest("purchase intention does not exist");
    if (intention.status !== "confirmed") {
      return badRequest("purchase intention must be confirmed before creating order");
    }

    const [product] = await db.select().from(products).where(eq(products.id, intention.productId)).limit(1);
    if (!product) return badRequest("product does not exist");

    const unitCost = payload.confirmedUnitCostCny === undefined || payload.confirmedUnitCostCny === "" ? product.estimatedLandedCostCny : Number(payload.confirmedUnitCostCny);
    if (!Number.isFinite(unitCost) || unitCost <= 0) return badRequest("confirmedUnitCostCny must be a positive number");

    const id = makeId("ord");
    const no = orderNo();
    const [order] = await db
      .insert(procurementOrders)
      .values({
        id,
        orderNo: no,
        productId: intention.productId,
        enterpriseId: intention.enterpriseId,
        purchaseIntentionId: intention.id,
        quantityBoxes: intention.quantityBoxes,
        currentStage: "second_confirmation",
        status: "second_confirmation",
        confirmedUnitCostCny: unitCost,
        totalAmountCny: Math.round(unitCost * intention.quantityBoxes * 100) / 100,
        receivingRegion: intention.receivingRegion,
        expectedArrivalWindow: intention.expectedArrivalWindow,
        createdByUserId: user.id,
        updatedByUserId: user.id,
      })
      .returning();

    await db.insert(procurementOrderEvents).values({
      id: makeId("evt"),
      orderId: id,
      fromStage: null,
      toStage: "second_confirmation",
      action: "order.created",
      actorType: user.userType,
      actorId: user.id,
      note: "由已确认采购意向生成采购项目。",
      metadataJson: JSON.stringify({ purchaseIntentionId }),
    });

    await db.update(purchaseIntentions).set({ status: "order_created", updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(purchaseIntentions.id, purchaseIntentionId));

    await createStageDocuments({
      orderId: id,
      orderNo: no,
      productId: intention.productId,
      enterpriseId: intention.enterpriseId,
      purchaseIntentionId: intention.id,
      stage: "second_confirmation",
      actorType: user.userType,
      actorId: user.id,
    });

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: user.userType,
      actorId: user.id,
      action: "procurement_order.created",
      targetType: "procurement_order",
      targetId: id,
      metadataJson: JSON.stringify({ orderNo: no, purchaseIntentionId }),
    });

    return Response.json({ order }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以推进采购项目。" }, { status: 403 });

    const payload = (await request.json()) as UpdateOrderPayload;
    const id = payload.id?.trim() ?? "";
    if (!id) return badRequest("id is required");

    const db = getDb();
    const [current] = await db.select().from(procurementOrders).where(eq(procurementOrders.id, id)).limit(1);
    if (!current) return badRequest("order does not exist");

    let nextStage = payload.nextStage ?? nextStageOf(current.currentStage);
    if (payload.action === "complete") nextStage = "settlement";
    if (!nextStage) return badRequest("nextStage is required");
    if (!workflowStages.includes(nextStage)) return badRequest("nextStage is invalid");

    const isApprovalStage = nextStage === "contract" || nextStage === "settlement";
    if (isApprovalStage && user.role !== "director") {
      return Response.json({ error: "合同和结算节点必须由总监推进。" }, { status: 403 });
    }
    if (!isApprovalStage && user.role !== "manager") {
      return Response.json({ error: "该履约节点必须由商品运营经理推进。" }, { status: 403 });
    }
    if (payload.overseasAmount !== undefined && payload.overseasAmount !== "" && !Number.isFinite(Number(payload.overseasAmount))) {
      return badRequest("overseasAmount must be a number");
    }
    if (payload.estimatedDutyCny !== undefined && payload.estimatedDutyCny !== "" && !Number.isFinite(Number(payload.estimatedDutyCny))) {
      return badRequest("estimatedDutyCny must be a number");
    }
    if (payload.estimatedVatCny !== undefined && payload.estimatedVatCny !== "" && !Number.isFinite(Number(payload.estimatedVatCny))) {
      return badRequest("estimatedVatCny must be a number");
    }
    if (payload.actualTaxPaidCny !== undefined && payload.actualTaxPaidCny !== "" && !Number.isFinite(Number(payload.actualTaxPaidCny))) {
      return badRequest("actualTaxPaidCny must be a number");
    }
    if (payload.receivedBoxes !== undefined && payload.receivedBoxes !== "" && (!Number.isInteger(Number(payload.receivedBoxes)) || Number(payload.receivedBoxes) < 0)) {
      return badRequest("receivedBoxes must be a non-negative integer");
    }
    if (payload.damagedBoxes !== undefined && payload.damagedBoxes !== "" && (!Number.isInteger(Number(payload.damagedBoxes)) || Number(payload.damagedBoxes) < 0)) {
      return badRequest("damagedBoxes must be a non-negative integer");
    }
    if (payload.shortageBoxes !== undefined && payload.shortageBoxes !== "" && (!Number.isInteger(Number(payload.shortageBoxes)) || Number(payload.shortageBoxes) < 0)) {
      return badRequest("shortageBoxes must be a non-negative integer");
    }
    if (payload.deliveredBoxes !== undefined && payload.deliveredBoxes !== "" && (!Number.isInteger(Number(payload.deliveredBoxes)) || Number(payload.deliveredBoxes) < 0)) {
      return badRequest("deliveredBoxes must be a non-negative integer");
    }

    if (payload.action !== "mark_exception" && payload.action !== "request_changes") {
      const currentStage = current.currentStage as WorkflowStage;
      const currentStageDocuments = await db.select().from(businessDocuments).where(eq(businessDocuments.orderId, id)).orderBy(desc(businessDocuments.createdAt));
      const gate = stageGate(currentStageDocuments, currentStage);
      if (!gate.ready) {
        return Response.json(
          {
            error: `当前阶段「${stageLabels[currentStage]}」仍有必备单据未通过复核：${gate.blockedDocuments.join("、")}`,
            blockedDocuments: gate.blockedDocuments,
            gate,
          },
          { status: 409 },
        );
      }
    }

    const [order] = await db
      .update(procurementOrders)
      .set({
        currentStage: nextStage,
        status: payload.action === "mark_exception" ? "exception" : nextStage,
        confirmedUnitCostCny: payload.confirmedUnitCostCny === undefined || payload.confirmedUnitCostCny === "" ? current.confirmedUnitCostCny : Number(payload.confirmedUnitCostCny),
        totalAmountCny:
          payload.confirmedUnitCostCny === undefined || payload.confirmedUnitCostCny === ""
            ? current.totalAmountCny
            : Math.round(Number(payload.confirmedUnitCostCny) * current.quantityBoxes * 100) / 100,
        etd: payload.etd?.trim() || current.etd,
        eta: payload.eta?.trim() || current.eta,
        containerNo: payload.containerNo?.trim() || current.containerNo,
        sealNo: payload.sealNo?.trim() || current.sealNo,
        customsDeclarationNo: payload.customsDeclarationNo?.trim() || current.customsDeclarationNo,
        customsBrokerName: payload.customsBrokerName?.trim() || current.customsBrokerName,
        customsReleaseStatus: payload.customsReleaseStatus?.trim() || current.customsReleaseStatus,
        customsReleasedAt: payload.customsReleasedAt?.trim() || current.customsReleasedAt,
        estimatedDutyCny: payload.estimatedDutyCny === undefined || payload.estimatedDutyCny === "" ? current.estimatedDutyCny : Number(payload.estimatedDutyCny),
        estimatedVatCny: payload.estimatedVatCny === undefined || payload.estimatedVatCny === "" ? current.estimatedVatCny : Number(payload.estimatedVatCny),
        actualTaxPaidCny: payload.actualTaxPaidCny === undefined || payload.actualTaxPaidCny === "" ? current.actualTaxPaidCny : Number(payload.actualTaxPaidCny),
        customsInspectionStatus: payload.customsInspectionStatus?.trim() || current.customsInspectionStatus,
        warehouseName: payload.warehouseName?.trim() || current.warehouseName,
        warehouseInboundNo: payload.warehouseInboundNo?.trim() || current.warehouseInboundNo,
        warehouseInboundAt: payload.warehouseInboundAt?.trim() || current.warehouseInboundAt,
        receivedBoxes: payload.receivedBoxes === undefined || payload.receivedBoxes === "" ? current.receivedBoxes : Number(payload.receivedBoxes),
        damagedBoxes: payload.damagedBoxes === undefined || payload.damagedBoxes === "" ? current.damagedBoxes : Number(payload.damagedBoxes),
        shortageBoxes: payload.shortageBoxes === undefined || payload.shortageBoxes === "" ? current.shortageBoxes : Number(payload.shortageBoxes),
        sortingBatchNo: payload.sortingBatchNo?.trim() || current.sortingBatchNo,
        allocationStatus: payload.allocationStatus?.trim() || current.allocationStatus,
        domesticCarrierName: payload.domesticCarrierName?.trim() || current.domesticCarrierName,
        domesticDeliveryNo: payload.domesticDeliveryNo?.trim() || current.domesticDeliveryNo,
        dispatchAt: payload.dispatchAt?.trim() || current.dispatchAt,
        expectedDeliveryAt: payload.expectedDeliveryAt?.trim() || current.expectedDeliveryAt,
        deliveryRegion: payload.deliveryRegion?.trim() || current.deliveryRegion,
        deliveryWarehouseName: payload.deliveryWarehouseName?.trim() || current.deliveryWarehouseName,
        deliveredBoxes: payload.deliveredBoxes === undefined || payload.deliveredBoxes === "" ? current.deliveredBoxes : Number(payload.deliveredBoxes),
        deliveryStatus: payload.deliveryStatus?.trim() || current.deliveryStatus,
        overseasSupplierName: payload.overseasSupplierName?.trim() || current.overseasSupplierName,
        overseasPoNo: payload.overseasPoNo?.trim() || current.overseasPoNo,
        proformaInvoiceNo: payload.proformaInvoiceNo?.trim() || current.proformaInvoiceNo,
        overseasCurrency: payload.overseasCurrency?.trim() || current.overseasCurrency,
        overseasAmount: payload.overseasAmount === undefined || payload.overseasAmount === "" ? current.overseasAmount : Number(payload.overseasAmount),
        overseasPaymentStatus: payload.overseasPaymentStatus?.trim() || current.overseasPaymentStatus,
        updatedByUserId: user.id,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(procurementOrders.id, id))
      .returning();

    await db.insert(procurementOrderEvents).values({
      id: makeId("evt"),
      orderId: id,
      fromStage: current.currentStage,
      toStage: nextStage,
      action: payload.action ?? "advance",
      actorType: user.userType,
      actorId: user.id,
      note: payload.note?.trim() ?? "",
      metadataJson: JSON.stringify({
        etd: payload.etd,
        eta: payload.eta,
        containerNo: payload.containerNo,
        sealNo: payload.sealNo,
        customsDeclarationNo: payload.customsDeclarationNo,
        customsBrokerName: payload.customsBrokerName,
        customsReleaseStatus: payload.customsReleaseStatus,
        customsReleasedAt: payload.customsReleasedAt,
        estimatedDutyCny: payload.estimatedDutyCny,
        estimatedVatCny: payload.estimatedVatCny,
        actualTaxPaidCny: payload.actualTaxPaidCny,
        customsInspectionStatus: payload.customsInspectionStatus,
        warehouseName: payload.warehouseName,
        warehouseInboundNo: payload.warehouseInboundNo,
        warehouseInboundAt: payload.warehouseInboundAt,
        receivedBoxes: payload.receivedBoxes,
        damagedBoxes: payload.damagedBoxes,
        shortageBoxes: payload.shortageBoxes,
        sortingBatchNo: payload.sortingBatchNo,
        allocationStatus: payload.allocationStatus,
        domesticCarrierName: payload.domesticCarrierName,
        domesticDeliveryNo: payload.domesticDeliveryNo,
        dispatchAt: payload.dispatchAt,
        expectedDeliveryAt: payload.expectedDeliveryAt,
        deliveryRegion: payload.deliveryRegion,
        deliveryWarehouseName: payload.deliveryWarehouseName,
        deliveredBoxes: payload.deliveredBoxes,
        deliveryStatus: payload.deliveryStatus,
        overseasSupplierName: payload.overseasSupplierName,
        overseasPoNo: payload.overseasPoNo,
        proformaInvoiceNo: payload.proformaInvoiceNo,
        overseasCurrency: payload.overseasCurrency,
        overseasAmount: payload.overseasAmount,
        overseasPaymentStatus: payload.overseasPaymentStatus,
      }),
    });

    await createStageDocuments({
      orderId: id,
      orderNo: current.orderNo,
      productId: current.productId,
      enterpriseId: current.enterpriseId,
      purchaseIntentionId: current.purchaseIntentionId,
      stage: nextStage,
      actorType: user.userType,
      actorId: user.id,
    });

    await db.insert(auditLogs).values({
      id: makeId("audit"),
      actorType: user.userType,
      actorId: user.id,
      action: `procurement_order.${payload.action ?? "advance"}`,
      targetType: "procurement_order",
      targetId: id,
      metadataJson: JSON.stringify({ fromStage: current.currentStage, toStage: nextStage }),
    });

    return Response.json({
      order: {
        ...order,
        stageLabel: stageLabels[order.currentStage as WorkflowStage] ?? order.currentStage,
        progress: progressOfStage(order.currentStage),
        nextStage: nextStageOf(order.currentStage),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
