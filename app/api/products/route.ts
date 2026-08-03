import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { procurementGroups, products } from "../../../db/schema";
import { badRequest, makeId, serverError } from "../_utils";
import { getCurrentUser } from "../_auth";

type ProductPayload = {
  id?: string;
  cnName?: string;
  brand?: string;
  enName?: string;
  country?: string;
  category?: string;
  spec?: string;
  caseSpec?: string;
  shelfLifeMonths?: number | string;
  estimatedLandedCostCny?: number | string;
  retailPriceBand?: string;
  grossMarginBand?: string;
  moqBoxes?: number | string;
  last12MonthBoxes?: number | string;
  targetBoxes20ft?: number | string;
  status?: string;
  authorizationStatus?: string;
  labelStatus?: string;
  hsCode?: string;
  storageRequirement?: string;
  imagePath?: string;
};

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(products).orderBy(asc(products.country), asc(products.cnName));
    return Response.json({ products: rows });
  } catch (error) {
    return serverError(error);
  }
}

function requireText(value: string | undefined, field: string) {
  const text = value?.trim() ?? "";
  if (!text) throw new Error(`${field} is required`);
  return text;
}

function requirePositiveNumber(value: number | string | undefined, field: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${field} must be a positive number`);
  }
  return numberValue;
}

function requirePositiveInteger(value: number | string | undefined, field: string) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return numberValue;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以维护商品。" }, { status: 403 });
    if (user.role !== "manager") return Response.json({ error: "只有商品运营经理可以提报商品。" }, { status: 403 });

    const payload = (await request.json()) as ProductPayload;
    const id = payload.id?.trim() || makeId("sku");
    const db = getDb();

    const targetBoxes20ft = requirePositiveInteger(payload.targetBoxes20ft, "targetBoxes20ft");
    const [product] = await db
      .insert(products)
      .values({
        id,
        cnName: requireText(payload.cnName, "cnName"),
        brand: requireText(payload.brand, "brand"),
        enName: requireText(payload.enName, "enName"),
        country: requireText(payload.country, "country"),
        category: requireText(payload.category, "category"),
        spec: requireText(payload.spec, "spec"),
        caseSpec: requireText(payload.caseSpec, "caseSpec"),
        shelfLifeMonths: requirePositiveInteger(payload.shelfLifeMonths, "shelfLifeMonths"),
        estimatedLandedCostCny: requirePositiveNumber(payload.estimatedLandedCostCny, "estimatedLandedCostCny"),
        retailPriceBand: requireText(payload.retailPriceBand, "retailPriceBand"),
        grossMarginBand: requireText(payload.grossMarginBand, "grossMarginBand"),
        moqBoxes: requirePositiveInteger(payload.moqBoxes, "moqBoxes"),
        last12MonthBoxes: Number(payload.last12MonthBoxes ?? 0),
        targetBoxes20ft,
        status: payload.status?.trim() || "draft",
        authorizationStatus: payload.authorizationStatus?.trim() || "pending",
        labelStatus: payload.labelStatus?.trim() || "pending",
        hsCode: payload.hsCode?.trim() || null,
        storageRequirement: payload.storageRequirement?.trim() || "常温干燥",
        imagePath: payload.imagePath?.trim() || "/product-assets/haribo.png",
      })
      .returning();

    await db.insert(procurementGroups).values({
      id: makeId("grp"),
      productId: product.id,
      containerType: "20ft",
      targetBoxes: targetBoxes20ft,
      currentBoxes: 0,
      status: "collecting",
    }).onConflictDoNothing();

    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "product create failed");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user") return Response.json({ error: "只有内部账号可以维护商品。" }, { status: 403 });

    const payload = (await request.json()) as ProductPayload;
    const id = payload.id?.trim() ?? "";
    if (!id) return badRequest("id is required");

    const db = getDb();
    const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing) return badRequest("product does not exist");
    const nextStatus = payload.status?.trim();
    if (nextStatus === "reviewing" && user.role !== "manager") {
      return Response.json({ error: "只有商品运营经理可以提交商品审批。" }, { status: 403 });
    }
    if ((nextStatus === "approved" || nextStatus === "rejected") && user.role !== "director") {
      return Response.json({ error: "只有商品总监可以审批商品。" }, { status: 403 });
    }

    const nextTargetBoxes20ft = payload.targetBoxes20ft === undefined ? existing.targetBoxes20ft : requirePositiveInteger(payload.targetBoxes20ft, "targetBoxes20ft");
    const [product] = await db
      .update(products)
      .set({
        cnName: payload.cnName?.trim() || existing.cnName,
        brand: payload.brand?.trim() || existing.brand,
        enName: payload.enName?.trim() || existing.enName,
        country: payload.country?.trim() || existing.country,
        category: payload.category?.trim() || existing.category,
        spec: payload.spec?.trim() || existing.spec,
        caseSpec: payload.caseSpec?.trim() || existing.caseSpec,
        shelfLifeMonths: payload.shelfLifeMonths === undefined ? existing.shelfLifeMonths : requirePositiveInteger(payload.shelfLifeMonths, "shelfLifeMonths"),
        estimatedLandedCostCny: payload.estimatedLandedCostCny === undefined ? existing.estimatedLandedCostCny : requirePositiveNumber(payload.estimatedLandedCostCny, "estimatedLandedCostCny"),
        retailPriceBand: payload.retailPriceBand?.trim() || existing.retailPriceBand,
        grossMarginBand: payload.grossMarginBand?.trim() || existing.grossMarginBand,
        moqBoxes: payload.moqBoxes === undefined ? existing.moqBoxes : requirePositiveInteger(payload.moqBoxes, "moqBoxes"),
        last12MonthBoxes: payload.last12MonthBoxes === undefined ? existing.last12MonthBoxes : Number(payload.last12MonthBoxes),
        targetBoxes20ft: nextTargetBoxes20ft,
        status: nextStatus || existing.status,
        authorizationStatus: payload.authorizationStatus?.trim() || existing.authorizationStatus,
        labelStatus: payload.labelStatus?.trim() || existing.labelStatus,
        hsCode: payload.hsCode?.trim() || existing.hsCode,
        storageRequirement: payload.storageRequirement?.trim() || existing.storageRequirement,
        imagePath: payload.imagePath?.trim() || existing.imagePath,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(products.id, id))
      .returning();

    const [group] = await db.select().from(procurementGroups).where(eq(procurementGroups.productId, id)).limit(1);
    if (group) {
      await db
        .update(procurementGroups)
        .set({
          targetBoxes: nextTargetBoxes20ft,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(procurementGroups.id, group.id));
    } else {
      await db.insert(procurementGroups).values({
        id: makeId("grp"),
        productId: id,
        containerType: "20ft",
        targetBoxes: nextTargetBoxes20ft,
        currentBoxes: 0,
        status: "collecting",
      });
    }

    return Response.json({ product });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "product update failed");
  }
}
