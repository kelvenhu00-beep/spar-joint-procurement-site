import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";
import { serverError } from "../_utils";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(products).orderBy(asc(products.country), asc(products.cnName));
    return Response.json({ products: rows });
  } catch (error) {
    return serverError(error);
  }
}
