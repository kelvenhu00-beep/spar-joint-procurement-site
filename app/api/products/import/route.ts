import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { procurementGroups, products } from "../../../../db/schema";
import { badRequest, makeId, serverError } from "../../_utils";
import { getCurrentUser } from "../../_auth";

type ImportProductRow = {
  id?: string;
  cnName?: string;
  brand?: string;
  enName?: string;
  country?: string;
  category?: string;
  spec?: string;
  caseSpec?: string;
  shelfLifeMonths?: string;
  estimatedLandedCostCny?: string;
  retailPriceBand?: string;
  grossMarginBand?: string;
  moqBoxes?: string;
  last12MonthBoxes?: string;
  targetBoxes20ft?: string;
  hsCode?: string;
  storageRequirement?: string;
  imagePath?: string;
};

const headerAliases: Record<keyof ImportProductRow, string[]> = {
  id: ["id", "商品ID", "商品编号"],
  cnName: ["cnName", "商品中文名", "中文品名"],
  brand: ["brand", "品牌"],
  enName: ["enName", "英文品名", "英文名"],
  country: ["country", "国家", "产地"],
  category: ["category", "品类", "分类"],
  spec: ["spec", "规格"],
  caseSpec: ["caseSpec", "箱规", "整箱规格"],
  shelfLifeMonths: ["shelfLifeMonths", "保质期月", "保质期（月）"],
  estimatedLandedCostCny: ["estimatedLandedCostCny", "预估到仓成本", "预估到仓成本（元/箱）"],
  retailPriceBand: ["retailPriceBand", "零售价带"],
  grossMarginBand: ["grossMarginBand", "毛利带"],
  moqBoxes: ["moqBoxes", "MOQ箱数", "MOQ 箱数"],
  last12MonthBoxes: ["last12MonthBoxes", "过去12个月采购箱数"],
  targetBoxes20ft: ["targetBoxes20ft", "20尺柜目标箱数"],
  hsCode: ["hsCode", "HS编码", "HS 编码"],
  storageRequirement: ["storageRequirement", "储存要求"],
  imagePath: ["imagePath", "图片路径"],
};

function parseDelimited(text: string) {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "\"") {
      if (quoted && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(header: string) {
  return header.replace(/^\uFEFF/, "").trim();
}

function rowFromCells(headers: string[], cells: string[]) {
  const row: ImportProductRow = {};
  for (const [field, aliases] of Object.entries(headerAliases) as Array<[keyof ImportProductRow, string[]]>) {
    const index = headers.findIndex((header) => aliases.includes(header));
    if (index >= 0) row[field] = cells[index]?.trim() ?? "";
  }
  return row;
}

function requiredText(row: ImportProductRow, field: keyof ImportProductRow, line: number) {
  const text = row[field]?.trim() ?? "";
  if (!text) throw new Error(`第 ${line} 行缺少 ${field}`);
  return text;
}

function positiveNumber(value: string | undefined, field: string, line: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) throw new Error(`第 ${line} 行 ${field} 必须为正数`);
  return numberValue;
}

function positiveInteger(value: string | undefined, field: string, line: number) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) throw new Error(`第 ${line} 行 ${field} 必须为正整数`);
  return numberValue;
}

async function ensureGroup(productId: string, targetBoxes: number) {
  const db = getDb();
  const [group] = await db.select().from(procurementGroups).where(eq(procurementGroups.productId, productId)).limit(1);
  if (group) {
    await db
      .update(procurementGroups)
      .set({ targetBoxes, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(procurementGroups.id, group.id));
    return;
  }

  await db.insert(procurementGroups).values({
    id: makeId("grp"),
    productId,
    containerType: "20ft",
    targetBoxes,
    currentBoxes: 0,
    status: "collecting",
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    if (user.userType !== "operator_user" || user.role !== "manager") {
      return Response.json({ error: "只有商品运营经理可以导入商品资料。" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("file is required");

    const text = await file.text();
    const table = parseDelimited(text);
    if (table.length < 2) return badRequest("导入文件至少需要表头和一行商品资料");
    const headers = table[0].map(normalizeHeader);
    const db = getDb();
    const imported: string[] = [];
    const updated: string[] = [];
    const errors: string[] = [];

    for (let index = 1; index < table.length; index += 1) {
      const line = index + 1;
      try {
        const row = rowFromCells(headers, table[index]);
        const id = row.id?.trim() || makeId("sku");
        const targetBoxes20ft = positiveInteger(row.targetBoxes20ft, "targetBoxes20ft", line);
        const values = {
          cnName: requiredText(row, "cnName", line),
          brand: requiredText(row, "brand", line),
          enName: requiredText(row, "enName", line),
          country: requiredText(row, "country", line),
          category: requiredText(row, "category", line),
          spec: requiredText(row, "spec", line),
          caseSpec: requiredText(row, "caseSpec", line),
          shelfLifeMonths: positiveInteger(row.shelfLifeMonths, "shelfLifeMonths", line),
          estimatedLandedCostCny: positiveNumber(row.estimatedLandedCostCny, "estimatedLandedCostCny", line),
          retailPriceBand: requiredText(row, "retailPriceBand", line),
          grossMarginBand: requiredText(row, "grossMarginBand", line),
          moqBoxes: positiveInteger(row.moqBoxes, "moqBoxes", line),
          last12MonthBoxes: Number(row.last12MonthBoxes || 0),
          targetBoxes20ft,
          status: "draft",
          authorizationStatus: "pending",
          labelStatus: "pending",
          hsCode: row.hsCode?.trim() || null,
          storageRequirement: row.storageRequirement?.trim() || "常温干燥",
          imagePath: row.imagePath?.trim() || "/product-assets/haribo.png",
        };
        if (!Number.isFinite(values.last12MonthBoxes) || values.last12MonthBoxes < 0) {
          throw new Error(`第 ${line} 行 last12MonthBoxes 必须为非负数`);
        }

        const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
        if (existing) {
          await db
            .update(products)
            .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
            .where(eq(products.id, id));
          updated.push(id);
        } else {
          await db.insert(products).values({ id, ...values });
          imported.push(id);
        }
        await ensureGroup(id, targetBoxes20ft);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `第 ${line} 行导入失败`);
      }
    }

    return Response.json({
      importedCount: imported.length,
      updatedCount: updated.length,
      errorCount: errors.length,
      imported,
      updated,
      errors,
    });
  } catch (error) {
    return serverError(error);
  }
}
