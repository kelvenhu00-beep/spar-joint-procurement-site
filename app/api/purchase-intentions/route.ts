import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, enterprises, products, purchaseIntentions } from "../../../db/schema";
import { badRequest, makeId, serverError } from "../_utils";

const DEMO_ENTERPRISE_ID = "ent_jiarong";

type PurchaseIntentionPayload = {
  productId?: string;
  quantityBoxes?: number | string;
  receivingRegion?: string;
  expectedArrivalWindow?: string;
  note?: string;
};

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(purchaseIntentions)
      .orderBy(desc(purchaseIntentions.submittedAt))
      .limit(50);

    return Response.json({ purchaseIntentions: rows });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
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
        id: DEMO_ENTERPRISE_ID,
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
        enterpriseId: DEMO_ENTERPRISE_ID,
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
      actorId: "demo-buyer-user",
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
