import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  auditLogs,
  businessDocuments,
  enterprises,
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
  overseas_purchase: ["海外 PO", "Proforma Invoice"],
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
};

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
