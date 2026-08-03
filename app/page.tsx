"use client";

import { useEffect, useMemo, useState } from "react";

type View =
  | "login"
  | "dashboard"
  | "catalog"
  | "documents"
  | "aiReview"
  | "procurement"
  | "orderDetail"
  | "progress"
  | "intention"
  | "intentionAdmin"
  | "detail"
  | "clients"
  | "reports"
  | "messages"
  | "help";

type Portal = "buyer" | "operator";
type OperatorRole = "manager" | "director";

type NavItem = { label: string; view: View; icon: string; badge?: string; dividerBefore?: boolean };
type UserProfile = {
  name: string;
  shortName: string;
  organization: string;
  role: string;
  userName: string;
  userInitial: string;
  authority: string;
};

type AuthUser = {
  userType: "enterprise_user" | "operator_user";
  id: string;
  name: string;
  email: string;
  role: string;
  enterpriseId?: string;
};

type Product = {
  id: string;
  cnName: string;
  brand: string;
  enName: string;
  country: string;
  flag: string;
  category: string;
  spec: string;
  caseSpec: string;
  shelfLife: string;
  price: string;
  priceBand: string;
  gross: string;
  moq: string;
  currentBoxes: number;
  targetBoxes: number;
  last12MonthBoxes: number;
  tags: string[];
  summary: string;
  decisionNote: string;
  image: string;
  status?: string;
  authorizationStatus?: string;
  labelStatus?: string;
  hsCode?: string | null;
  storageRequirement?: string;
};

type ApiProduct = {
  id: string;
  cnName: string;
  brand: string;
  enName: string;
  country: string;
  category: string;
  spec: string;
  caseSpec: string;
  shelfLifeMonths: number;
  estimatedLandedCostCny: number;
  retailPriceBand: string;
  grossMarginBand: string;
  moqBoxes: number;
  last12MonthBoxes: number;
  targetBoxes20ft: number;
  status: string;
  authorizationStatus: string;
  labelStatus: string;
  hsCode: string | null;
  storageRequirement: string;
  imagePath: string;
};

type PurchaseIntentionRow = {
  id: string;
  productId: string;
  productName: string | null;
  enterpriseId: string;
  enterpriseName: string | null;
  quantityBoxes: number;
  receivingRegion: string;
  expectedArrivalWindow: string;
  note: string;
  status: string;
  submittedAt: string;
};

type FileUploadRow = {
  id: string;
  requirementId: string;
  productId: string;
  orderId: string | null;
  businessNo: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  aiReviewStatus: string;
  aiReviewSummary: string | null;
  manualReviewStatus: string;
  uploadedByUserId: string;
  uploadedAt: string;
};

type BusinessDocumentRow = {
  id: string;
  documentNo: string;
  documentType: string;
  productId: string | null;
  productName: string | null;
  orderId: string | null;
  enterpriseId: string | null;
  enterpriseName: string | null;
  purchaseIntentionId: string | null;
  fileUploadId: string | null;
  stage: string;
  title: string;
  status: string;
  visibility: string;
  amountCny: number | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProcurementOrderRow = {
  id: string;
  orderNo: string;
  productId: string;
  productName: string | null;
  enterpriseId: string;
  enterpriseName: string | null;
  purchaseIntentionId: string | null;
  quantityBoxes: number;
  containerType: string;
  currentStage: string;
  stageLabel: string;
  status: string;
  progress: number;
  nextStage: string | null;
  confirmedUnitCostCny: number | null;
  totalAmountCny: number | null;
  receivingRegion: string;
  expectedArrivalWindow: string;
  etd: string | null;
  eta: string | null;
  containerNo: string | null;
  sealNo: string | null;
  customsDeclarationNo: string | null;
  customsBrokerName: string | null;
  customsReleaseStatus: string | null;
  customsReleasedAt: string | null;
  estimatedDutyCny: number | null;
  estimatedVatCny: number | null;
  actualTaxPaidCny: number | null;
  customsInspectionStatus: string | null;
  overseasSupplierName: string | null;
  overseasPoNo: string | null;
  proformaInvoiceNo: string | null;
  overseasCurrency: string | null;
  overseasAmount: number | null;
  overseasPaymentStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProcurementOrderEventRow = {
  id: string;
  orderId: string;
  fromStage: string | null;
  toStage: string;
  action: string;
  actorType: string;
  actorId: string;
  note: string;
  metadataJson: string;
  createdAt: string;
};

type OrderWorkflowStage = {
  stage: string;
  label: string;
  requiredDocuments: string[];
  progress: number;
  gate: {
    ready: boolean;
    blockedDocuments: string[];
    requiredStatuses: Array<{
      documentType: string;
      status: string;
      ready: boolean;
    }>;
  };
};

type AccountListRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  enterpriseId?: string;
  hasPassword: boolean;
};

function countryFlag(country: string) {
  const flags: Record<string, string> = {
    德国: "🇩🇪",
    奥地利: "🇦🇹",
    英国: "🇬🇧",
    意大利: "🇮🇹",
    法国: "🇫🇷",
    西班牙: "🇪🇸",
    荷兰: "🇳🇱",
  };
  return flags[country] ?? "🏷";
}

function productFromApi(row: ApiProduct): Product {
  return {
    id: row.id,
    cnName: row.cnName,
    brand: row.brand,
    enName: row.enName,
    country: row.country,
    flag: countryFlag(row.country),
    category: row.category,
    spec: row.spec,
    caseSpec: row.caseSpec,
    shelfLife: `${row.shelfLifeMonths} 个月`,
    price: `¥ ${row.estimatedLandedCostCny.toFixed(2)} / 箱`,
    priceBand: row.retailPriceBand,
    gross: row.grossMarginBand,
    moq: `MOQ ${row.moqBoxes} 箱起订`,
    currentBoxes: 0,
    targetBoxes: row.targetBoxes20ft,
    last12MonthBoxes: row.last12MonthBoxes,
    tags: [row.country, row.category, row.status],
    summary: `${row.brand} · ${row.enName}，规格 ${row.spec}，箱规 ${row.caseSpec}。`,
    decisionNote: `状态：${row.status}；授权：${row.authorizationStatus}；中文标签：${row.labelStatus}。`,
    image: row.imagePath,
    status: row.status,
    authorizationStatus: row.authorizationStatus,
    labelStatus: row.labelStatus,
    hsCode: row.hsCode,
    storageRequirement: row.storageRequirement,
  };
}

const products: Product[] = [
  {
    id: "haribo-goldbears-175g",
    cnName: "HARIBO 哈瑞宝金熊软糖",
    brand: "HARIBO",
    enName: "Goldbears 175g",
    country: "德国",
    flag: "🇩🇪",
    category: "糖果",
    spec: "175g*30袋/箱",
    caseSpec: "30 袋 / 箱",
    shelfLife: "18 个月",
    price: "¥ 178.50 / 箱",
    priceBand: "RMB 19.90-26.90 / 袋",
    gross: "26%~36%",
    moq: "MOQ 8 箱起订",
    currentBoxes: 2110,
    targetBoxes: 2600,
    last12MonthBoxes: 12860,
    tags: ["德国", "糖果"],
    summary: "消费者第一眼能识别彩色软糖和儿童零食场景，适合用来提升进口糖果区活跃度。",
    decisionNote: "适合亲子客群、节庆糖果、收银台附近陈列；正式推进前需要确认进口授权。",
    image: "/product-assets/haribo.png",
  },
  {
    id: "manner-neapolitan-75g",
    cnName: "Manner 曼纳威化饼干",
    brand: "Manner",
    enName: "Original Neapolitan Wafers 75g",
    country: "奥地利",
    flag: "🇦🇹",
    category: "威化饼干",
    spec: "75g*24盒/箱",
    caseSpec: "24 盒 / 箱",
    shelfLife: "12 个月",
    price: "¥ 107.60 / 箱",
    priceBand: "RMB 9.90-13.90 / 包",
    gross: "28%~38%",
    moq: "MOQ 10 箱起订",
    currentBoxes: 3820,
    targetBoxes: 4600,
    last12MonthBoxes: 18640,
    tags: ["奥地利", "威化饼干"],
    summary: "粉色包装和奥地利威化身份能快速形成记忆点，适合激发采购对陈列效果的想象。",
    decisionNote: "适合下午茶、女神节、办公室零食、会员日加购等场景，可作为进口零食基础款。",
    image: "/product-assets/manner.png",
  },
  {
    id: "walkers-fingers-250g",
    cnName: "Walker's 沃克斯黄油酥饼",
    brand: "Walker's",
    enName: "Shortbread Fingers 250g",
    country: "英国",
    flag: "🇬🇧",
    category: "饼干",
    spec: "250g*24盒/箱",
    caseSpec: "24 盒 / 箱",
    shelfLife: "15 个月",
    price: "¥ 382.40 / 箱",
    priceBand: "RMB 39.90-49.90 / 袋",
    gross: "22%~32%",
    moq: "MOQ 6 箱起订",
    currentBoxes: 1460,
    targetBoxes: 2100,
    last12MonthBoxes: 9240,
    tags: ["英国", "饼干"],
    summary: "英国黄油酥饼身份清晰，适合提升门店进口食品质感，并承接节庆礼赠需求。",
    decisionNote: "适合精品超市、会员店、办公零食区和下午茶组合陈列，价格带要结合区域客群验证。",
    image: "/product-assets/walkers.png",
  },
  {
    id: "twinings-eb-100ct",
    cnName: "Twinings 川宁伯爵红茶",
    brand: "Twinings",
    enName: "Earl Grey Tea",
    country: "英国",
    flag: "🇬🇧",
    category: "茶叶",
    spec: "50g*6盒/箱",
    caseSpec: "6 盒 / 箱",
    shelfLife: "24 个月",
    price: "¥ 165.30 / 箱",
    priceBand: "RMB 69.90-89.90 / 盒",
    gross: "28%~38%",
    moq: "MOQ 12 箱起订",
    currentBoxes: 980,
    targetBoxes: 2400,
    last12MonthBoxes: 6820,
    tags: ["英国", "茶叶"],
    summary: "标准英式红茶，消费者认知面宽，适合家庭及办公饮用场景。",
    decisionNote: "适合早餐食品区、进口茶饮区和办公室团购场景，需重点确认中文标签资料。",
    image: "/product-assets/twinings.png",
  },
  {
    id: "ritter-milk-100g",
    cnName: "Ritter Sport 瑞特斯波德牛奶巧克力",
    brand: "Ritter Sport",
    enName: "Fine Milk Chocolate 100g",
    country: "德国",
    flag: "🇩🇪",
    category: "巧克力",
    spec: "100g*12块/箱",
    caseSpec: "12 块 / 箱",
    shelfLife: "12 个月",
    price: "¥ 156.00 / 箱",
    priceBand: "RMB 16.90-22.90 / 板",
    gross: "24%~34%",
    moq: "MOQ 10 箱起订",
    currentBoxes: 3180,
    targetBoxes: 5200,
    last12MonthBoxes: 15480,
    tags: ["德国", "巧克力"],
    summary: "方形巧克力包装识别强，适合进口巧克力基础陈列和节庆组合。",
    decisionNote: "夏季需要确认温控物流方案，中文标签和剩余保质期要进入采购前核验。",
    image: "/product-assets/ritter-milk.png",
  },
  {
    id: "lavazza-coffee-250g",
    cnName: "Lavazza 拉瓦萨意式浓缩咖啡粉",
    brand: "Lavazza",
    enName: "Espresso Ground Coffee 250g",
    country: "意大利",
    flag: "🇮🇹",
    category: "咖啡",
    spec: "250g*12罐/箱",
    caseSpec: "12 罐 / 箱",
    shelfLife: "18 个月",
    price: "¥ 312.80 / 箱",
    priceBand: "RMB 39.90-49.90 / 罐",
    gross: "25%~35%",
    moq: "MOQ 6 箱起订",
    currentBoxes: 740,
    targetBoxes: 1800,
    last12MonthBoxes: 5360,
    tags: ["意大利", "咖啡"],
    summary: "意式咖啡粉适合家庭咖啡和办公室茶水间场景，能与饼干茶点组合销售。",
    decisionNote: "适合精品超市、会员店和办公消费渠道，重点确认烘焙日期和中文标签。",
    image: "/product-assets/lavazza.png",
  },
  {
    id: "persil-laundry-1-35l",
    cnName: "Persil 宝莹深层洁净洗衣液",
    brand: "Persil",
    enName: "Deep Clean Laundry Liquid",
    country: "德国",
    flag: "🇩🇪",
    category: "洗衣液",
    spec: "1.35L*6瓶/箱",
    caseSpec: "6 瓶 / 箱",
    shelfLife: "36 个月",
    price: "¥ 194.50 / 箱",
    priceBand: "RMB 39.90-59.90 / 瓶",
    gross: "20%~30%",
    moq: "MOQ 8 箱起订",
    currentBoxes: 360,
    targetBoxes: 1500,
    last12MonthBoxes: 3120,
    tags: ["德国", "洗衣液"],
    summary: "进口家庭清洁品适合拉开日化货架层次，家庭装规格有稳定复购属性。",
    decisionNote: "需确认日化进口合规资料、中文标签和外箱破损控制。",
    image: "/product-assets/persil.png",
  },
  {
    id: "nivea-body-400ml",
    cnName: "NIVEA 妮维雅深层滋润身体乳",
    brand: "NIVEA",
    enName: "Rich Nourishing Body Milk 400ml",
    country: "德国",
    flag: "🇩🇪",
    category: "身体乳",
    spec: "400ml*12瓶/箱",
    caseSpec: "12 瓶 / 箱",
    shelfLife: "30 个月",
    price: "¥ 268.60 / 箱",
    priceBand: "RMB 49.90-69.90 / 瓶",
    gross: "22%~32%",
    moq: "MOQ 10 箱起订",
    currentBoxes: 520,
    targetBoxes: 1600,
    last12MonthBoxes: 4280,
    tags: ["德国", "身体乳"],
    summary: "高认知身体护理品牌，适合进口个护区和冬季滋润主题陈列。",
    decisionNote: "需确认化妆品/个护进口资料、标签备案和区域价格体系。",
    image: "/product-assets/nivea.png",
  },
];

const buyerNavItems: NavItem[] = [
  { label: "工作台", view: "dashboard", icon: "⌂" },
  { label: "商品目录", view: "catalog", icon: "▤" },
  { label: "成团进度", view: "progress", icon: "▧" },
  { label: "采购意向", view: "intention", icon: "◇" },
  { label: "合同与单据", view: "documents", icon: "▦" },
  { label: "履约进度", view: "procurement", icon: "▥" },
  { label: "消息中心", view: "messages", icon: "○", badge: "3", dividerBefore: true },
  { label: "帮助中心", view: "help", icon: "?" },
];

const operatorNavItems: NavItem[] = [
  { label: "运营工作台", view: "dashboard", icon: "⌂" },
  { label: "商品资料库", view: "catalog", icon: "▤" },
  { label: "资料文件中心", view: "documents", icon: "▦" },
  { label: "AI 初审队列", view: "aiReview", icon: "◎", badge: "18" },
  { label: "成团管理", view: "progress", icon: "▧" },
  { label: "意向审核", view: "intentionAdmin", icon: "◇" },
  { label: "采购履约", view: "procurement", icon: "▥" },
  { label: "企业客户", view: "clients", icon: "♙" },
  { label: "数据报表", view: "reports", icon: "▣" },
  { label: "消息中心", view: "messages", icon: "○", badge: "3", dividerBefore: true },
  { label: "帮助中心", view: "help", icon: "?" },
];

const buyerProfile: UserProfile = {
  name: "企业采购端",
  shortName: "采购端",
  organization: "广东嘉荣集团",
  role: "食品采购部 · 王经理",
  userName: "王经理",
  userInitial: "W",
  authority: "提交意向、下载本企业文件",
};

const operatorProfiles: Record<OperatorRole, UserProfile> = {
  manager: {
    name: "平台运营后台",
    shortName: "经理端",
    organization: "SPAR 中国供应链",
    role: "商品运营经理 · 刘经理",
    userName: "刘经理",
    userInitial: "L",
    authority: "商品提报、补充资料、提交总监审批",
  },
  director: {
    name: "平台审批后台",
    shortName: "总监端",
    organization: "SPAR 中国供应链",
    role: "商品总监 · 陈总监",
    userName: "陈总监",
    userInitial: "C",
    authority: "审批通过、驳回、要求补充资料",
  },
};

const portalProfiles: Record<Portal, UserProfile> = {
  buyer: {
    ...buyerProfile,
  },
  operator: {
    ...operatorProfiles.manager,
  },
};

function getProfile(portal: Portal, operatorRole: OperatorRole): UserProfile {
  return portal === "operator" ? operatorProfiles[operatorRole] : buyerProfile;
}

const priceTermLabel = "预估到仓成本";
const priceBasisText = "按单品整柜联采模型估算，包含海外供货价、国际运输、进口税费、国内二段物流和平台服务费；不是 FOB/CIF/EXW 的最终成交报价。";
const costItems = [
  ["海外供货价", "品牌方或供应商确认"],
  ["国际运输", "按单品整柜估算"],
  ["进口税费", "系统预估 + 人工复核"],
  ["国内二段物流", "到指定区域仓估算"],
  ["平台服务费", "公开透明拆分"],
  ["最终报价", "二次确认时锁定"],
];

const catalogCategories = ["全部商品", "休闲食品", "饮料冲调", "粮油调味", "个人护理", "家庭清洁", "母婴用品", "宠物用品", "美妆护肤", "保健品", "酒类", "更多⌄"];

const countryTabs = ["全部", "德国", "奥地利", "英国", "意大利"];

const buyerFileItems = [
  ["商品资料包", "Manner 曼纳威化饼干", "已审核", "商品图片、规格、箱规、中文标签状态"],
  ["预估到仓成本说明", "HARIBO 哈瑞宝金熊软糖", "可下载", "供货价、运输、税费、二段物流、服务费摘要"],
  ["采购意向回执", "广东嘉荣集团", "可下载", "120 箱 · 山东区域仓 · 2026 年 Q4"],
  ["二次确认通知书", "Manner 曼纳威化饼干", "待确认", "成团进度 83%，等待企业正式确认"],
  ["企业采购合同", "SPAR20260802001", "待生成", "正式确认后生成合同与销售订单"],
  ["付款通知书", "SPAR20260802001", "待生成", "预付款、尾款和结算节点"],
  ["二段配送单", "山东区域仓", "待上传", "出库后开放下载"],
  ["签收单 / 发票", "广东嘉荣集团", "待上传", "签收和对账完成后开放下载"],
];

const operatorFileItems = [
  ["商品规格书", "Manner 曼纳威化饼干", "AI初审中", "待抽取规格、箱规、保质期、储存条件"],
  ["品牌授权文件", "HARIBO", "待人工复核", "需确认中国区销售权限和有效期"],
  ["供应商报价单", "Ritter Sport", "需补正", "币种和报价有效期缺失"],
  ["Proforma Invoice", "PO20260802001", "已归档", "金额已写入海外采购订单"],
  ["Commercial Invoice", "CUSTOMS20260802001", "待上传", "报关前必传"],
  ["Packing List", "CUSTOMS20260802001", "待上传", "报关前必传"],
  ["提单 / Sea Waybill", "柜号待定", "待上传", "订舱后上传并抽取柜号、船期"],
  ["税单与完税证明", "报关单号待定", "待上传", "清关后归档到财务成本"],
];

const reviewItems = [
  {
    file: "Manner威化_商品规格书_V2.pdf",
    product: "Manner 曼纳威化饼干",
    businessNo: "SKU-MANNER-75G",
    owner: "商品开发",
    stage: "商品建档",
    risk: "中",
    status: "待人工复核",
    extracted: ["规格 75g", "24 盒 / 箱", "保质期 12 个月"],
    issue: "外箱尺寸未识别，需要补录长宽高。",
  },
  {
    file: "HARIBO_品牌授权_2026.pdf",
    product: "HARIBO 哈瑞宝金熊软糖",
    businessNo: "AUTH-HARIBO-CN-2026",
    owner: "供应商对接",
    stage: "授权准入",
    risk: "高",
    status: "需补正",
    extracted: ["品牌 HARIBO", "有效期 2026-12-31", "区域 中国大陆待确认"],
    issue: "授权区域文字不清晰，不能直接开放二次确认。",
  },
  {
    file: "RitterSport_供应商报价单.xlsx",
    product: "Ritter Sport 瑞特斯波德牛奶巧克力",
    businessNo: "QUOTE-RITTER-2026Q4",
    owner: "价格核算",
    stage: "报价测算",
    risk: "中",
    status: "需补正",
    extracted: ["币种 EUR", "单价 1.42", "MOQ 10 箱"],
    issue: "报价有效期缺失，系统不能锁定预估到仓成本版本。",
  },
  {
    file: "PI_PO20260802001_Manner.pdf",
    product: "Manner 曼纳威化饼干",
    businessNo: "PO20260802001",
    owner: "财务结算",
    stage: "海外采购",
    risk: "低",
    status: "待人工复核",
    extracted: ["总金额 EUR 8,640", "付款条件 30% 预付", "供应商 Manner"],
    issue: "金额与付款申请一致，等待财务确认。",
  },
];

const workflowStages = [
  ["商品建档", "上传商品图、规格书、授权、中文标签资料"],
  ["AI 初审", "识别文件类型，抽取字段，提示缺失和冲突"],
  ["人工复核", "商品、关务、财务、法务按职责确认"],
  ["企业下载", "审核通过后开放商品资料、合同、付款和交付文件"],
  ["业务推进", "二次确认、采购、报关、入库、配送、结算"],
];

const productFlowFiles = [
  {
    stage: "商品建档",
    timing: "上架前",
    owner: "商品开发 / 关务",
    files: ["商品图片", "规格书", "外箱图", "中文标签资料", "授权文件"],
    status: "已审核",
    buyerStatus: "可下载",
    note: "决定企业是否愿意进一步看这个商品。",
  },
  {
    stage: "报价与成本测算",
    timing: "展示预估到仓成本前",
    owner: "价格核算 / 物流 / 关务",
    files: ["供应商报价单", "运费报价", "税费测算依据", "成本拆解表"],
    status: "已审核",
    buyerStatus: "可下载",
    note: "成本文件已复核后，采购端才展示预估到仓成本。",
  },
  {
    stage: "企业意向与成团",
    timing: "企业提交意向后",
    owner: "订单运营 / 企业采购",
    files: ["采购意向回执", "企业补充说明", "成团汇总表"],
    status: "经理补资料中",
    buyerStatus: "状态可见",
    note: "只绑定当前商品和当前企业意向，不展示其他企业明细。",
  },
  {
    stage: "二次确认",
    timing: "达到 20 尺柜后",
    owner: "订单运营 / 法务 / 财务",
    files: ["最终报价确认单", "交期确认单", "合同条款清单", "企业确认回执"],
    status: "待总监审批",
    buyerStatus: "待生成",
    note: "意向转正式订单的分界点。",
  },
  {
    stage: "海外采购",
    timing: "企业正式确认后",
    owner: "供应商对接 / 财务",
    files: ["海外 PO", "PI", "供应商订单确认", "对外付款证明"],
    status: "未到节点",
    buyerStatus: "后台处理",
    note: "后台可见，企业只看采购状态。",
  },
  {
    stage: "国际运输",
    timing: "订舱和装柜时",
    owner: "物流履约",
    files: ["Booking", "VGM", "装柜照片", "封条照片", "提单"],
    status: "未到节点",
    buyerStatus: "状态可见",
    note: "运输文件必须绑定柜号、船期和提单号。",
  },
  {
    stage: "报关清关",
    timing: "到港前后",
    owner: "关务 / 报关行 / 财务",
    files: ["Commercial Invoice", "Packing List", "合同", "原产地证", "税单", "放行通知"],
    status: "未到节点",
    buyerStatus: "状态可见",
    note: "报关资料不在总入口随便上传，必须绑定报关批次。",
  },
  {
    stage: "国内入库与分拣",
    timing: "放行提货后",
    owner: "仓库 / 物流",
    files: ["入库单", "验收单", "破损短少照片", "分货清单"],
    status: "未到节点",
    buyerStatus: "待生成",
    note: "分货清单按企业订单生成。",
  },
  {
    stage: "二段配送与签收",
    timing: "分拣出库后",
    owner: "物流 / 企业",
    files: ["出库单", "二段配送单", "签收单", "回单照片"],
    status: "未到节点",
    buyerStatus: "待生成",
    note: "企业端只下载自身配送和签收文件。",
  },
  {
    stage: "对账结算",
    timing: "企业签收后",
    owner: "财务",
    files: ["对账单", "平台服务费账单", "发票", "差额调整单"],
    status: "未到节点",
    buyerStatus: "待生成",
    note: "费用归集完成后才能开放对账。",
  },
];

function progressOf(product: Product) {
  return Math.round((product.currentBoxes / product.targetBoxes) * 100);
}

function canDownloadStatus(status: string) {
  return status === "可下载" || status === "已审核";
}

function fileDownloadUrl(id: string) {
  return `/api/files/?id=${encodeURIComponent(id)}&download=1`;
}

function openFileDownload(id: string) {
  window.open(fileDownloadUrl(id), "_blank", "noopener,noreferrer");
}

function decisionInfoRows(product: Product) {
  const coldChain = product.category.includes("巧克力") || product.category.includes("身体乳");
  return [
    ["授权状态", product.brand === "HARIBO" ? "待补授权区域" : "销售授权已审核"],
    ["中文标签状态", "中文标签初版已复核"],
    ["HS 编码", product.category.includes("洗衣液") ? "3402.50" : product.category.includes("身体乳") ? "3304.99" : "1905 / 1806 待关务复核"],
    ["税费口径", "系统预估 + 人工复核"],
    ["剩余保质期", `不少于 ${product.shelfLife.replace(" 个月", "")} 个月的 70%`],
    ["外箱尺寸", product.caseSpec.includes("24") ? "395×285×215 mm" : "待供应商确认"],
    ["装柜依据", "按单品 20 尺柜箱数测算"],
    ["储运要求", coldChain ? "避光控温，夏季需温控方案" : "常温干燥，避免挤压"],
    ["成本版本有效期", "2026-09-30"],
    ["建议零售价", product.priceBand],
    ["预计交期", "二次确认后 45-60 天"],
    ["供应商资质", "已建档，待年度复核"],
  ];
}

function AppShell({
  activeView,
  setView,
  portal,
  operatorRole,
  onLogout,
  operationNotice,
  onOperation,
  children,
}: {
  activeView: View;
  setView: (view: View) => void;
  portal: Portal;
  operatorRole: OperatorRole;
  onLogout: () => void;
  operationNotice: string;
  onOperation: (message: string) => void;
  children: React.ReactNode;
}) {
  const navView = activeView === "detail" ? "catalog" : activeView;
  const navItems = portal === "buyer" ? buyerNavItems : operatorNavItems;
  const profile = getProfile(portal, operatorRole);
  const handleButtonFeedback = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const button = target.closest("button");
    if (!button || button.disabled) return;
    const label = (button.innerText || button.getAttribute("aria-label") || "操作").replace(/\s+/g, " ").trim();
    if (!label) return;

    if (label.includes("导出")) {
      const csv = "\uFEFF项目,状态,生成时间\nSPAR联采数据导出,已生成," + new Date().toLocaleString("zh-CN");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `spar-export-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      onOperation(`已执行：${label}，文件已生成。`);
      return;
    }

    if (label.includes("下载")) {
      onOperation(`已执行：${label}。如果该文件已审核，会进入下载；未审核文件会保持锁定。`);
      return;
    }

    if (label.includes("筛选") || label.includes("状态") || label.includes("时间") || label.includes("排序") || label.includes("重置")) {
      onOperation(`已执行：${label}。当前页面筛选条件已响应。`);
      return;
    }

    if (label.includes("查看") || label.includes("详情")) {
      onOperation(`已执行：${label}。`);
      return;
    }

    if (label.includes("提交工单")) {
      onOperation("工单已生成：客服团队将在后台消息中心处理。");
      return;
    }

    if (!["退出", "进入采购端", "进入经理端", "进入总监端"].some((text) => label.includes(text))) {
      onOperation(`已执行：${label}`);
    }
  };

  return (
    <div className="app-shell" onClickCapture={handleButtonFeedback}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="spar-mark">
            <span />
          </div>
          <div>
            <strong>SPAR 联采</strong>
            <small>进口商品 B2B 平台</small>
          </div>
        </div>

        <nav className="side-nav" aria-label="主导航">
          {navItems.map((item) => (
            <button
              key={`${item.label}-${item.icon}`}
              className={`${item.dividerBefore ? "with-divider" : ""} ${navView === item.view ? "active" : ""}`}
              type="button"
              onClick={() => setView(item.view)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <b>{item.badge}</b> : null}
            </button>
          ))}
        </nav>

        <div className="company-card">
          <span>{portal === "buyer" ? "当前企业" : "当前组织"}</span>
          <strong>{profile.organization}</strong>
          <small>{profile.role}</small>
          <i>⌄</i>
        </div>
      </aside>

      <section className="workspace">
        <header className="app-topbar">
          <div className="topbar-identity">
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </div>
          <div className="topbar-actions">
            <span className="role-readonly">{profile.authority}</span>
            <button className="icon-button alert" type="button" aria-label="消息" onClick={() => setView("messages")}>
              ♧
              <span>3</span>
            </button>
            <button className="icon-button" type="button" aria-label="帮助" onClick={() => setView("help")}>
              ?
            </button>
            <div className="user-chip">
              <b>{profile.userInitial}</b>
              <span>{profile.userName}</span>
              <em>⌄</em>
            </div>
            <button className="logout-button" type="button" onClick={onLogout}>
              退出
            </button>
          </div>
        </header>
        <main className="page-content">
          {operationNotice ? <div className="global-operation-notice">{operationNotice}</div> : null}
          {children}
        </main>
      </section>
    </div>
  );
}

function ProductImage({ product, size = "card" }: { product: Product; size?: "card" | "thumb" | "wide" | "mini" }) {
  return (
    <div className={`product-image ${size}`}>
      <img src={product.image} alt={product.cnName} />
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [selectedPortal, setSelectedPortal] = useState<Portal>("buyer");
  const [selectedOperatorRole, setSelectedOperatorRole] = useState<OperatorRole>("manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [setupState, setSetupState] = useState<{ checked: boolean; initialized: boolean }>({ checked: false, initialized: true });
  const [setupKey, setSetupKey] = useState("");
  const [setupName, setSetupName] = useState("系统管理员");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const selectedProfile = getProfile(selectedPortal, selectedOperatorRole);

  useEffect(() => {
    fetch("/api/setup/")
      .then(async (response) => {
        const data = (await response.json()) as { initialized?: boolean };
        setSetupState({ checked: true, initialized: Boolean(data.initialized) });
      })
      .catch(() => setSetupState({ checked: true, initialized: true }));
  }, []);

  const submitLogin = async () => {
    setLoginMessage("正在登录...");
    try {
      const response = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portal: selectedPortal, email, password }),
      });
      const data = (await response.json()) as { user?: AuthUser; error?: string };
      if (!response.ok || !data.user) throw new Error(data.error ?? "登录失败");
      setLoginMessage("");
      onLogin(data.user);
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : "登录失败");
    }
  };

  const submitSetup = async () => {
    setLoginMessage("正在初始化管理员...");
    try {
      const response = await fetch("/api/setup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupKey,
          name: setupName,
          email: setupEmail,
          password: setupPassword,
          role: "director",
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "初始化失败");
      setSetupState({ checked: true, initialized: true });
      setSelectedPortal("operator");
      setSelectedOperatorRole("director");
      setEmail(setupEmail);
      setPassword("");
      setLoginMessage("管理员已初始化，请使用刚设置的邮箱和密码登录。");
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : "初始化失败");
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="spar-mark large">
          <span />
        </div>
        <div>
          <strong>SPAR 联采</strong>
          <p>进口商品 B2B 平台</p>
        </div>
      </section>
      <section className="login-card">
        <h1>登录 SPAR 联采系统</h1>
        <p>企业采购端和平台运营后台分离，登录后按角色显示对应功能。</p>
        {setupState.checked && !setupState.initialized ? (
          <div className="setup-panel">
            <strong>首次初始化管理员</strong>
            <span>系统尚未创建管理员账号。请输入部署时配置的初始化密钥，创建第一个总监账号。</span>
            <label><span>初始化密钥</span><input value={setupKey} onChange={(event) => setSetupKey(event.target.value)} type="password" /></label>
            <label><span>管理员姓名</span><input value={setupName} onChange={(event) => setSetupName(event.target.value)} /></label>
            <label><span>管理员邮箱</span><input value={setupEmail} onChange={(event) => setSetupEmail(event.target.value)} /></label>
            <label><span>管理员密码</span><input value={setupPassword} onChange={(event) => setSetupPassword(event.target.value)} type="password" /></label>
            <button className="primary-button full" type="button" onClick={submitSetup}>初始化管理员</button>
          </div>
        ) : null}
        <div className="login-role-tabs">
          <button className={selectedPortal === "buyer" ? "active" : ""} type="button" onClick={() => setSelectedPortal("buyer")}>
            企业采购端
            <span>超市企业采购使用</span>
          </button>
          <button className={selectedPortal === "operator" ? "active" : ""} type="button" onClick={() => setSelectedPortal("operator")}>
            平台运营后台
            <span>SPAR 供应链团队使用</span>
          </button>
        </div>
        {selectedPortal === "operator" ? (
          <div className="login-permission-section">
            <span>内部权限账号</span>
            <div className="login-role-tabs internal">
              <button className={selectedOperatorRole === "manager" ? "active" : ""} type="button" onClick={() => setSelectedOperatorRole("manager")}>
                商品运营经理
                <span>提报、上传资料、提交总监审批</span>
              </button>
              <button className={selectedOperatorRole === "director" ? "active" : ""} type="button" onClick={() => setSelectedOperatorRole("director")}>
                商品总监
                <span>审批、驳回、要求补充资料</span>
              </button>
            </div>
          </div>
        ) : null}
        <div className="login-context">
          <span>当前登录端口</span>
          <strong>{selectedProfile.name}</strong>
          <small>{selectedProfile.organization} · {selectedProfile.role}</small>
          <small>权限：{selectedProfile.authority}</small>
        </div>
        <label>
          <span>账号</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={selectedPortal === "buyer" ? "企业员工账号 / 邮箱" : "运营后台账号 / 邮箱"} />
        </label>
        <label>
          <span>密码</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" type="password" />
        </label>
        <div className="login-options">
          <label>
            <input type="checkbox" /> 记住我
          </label>
          <button type="button">忘记密码?</button>
        </div>
        {loginMessage ? <div className="login-message">{loginMessage}</div> : null}
        <button className="primary-button full" type="button" onClick={submitLogin}>
          进入{selectedProfile.shortName}
        </button>
        <small>
          登录会创建服务端会话，业务接口会按企业账号、经理账号、总监账号分别校验权限。
        </small>
      </section>
      <footer className="login-footer">
        <span>© 2026 SPAR 联采 | 进口商品 B2B 平台</span>
        <span>隐私政策 | 用户协议 | 帮助中心</span>
        <span>简体中文⌄</span>
      </footer>
    </main>
  );
}

function Dashboard({
  portal,
  operatorRole,
  setView,
  setSelectedId,
}: {
  portal: Portal;
  operatorRole: OperatorRole;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const featured = products.slice(0, 3);
  const topProgress = products[1];
  const pct = progressOf(topProgress);
  const isBuyer = portal === "buyer";
  const profile = getProfile(portal, operatorRole);

  return (
    <>
      <section className="dashboard-title">
        <h1>{isBuyer ? "企业采购工作台" : "平台运营工作台"}</h1>
        <p>下午好，{profile.userName} · {profile.name}</p>
      </section>

      <section className="metric-strip">
        {isBuyer ? (
          <>
            <MetricCard icon="▱" label="可采购商品" value="8" hint="德国、奥地利、英国、意大利商品" />
            <MetricCard icon="♙" label="接近成团" value="3" hint="超过 70% 的单品" />
            <MetricCard icon="▰" label="我的意向" value="12" hint="待二次确认 3 个" />
            <MetricCard icon="▦" label="可下载单据" value="18" hint="资料包、回执、合同、付款和发票" />
          </>
        ) : (
          operatorRole === "manager" ? (
            <>
              <MetricCard icon="▱" label="待补资料商品" value="18" hint="缺实物图、外箱图或标签资料" />
              <MetricCard icon="◎" label="AI 待初审" value="24" hint="规格、报价、报关、付款文件" />
              <MetricCard icon="▦" label="已提交审批" value="7" hint="等待商品总监处理" />
              <MetricCard icon="▤" label="接近成团" value="3" hint="需要运营跟进二次确认" />
            </>
          ) : (
            <>
              <MetricCard icon="◇" label="待总监审批" value="12" hint="商品提报、授权和价格节点" />
              <MetricCard icon="!" label="高风险审批" value="4" hint="授权、税费和标签资料待确认" />
              <MetricCard icon="▦" label="已退回补充" value="3" hint="退回经理补资料" />
              <MetricCard icon="▤" label="接近成团" value="3" hint="可发起二次确认审批" />
            </>
          )
        )}
      </section>

      <div className="dashboard-grid">
        <section className="panel hero-panel">
          <div className="panel-head">
            <div>
              <h2>重点单品</h2>
              <p>{isBuyer ? "成团进度高、资料相对完整的商品" : "需要优先维护报价、授权和资料完整度的商品"}</p>
            </div>
            <button className="text-link" type="button" onClick={() => setView("catalog")}>
              {isBuyer ? "查看全部商品" : "进入商品资料库"} ›
            </button>
          </div>

          <div className="featured-grid">
            {featured.map((product) => (
              <article className="product-card" key={product.id}>
                <ProductImage product={product} />
                <TagRow tags={[product.country, product.category]} />
                <h3>{product.cnName}</h3>
                <p>{product.summary}</p>
                <div className="spec-grid">
                  <Spec label="规格" value={product.spec.split("*")[0]} />
                  <Spec label="单位" value={product.caseSpec} />
                  <Spec label="保质期" value={product.shelfLife} />
                </div>
                <PurchaseVolumeSignal product={product} />
                <div className="price-split">
                  <PriceBlock product={product} />
                  <div>
                    <span>预估毛利带</span>
                    <strong>{product.gross}</strong>
                  </div>
                </div>
                <small className="moq">{product.moq}</small>
                <div className="card-actions">
                  <button
                    className="outline-button"
                    type="button"
                    onClick={() => {
                      setSelectedId(product.id);
                      setView("detail");
                    }}
                  >
                    查看详情
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => {
                      setSelectedId(product.id);
                      setView(isBuyer ? "intention" : "detail");
                    }}
                  >
                    {isBuyer ? "提交意向" : "维护资料"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="right-rail">
          <section className="panel progress-focus">
            <div className="panel-head tight">
              <div>
                <span>最高成团进度</span>
                <h2>{topProgress.cnName}</h2>
              </div>
              <button className="text-link" type="button" onClick={() => setView("progress")}>
                查看详情 ›
              </button>
            </div>
            <div className="donut" style={{ "--pct": pct } as React.CSSProperties}>
              <strong>{pct}%</strong>
              <span>当前进度</span>
            </div>
            <ProgressBar value={pct} />
            <small>距离成团目标 {100 - pct}%</small>
            <div className="progress-counts">
              <div>
                <span>已收集</span>
                <strong>{topProgress.currentBoxes.toLocaleString()} 箱</strong>
              </div>
              <div>
                <span>成团目标</span>
                <strong>{topProgress.targetBoxes.toLocaleString()} 箱</strong>
              </div>
            </div>
            <button className="primary-button full" type="button" onClick={() => setView("progress")}>
              进入成团看板
            </button>
          </section>

          <section className="advice-card">
            <strong>{isBuyer ? "采购建议" : "运营建议"}</strong>
            <p>{isBuyer ? "提交基础意向，并要求平台补充实物包装和外箱照片。" : "优先复核接近成团商品的授权、价格口径、HS 编码和物流估算。"}</p>
            <p>{isBuyer ? "下午茶主题、女神节、办公零食、会员日加购。" : "先处理 Manner、HARIBO、Walker's 的二次确认资料。"}</p>
          </section>

          <section className="panel quick-file-card">
            <h2>{isBuyer ? "合同与单据" : "文件处理"}</h2>
            <div className="quick-file-list">
              {(isBuyer ? buyerFileItems.slice(0, 3) : operatorFileItems.slice(0, 3)).map((item) => (
                <button key={`${item[0]}-${item[1]}`} type="button" onClick={() => setView(isBuyer ? "documents" : item[2] === "AI初审中" ? "aiReview" : "documents")}>
                  <span>{item[0]}</span>
                  <strong>{item[2]}</strong>
                  <small>{item[1]}</small>
                </button>
              ))}
            </div>
            <button className="outline-button full" type="button" onClick={() => setView(isBuyer ? "documents" : "aiReview")}>
              {isBuyer ? "进入文件中心" : "进入 AI 初审队列"}
            </button>
          </section>

          <section className="status-card">
            <h2>{isBuyer ? "采购状态" : "后台状态"}</h2>
            <p>{isBuyer ? "当前展示为预估到仓成本，正式采购前需平台二次确认最终报价。" : "商品资料、成本口径、授权资料和成团意向需要分工复核后再开放给企业确认。"}</p>
            <button className="plain-link" type="button" onClick={() => setView(isBuyer ? "procurement" : "intentionAdmin")}>
              去查看 ›
            </button>
          </section>
        </aside>
      </div>

      <section className="panel bundle-panel">
        <div className="panel-head compact">
          <h2>主题组合推荐</h2>
          <p>按消费场景组织商品，提升采购效率</p>
        </div>
        <div className="bundle-grid">
          <Bundle title="欧洲早餐组合" names="Twinings + Walker's + Lavazza" count="共 6 个商品" />
          <Bundle title="儿童糖果引流组合" names="HARIBO + Manner" count="共 4 个商品" />
          <Bundle title="进口零食基础组合" names="Ritter Sport + Manner + Walker's" count="共 5 个商品" />
        </div>
      </section>
    </>
  );
}

function MetricCard({ icon, label, value, hint }: { icon: string; label: string; value: string; hint: string }) {
  return (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{hint}</p>
      </div>
    </article>
  );
}

function Catalog({
  portal,
  operatorRole,
  productCatalog,
  reloadProducts,
  setView,
  setSelectedId,
}: {
  portal: Portal;
  operatorRole: OperatorRole;
  productCatalog: Product[];
  reloadProducts: () => void;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const isBuyer = portal === "buyer";
  const visibleProducts = isBuyer ? productCatalog.filter((product) => product.status === "approved") : productCatalog;
  const [productForm, setProductForm] = useState({
    cnName: "",
    brand: "",
    enName: "",
    country: "德国",
    category: "休闲食品",
    spec: "",
    caseSpec: "",
    shelfLifeMonths: "12",
    estimatedLandedCostCny: "",
    retailPriceBand: "",
    grossMarginBand: "20%~30%",
    moqBoxes: "10",
    last12MonthBoxes: "0",
    targetBoxes20ft: "2000",
    hsCode: "",
    storageRequirement: "常温干燥",
  });
  const [operationMessage, setOperationMessage] = useState("");

  const createProduct = async () => {
    setOperationMessage("正在提交商品资料...");
    try {
      const response = await fetch("/api/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          status: "draft",
          authorizationStatus: "pending",
          labelStatus: "pending",
          imagePath: "/product-assets/haribo.png",
        }),
      });
      const data = (await response.json()) as { product?: ApiProduct; error?: string };
      if (!response.ok || !data.product) throw new Error(data.error ?? "商品新增失败");
      setOperationMessage(`商品已新增为草稿：${data.product.cnName}`);
      setProductForm((current) => ({ ...current, cnName: "", brand: "", enName: "", spec: "", caseSpec: "", estimatedLandedCostCny: "", retailPriceBand: "", hsCode: "" }));
      reloadProducts();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "商品新增失败");
    }
  };

  const updateProductStatus = async (product: Product, status: "reviewing" | "approved" | "rejected") => {
    setOperationMessage("正在更新商品状态...");
    try {
      const response = await fetch("/api/products/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          status,
          authorizationStatus: status === "approved" ? "approved" : product.authorizationStatus,
          labelStatus: status === "approved" ? "complete" : product.labelStatus,
        }),
      });
      const data = (await response.json()) as { product?: ApiProduct; error?: string };
      if (!response.ok || !data.product) throw new Error(data.error ?? "商品状态更新失败");
      setOperationMessage(`商品状态已更新：${data.product.cnName} · ${data.product.status}`);
      reloadProducts();
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "商品状态更新失败");
    }
  };

  return (
    <>
      <section className="catalog-toolbar">
        <h1>{isBuyer ? "商品目录" : "商品资料库"}</h1>
        <div className="catalog-search">
          <input placeholder="请输入商品名称、品牌或关键词" />
          <button className="primary-button" type="button">
            搜索
          </button>
        </div>
      </section>

      {!isBuyer ? (
        <section className="panel product-admin-workflow">
          <div className="panel-head">
            <div>
              <h2>商品提报与审批</h2>
              <p>经理新增商品草稿并提交审核；总监审批通过后，采购端商品目录才可见。</p>
            </div>
            <button className="outline-button" type="button" onClick={reloadProducts}>刷新商品库</button>
          </div>
          <div className="product-create-grid">
            <input placeholder="商品中文名" value={productForm.cnName} onChange={(event) => setProductForm({ ...productForm, cnName: event.target.value })} />
            <input placeholder="品牌" value={productForm.brand} onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })} />
            <input placeholder="英文品名" value={productForm.enName} onChange={(event) => setProductForm({ ...productForm, enName: event.target.value })} />
            <input placeholder="国家" value={productForm.country} onChange={(event) => setProductForm({ ...productForm, country: event.target.value })} />
            <input placeholder="品类" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} />
            <input placeholder="规格，例如 100g*24袋/箱" value={productForm.spec} onChange={(event) => setProductForm({ ...productForm, spec: event.target.value })} />
            <input placeholder="箱规，例如 24 袋 / 箱" value={productForm.caseSpec} onChange={(event) => setProductForm({ ...productForm, caseSpec: event.target.value })} />
            <input placeholder="保质期（月）" value={productForm.shelfLifeMonths} onChange={(event) => setProductForm({ ...productForm, shelfLifeMonths: event.target.value })} />
            <input placeholder="预估到仓成本（元/箱）" value={productForm.estimatedLandedCostCny} onChange={(event) => setProductForm({ ...productForm, estimatedLandedCostCny: event.target.value })} />
            <input placeholder="零售价带，例如 RMB 19.90-26.90 / 袋" value={productForm.retailPriceBand} onChange={(event) => setProductForm({ ...productForm, retailPriceBand: event.target.value })} />
            <input placeholder="毛利带" value={productForm.grossMarginBand} onChange={(event) => setProductForm({ ...productForm, grossMarginBand: event.target.value })} />
            <input placeholder="MOQ 箱数" value={productForm.moqBoxes} onChange={(event) => setProductForm({ ...productForm, moqBoxes: event.target.value })} />
            <input placeholder="过去12个月采购箱数" value={productForm.last12MonthBoxes} onChange={(event) => setProductForm({ ...productForm, last12MonthBoxes: event.target.value })} />
            <input placeholder="20尺柜目标箱数" value={productForm.targetBoxes20ft} onChange={(event) => setProductForm({ ...productForm, targetBoxes20ft: event.target.value })} />
            <input placeholder="HS 编码" value={productForm.hsCode} onChange={(event) => setProductForm({ ...productForm, hsCode: event.target.value })} />
            <input placeholder="储存要求" value={productForm.storageRequirement} onChange={(event) => setProductForm({ ...productForm, storageRequirement: event.target.value })} />
            <button className="primary-button" type="button" onClick={createProduct} disabled={operatorRole !== "manager"}>
              新增商品草稿
            </button>
          </div>
          {operatorRole !== "manager" ? <p className="role-warning">当前为总监账号，只能审批商品，不能代替经理提报商品。</p> : null}
          {operationMessage ? <div className="operation-result">{operationMessage}</div> : null}
        </section>
      ) : null}

      <section className="category-strip">
        {catalogCategories.map((category, index) => (
          <button key={category} className={index === 0 ? "active" : ""} type="button">
            {category}
          </button>
        ))}
        <button type="button">清空筛选</button>
      </section>

      <section className="catalog-layout">
        <aside className="filter-panel">
          <div className="filter-head">
            <h2>筛选条件</h2>
            <button type="button">重置</button>
          </div>
          <FilterGroup title="原产国/地区" items={["全部", "德国", "奥地利", "英国", "意大利"]} />
          <FilterGroup title="品牌" items={["全部", "HARIBO", "Manner", "Walker's", "Twinings", "Ritter Sport"]} hasSearch />
          <div className="filter-block">
            <h3>预估到仓成本区间 (¥/箱)</h3>
            <div className="price-filter">
              <input placeholder="最低价" />
              <span>-</span>
              <input placeholder="最高价" />
              <button type="button">确定</button>
            </div>
          </div>
          <FilterGroup title="MOQ (箱)" items={["全部", "≤ 10 箱", "11-20 箱", "21-50 箱", "> 50 箱"]} />
        </aside>

        <section className="catalog-main">
          <div className="catalog-main-head">
            <span>共 {visibleProducts.length} 个商品</span>
            <div>
              <span>排序:</span>
              <button className="field-button compact" type="button">
                默认排序⌄
              </button>
              <button className="primary-button" type="button">
                ▦ 网格
              </button>
              <button className="outline-button" type="button">
                列表
              </button>
            </div>
          </div>

          <div className="catalog-grid">
            {visibleProducts.map((product) => (
              <article className="catalog-card" key={product.id}>
                <ProductImage product={product} />
                <TagRow tags={[product.country, product.category]} />
                <h2>{product.cnName}</h2>
                <p>{product.spec}</p>
                <PriceBlock product={product} compact />
                <PurchaseVolumeSignal product={product} compact />
                <small>{product.moq} · {isBuyer ? "已开放采购" : `状态：${product.status ?? "draft"}`}</small>
                <div className="catalog-card-actions">
                  <button
                    className="outline-button"
                    type="button"
                    onClick={() => {
                      setSelectedId(product.id);
                      setView("detail");
                    }}
                  >
                    查看详情
                  </button>
                  <button
                    className="primary-button full"
                    type="button"
                    onClick={() => {
                      setSelectedId(product.id);
                      setView(isBuyer ? "intention" : "detail");
                    }}
                  >
                    {isBuyer ? "提交意向" : "维护资料"}
                  </button>
                  {!isBuyer && operatorRole === "manager" && product.status !== "reviewing" && product.status !== "approved" ? (
                    <button className="outline-button full" type="button" onClick={() => updateProductStatus(product, "reviewing")}>提交总监审批</button>
                  ) : null}
                  {!isBuyer && operatorRole === "director" && product.status === "reviewing" ? (
                    <>
                      <button className="primary-button full" type="button" onClick={() => updateProductStatus(product, "approved")}>审批通过并开放</button>
                      <button className="outline-button full" type="button" onClick={() => updateProductStatus(product, "rejected")}>驳回商品</button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <footer className="pagination">
            <span>‹</span>
            <button className="active" type="button">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">4</button>
            <button type="button">5</button>
            <span>…</span>
            <button type="button">63</button>
            <span>›</span>
            <span className="jump-page">跳至 1 页</span>
          </footer>
        </section>
      </section>
    </>
  );
}

function FilterGroup({ title, items, hasSearch = false }: { title: string; items: string[]; hasSearch?: boolean }) {
  return (
    <div className="filter-block">
      <h3>{title}</h3>
      {hasSearch ? <input className="filter-search" placeholder="搜索品牌" /> : null}
      <div className="check-list">
        {items.map((item, index) => (
          <label key={item}>
            <input type="checkbox" defaultChecked={index === 0} />
            {item}
          </label>
        ))}
      </div>
      {items.length > 5 ? <button type="button">展开更多⌄</button> : null}
    </div>
  );
}

function ProcurementProgress({
  portal,
  operatorRole,
  productCatalog,
  setView,
  setSelectedId,
  setSelectedOrderId,
}: {
  portal: Portal;
  operatorRole: OperatorRole;
  productCatalog: Product[];
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
  setSelectedOrderId: (id: string) => void;
}) {
  const isBuyer = portal === "buyer";
  const [orders, setOrders] = useState<ProcurementOrderRow[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [actionState, setActionState] = useState("");

  const loadOrders = () => {
    setLoadState("loading");
    fetch("/api/orders/")
      .then(async (response) => {
        const data = (await response.json()) as { orders?: ProcurementOrderRow[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "采购项目加载失败");
        setOrders(data.orders ?? []);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const createOrderFromConfirmedIntention = async () => {
    setActionState("正在查找已确认采购意向...");
    try {
      const intentionResponse = await fetch("/api/purchase-intentions/");
      const intentionData = (await intentionResponse.json()) as { purchaseIntentions?: PurchaseIntentionRow[]; error?: string };
      if (!intentionResponse.ok) throw new Error(intentionData.error ?? "采购意向加载失败");
      const confirmedIntention = (intentionData.purchaseIntentions ?? []).find((row) => row.status === "confirmed");
      if (!confirmedIntention) {
        setActionState("暂无 confirmed 状态的采购意向。请先由总监在意向审核中审批通过。");
        return;
      }

      const response = await fetch("/api/orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseIntentionId: confirmedIntention.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "采购项目创建失败");
      setActionState("采购项目已生成，系统已自动预留二次确认阶段单据。");
      loadOrders();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "采购项目创建失败");
    }
  };

  const advanceOrder = async (order: ProcurementOrderRow) => {
    if (!order.nextStage) {
      setActionState("该采购项目已经到达最后阶段。");
      return;
    }
    setActionState(`正在推进 ${order.orderNo}...`);
    try {
      const response = await fetch("/api/orders/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          action: "advance",
          nextStage: order.nextStage,
          note: `${operatorRole === "director" ? "总监" : "经理"}在履约看板推进阶段。`,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "阶段推进失败");
      setActionState("阶段已推进，并按新阶段生成需要上传或审核的单据槽位。");
      loadOrders();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "阶段推进失败");
    }
  };

  const inProgressCount = orders.filter((order) => order.status !== "settlement" && order.status !== "exception").length;
  const doneCount = orders.filter((order) => order.status === "settlement").length;
  const exceptionCount = orders.filter((order) => order.status === "exception").length;
  const averageProgress = orders.length ? Math.round(orders.reduce((sum, order) => sum + order.progress, 0) / orders.length) : 0;

  return (
    <>
      <PageTitle
        title={isBuyer ? "我的采购进度" : "采购履约进度"}
        subtitle={isBuyer ? "查看本企业已确认采购项目的履约状态" : "平台内部跟踪采购、运输、报关、分拣和配送状态"}
      />
      <section className="metric-strip procurement-metrics">
        <MetricCard icon="◰" label="进行中项目" value={loadState === "ready" ? String(inProgressCount) : "-"} hint="来自真实采购项目表" />
        <MetricCard icon="☑" label="已完成项目" value={loadState === "ready" ? String(doneCount) : "-"} hint="结算归档阶段" />
        <MetricCard icon="◷" label="按时交付率" value="-" hint="待接入实际 ETA 与签收时间" />
        <MetricCard icon="◴" label="整体完成率" value={loadState === "ready" ? `${averageProgress}%` : "-"} hint="按履约阶段计算" />
        <MetricCard icon="▣" label="采购项目数" value={loadState === "ready" ? String(orders.length) : "-"} hint="当前账号可见范围" />
        <MetricCard icon="!" label="异常项目" value={loadState === "ready" ? String(exceptionCount) : "-"} hint="异常状态项目" />
      </section>
      <section className="progress-tabs">
        <button className="active" type="button">项目总览</button>
        <button type="button" onClick={() => setView("progress")}>柜号视图</button>
        <button type="button">时间线视图</button>
      </section>
      <section className="progress-filter-row">
        <input placeholder="搜索项目名称 / 柜号 / 供应商" />
        <button type="button">全部状态⌄</button>
        <button type="button">全部阶段⌄</button>
        <button type="button">起始日期 - 结束日期</button>
        <button type="button" onClick={loadOrders}>刷新</button>
        {!isBuyer && operatorRole === "manager" ? <button className="primary-button" type="button" onClick={createOrderFromConfirmedIntention}>从已确认意向生成采购项目</button> : null}
      </section>
      {actionState ? <div className="operation-result">{actionState}</div> : null}
      <section className="procurement-layout">
        <div className="panel procurement-table">
          <h2>采购项目列表</h2>
          <div className="data-table procurement">
            <div>项目 / 单号</div>
            <div>采购企业</div>
            <div>当前阶段</div>
            <div>整体进度</div>
            <div>到货窗口</div>
            <div>状态</div>
            <div>操作</div>
            {loadState === "loading" ? <div className="table-state" aria-live="polite">正在加载真实采购项目...</div> : null}
            {loadState === "error" ? <div className="table-state error">采购项目加载失败，请检查登录状态和数据库。</div> : null}
            {loadState === "ready" && orders.length === 0 ? <div className="table-state">暂无真实采购项目。先提交采购意向，由总监审批通过后，经理可在本页生成采购项目。</div> : null}
            {orders.map((order) => (
              <ProcurementRow
                key={order.id}
                order={order}
                product={productCatalog.find((product) => product.id === order.productId)}
                isBuyer={isBuyer}
                operatorRole={operatorRole}
                onAdvance={() => advanceOrder(order)}
                onOrderDetail={() => {
                  setSelectedOrderId(order.id);
                  setView("orderDetail");
                }}
                onDetail={() => {
                  setSelectedId(order.productId);
                  setView("detail");
                }}
              />
            ))}
          </div>
          <footer className="table-footer">共 {orders.length} 条 <span>‹</span><b>1</b><span>›</span><button type="button">10 条/页⌄</button></footer>
        </div>
        <aside className="procurement-side">
          <section className="panel stage-card">
            <h2>阶段说明 <span>共 10 个阶段</span></h2>
            <div className="stage-steps">
              {["二次确认", "合同签署", "预付款", "海外采购", "国际运输", "报关清关", "入库分拣", "二段配送", "签收", "结算归档"].map((step, index) => (
                <div key={step} className={index === 0 ? "active" : ""}>
                  <b>{index + 1}</b>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="panel timeline-card">
            <h2>最新项目状态</h2>
            {orders.slice(0, 5).map((order) => (
              <div className="timeline-item" key={order.id}>
                <time>{order.updatedAt}</time>
                <strong>{order.stageLabel}</strong>
                <span>{order.orderNo} · {order.productName ?? order.productId}</span>
              </div>
            ))}
            {orders.length === 0 ? <p className="empty-note">暂无采购项目时间线。</p> : null}
            <button className="outline-button full" type="button" onClick={loadOrders}>刷新时间线</button>
          </section>
        </aside>
      </section>
    </>
  );
}

function ProcurementRow({
  order,
  product,
  isBuyer,
  operatorRole,
  onAdvance,
  onOrderDetail,
  onDetail,
}: {
  order: ProcurementOrderRow;
  product?: Product;
  isBuyer: boolean;
  operatorRole: OperatorRole;
  onAdvance: () => void;
  onOrderDetail: () => void;
  onDetail: () => void;
}) {
  const percent = order.progress;
  const nextStageNeedsDirector = order.nextStage === "contract" || order.nextStage === "settlement";
  const canAdvance = !isBuyer && Boolean(order.nextStage) && (nextStageNeedsDirector ? operatorRole === "director" : operatorRole === "manager");
  return (
    <>
      <div className="project-cell">
        {product ? <ProductImage product={product} size="mini" /> : <span className="fallback-product-icon">▧</span>}
        <span><strong>{order.productName ?? order.productId}</strong><small>单号：{order.orderNo}</small></span>
      </div>
      <div>{order.enterpriseName ?? order.enterpriseId}</div>
      <div><span className="dot" />{order.stageLabel}<small>{order.containerType} · {order.quantityBoxes} 箱</small></div>
      <div><strong className="green-text">{percent}%</strong><ProgressBar value={percent} /></div>
      <div>{order.expectedArrivalWindow}<small>{order.eta ? `ETA ${order.eta}` : order.receivingRegion}</small></div>
      <div><span className={`status-pill ${order.status === "exception" ? "danger" : order.status === "settlement" ? "done" : ""}`}>{order.status === "exception" ? "异常" : order.status === "settlement" ? "已归档" : "进行中"}</span></div>
      <div>
        <div className="inline-action-group">
          <button className="plain-link inline-action" type="button" onClick={onDetail}>商品</button>
          <button className="plain-link inline-action" type="button" onClick={onOrderDetail}>订单</button>
          {!isBuyer ? <button className="plain-link inline-action" type="button" onClick={onAdvance} disabled={!canAdvance}>{order.nextStage ? "推进" : "完成"}</button> : null}
        </div>
      </div>
    </>
  );
}

function OrderDetailPage({
  orderId,
  portal,
  operatorRole,
  productCatalog,
  setView,
  setSelectedId,
}: {
  orderId: string | null;
  portal: Portal;
  operatorRole: OperatorRole;
  productCatalog: Product[];
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const isBuyer = portal === "buyer";
  const [order, setOrder] = useState<ProcurementOrderRow | null>(null);
  const [workflow, setWorkflow] = useState<OrderWorkflowStage[]>([]);
  const [documents, setDocuments] = useState<BusinessDocumentRow[]>([]);
  const [uploads, setUploads] = useState<FileUploadRow[]>([]);
  const [events, setEvents] = useState<ProcurementOrderEventRow[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [actionState, setActionState] = useState("");
  const [overseasForm, setOverseasForm] = useState({
    overseasSupplierName: "",
    overseasPoNo: "",
    proformaInvoiceNo: "",
    overseasCurrency: "EUR",
    overseasAmount: "",
    overseasPaymentStatus: "待付款",
  });
  const [shippingForm, setShippingForm] = useState({
    containerNo: "",
    sealNo: "",
    etd: "",
    eta: "",
  });
  const [customsForm, setCustomsForm] = useState({
    customsDeclarationNo: "",
    customsBrokerName: "",
    customsReleaseStatus: "资料待提交",
    customsReleasedAt: "",
    estimatedDutyCny: "",
    estimatedVatCny: "",
    actualTaxPaidCny: "",
    customsInspectionStatus: "待判定",
  });

  const loadOrder = () => {
    if (!orderId) {
      setLoadState("error");
      return;
    }
    setLoadState("loading");
    fetch(`/api/orders/?id=${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          order?: ProcurementOrderRow;
          workflow?: OrderWorkflowStage[];
          documents?: BusinessDocumentRow[];
          uploads?: FileUploadRow[];
          events?: ProcurementOrderEventRow[];
          error?: string;
        };
        if (!response.ok || !data.order) throw new Error(data.error ?? "订单详情加载失败");
        setOrder(data.order);
        setWorkflow(data.workflow ?? []);
        setDocuments(data.documents ?? []);
        setUploads(data.uploads ?? []);
        setEvents(data.events ?? []);
        setOverseasForm({
          overseasSupplierName: data.order.overseasSupplierName ?? "",
          overseasPoNo: data.order.overseasPoNo ?? "",
          proformaInvoiceNo: data.order.proformaInvoiceNo ?? "",
          overseasCurrency: data.order.overseasCurrency ?? "EUR",
          overseasAmount: data.order.overseasAmount === null || data.order.overseasAmount === undefined ? "" : String(data.order.overseasAmount),
          overseasPaymentStatus: data.order.overseasPaymentStatus ?? "待付款",
        });
        setShippingForm({
          containerNo: data.order.containerNo ?? "",
          sealNo: data.order.sealNo ?? "",
          etd: data.order.etd ?? "",
          eta: data.order.eta ?? "",
        });
        setCustomsForm({
          customsDeclarationNo: data.order.customsDeclarationNo ?? "",
          customsBrokerName: data.order.customsBrokerName ?? "",
          customsReleaseStatus: data.order.customsReleaseStatus ?? "资料待提交",
          customsReleasedAt: data.order.customsReleasedAt ?? "",
          estimatedDutyCny: data.order.estimatedDutyCny === null || data.order.estimatedDutyCny === undefined ? "" : String(data.order.estimatedDutyCny),
          estimatedVatCny: data.order.estimatedVatCny === null || data.order.estimatedVatCny === undefined ? "" : String(data.order.estimatedVatCny),
          actualTaxPaidCny: data.order.actualTaxPaidCny === null || data.order.actualTaxPaidCny === undefined ? "" : String(data.order.actualTaxPaidCny),
          customsInspectionStatus: data.order.customsInspectionStatus ?? "待判定",
        });
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const reviewFile = async (id: string, action: "ai_pass" | "ai_warning" | "approve" | "request_changes" | "reject") => {
    setActionState("正在处理订单文件...");
    try {
      const response = await fetch("/api/files/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          actorRole: operatorRole,
          summary: action === "approve" ? "总监确认订单阶段文件可归档。" : "按订单详情页处理文件状态。",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "文件处理失败");
      setActionState("订单文件状态已更新。");
      loadOrder();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "文件处理失败");
    }
  };

  const advanceOrderFromDetail = async () => {
    if (!order?.nextStage) {
      setActionState("该采购项目已经到达最后阶段。");
      return;
    }
    setActionState("正在推进订单阶段...");
    try {
      const response = await fetch("/api/orders/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          action: "advance",
          nextStage: order.nextStage,
          note: `${operatorRole === "director" ? "总监" : "经理"}在订单详情页推进阶段。`,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "阶段推进失败");
      setActionState("订单阶段已推进，新阶段文件槽位已生成。");
      loadOrder();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "阶段推进失败");
    }
  };

  const saveOverseasFields = async () => {
    if (!order) return;
    setActionState("正在保存海外采购信息...");
    try {
      const response = await fetch("/api/orders/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          action: "request_changes",
          nextStage: order.currentStage,
          ...overseasForm,
          note: "经理补充海外采购结构化字段。",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "保存失败");
      setActionState("海外采购信息已保存。");
      loadOrder();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "保存失败");
    }
  };

  const saveShippingFields = async () => {
    if (!order) return;
    setActionState("正在保存国际运输信息...");
    try {
      const response = await fetch("/api/orders/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          action: "request_changes",
          nextStage: order.currentStage,
          ...shippingForm,
          note: "经理补充国际运输结构化字段。",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "保存失败");
      setActionState("国际运输信息已保存。");
      loadOrder();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "保存失败");
    }
  };

  const saveCustomsFields = async () => {
    if (!order) return;
    setActionState("正在保存报关清关信息...");
    try {
      const response = await fetch("/api/orders/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          action: "request_changes",
          nextStage: order.currentStage,
          ...customsForm,
          note: "经理补充报关清关结构化字段。",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "保存失败");
      setActionState("报关清关信息已保存。");
      loadOrder();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "保存失败");
    }
  };

  if (loadState === "loading") {
    return <section className="panel order-detail-panel"><h2>正在加载订单详情...</h2></section>;
  }

  if (loadState === "error" || !order) {
    return (
      <>
        <PageTitle title="订单详情" subtitle="当前订单无法加载" />
        <section className="panel order-detail-panel">
          <p>订单不存在、当前账号无权查看，或接口暂时不可用。</p>
          <button className="primary-button" type="button" onClick={() => setView("procurement")}>返回采购履约</button>
        </section>
      </>
    );
  }

  const product = productCatalog.find((item) => item.id === order.productId);
  const currentStage = workflow.find((stage) => stage.stage === order.currentStage);
  const currentGate = currentStage?.gate;
  const nextStageNeedsDirector = order.nextStage === "contract" || order.nextStage === "settlement";
  const canAdvanceByRole = !isBuyer && Boolean(order.nextStage) && (nextStageNeedsDirector ? operatorRole === "director" : operatorRole === "manager");
  const canEditOverseasFields = !isBuyer && operatorRole === "manager" && order.currentStage === "overseas_purchase";
  const canEditShippingFields = !isBuyer && operatorRole === "manager" && order.currentStage === "international_shipping";
  const canEditCustomsFields = !isBuyer && operatorRole === "manager" && order.currentStage === "customs_clearance";

  return (
    <>
      <PageTitle title={order.orderNo} subtitle={`${order.productName ?? order.productId} · ${order.enterpriseName ?? order.enterpriseId} · ${order.stageLabel}`} />
      <section className="order-detail-hero panel">
        <div className="project-cell">
          {product ? <ProductImage product={product} size="thumb" /> : <span className="fallback-product-icon">▧</span>}
          <span>
            <strong>{order.productName ?? order.productId}</strong>
            <small>{order.containerType} · {order.quantityBoxes} 箱 · {order.receivingRegion}</small>
          </span>
        </div>
        <div className="order-kpi-grid">
          <Spec label="当前阶段" value={order.stageLabel} />
          <Spec label="整体进度" value={`${order.progress}%`} />
          <Spec label="确认到仓成本" value={order.confirmedUnitCostCny ? `¥ ${order.confirmedUnitCostCny.toFixed(2)} / 箱` : "待确认"} />
          <Spec label="订单金额" value={order.totalAmountCny ? `¥ ${order.totalAmountCny.toLocaleString()}` : "待确认"} />
          <Spec label="到货窗口" value={order.expectedArrivalWindow} />
          <Spec label="柜号 / 封签" value={`${order.containerNo ?? "待录入"} / ${order.sealNo ?? "待录入"}`} />
        </div>
        <div className="card-actions detail-actions">
          <button className="outline-button" type="button" onClick={() => setView("procurement")}>返回履约列表</button>
          {!isBuyer ? (
            <button className="primary-button" type="button" onClick={advanceOrderFromDetail} disabled={!canAdvanceByRole}>
              {order.nextStage ? "推进下一阶段" : "已到最后阶段"}
            </button>
          ) : null}
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setSelectedId(order.productId);
              setView("detail");
            }}
          >
            查看商品资料
          </button>
        </div>
      </section>

      {actionState ? <div className="operation-result">{actionState}</div> : null}

      <section className={`stage-gate-panel ${currentGate?.ready ? "ready" : "blocked"}`}>
        <div>
          <strong>{currentGate?.ready ? "当前阶段已满足推进条件" : "当前阶段暂不能推进"}</strong>
          <span>
            {currentGate?.ready
              ? "必备单据已通过总监复核或归档。"
              : `仍需通过复核：${currentGate?.blockedDocuments.join("、") || "必备单据"}`}
          </span>
        </div>
        <StatusPill status={currentGate?.ready ? "可推进" : "资料未齐"} />
      </section>

      {order.currentStage === "overseas_purchase" ? (
        <section className="panel overseas-purchase-panel">
          <div className="panel-head">
            <div>
              <h2>海外采购信息</h2>
              <p>记录供应商、PO、PI、币种金额和对外付款状态，作为进入国际运输前的结构化资料。</p>
            </div>
            <StatusPill status={order.overseasPaymentStatus ?? "待补充"} />
          </div>
          <div className="overseas-form-grid">
            <label><span>海外供应商</span><input value={overseasForm.overseasSupplierName} disabled={!canEditOverseasFields} onChange={(event) => setOverseasForm({ ...overseasForm, overseasSupplierName: event.target.value })} /></label>
            <label><span>海外 PO 号</span><input value={overseasForm.overseasPoNo} disabled={!canEditOverseasFields} onChange={(event) => setOverseasForm({ ...overseasForm, overseasPoNo: event.target.value })} /></label>
            <label><span>PI 号</span><input value={overseasForm.proformaInvoiceNo} disabled={!canEditOverseasFields} onChange={(event) => setOverseasForm({ ...overseasForm, proformaInvoiceNo: event.target.value })} /></label>
            <label><span>币种</span><input value={overseasForm.overseasCurrency} disabled={!canEditOverseasFields} onChange={(event) => setOverseasForm({ ...overseasForm, overseasCurrency: event.target.value })} /></label>
            <label><span>海外采购金额</span><input value={overseasForm.overseasAmount} disabled={!canEditOverseasFields} onChange={(event) => setOverseasForm({ ...overseasForm, overseasAmount: event.target.value })} /></label>
            <label><span>对外付款状态</span><input value={overseasForm.overseasPaymentStatus} disabled={!canEditOverseasFields} onChange={(event) => setOverseasForm({ ...overseasForm, overseasPaymentStatus: event.target.value })} /></label>
          </div>
          {canEditOverseasFields ? <button className="primary-button" type="button" onClick={saveOverseasFields}>保存海外采购信息</button> : null}
        </section>
      ) : null}

      {order.currentStage === "international_shipping" ? (
        <section className="panel overseas-purchase-panel shipping-info-panel">
          <div className="panel-head">
            <div>
              <h2>国际运输信息</h2>
              <p>记录 Booking 后的柜号、封签号、ETD 和 ETA，作为进入报关清关前的结构化资料。</p>
            </div>
            <StatusPill status={order.containerNo && order.sealNo ? "运输信息已录入" : "待补充"} />
          </div>
          <div className="overseas-form-grid">
            <label><span>柜号</span><input value={shippingForm.containerNo} disabled={!canEditShippingFields} onChange={(event) => setShippingForm({ ...shippingForm, containerNo: event.target.value })} /></label>
            <label><span>封签号</span><input value={shippingForm.sealNo} disabled={!canEditShippingFields} onChange={(event) => setShippingForm({ ...shippingForm, sealNo: event.target.value })} /></label>
            <label><span>ETD</span><input type="date" value={shippingForm.etd} disabled={!canEditShippingFields} onChange={(event) => setShippingForm({ ...shippingForm, etd: event.target.value })} /></label>
            <label><span>ETA</span><input type="date" value={shippingForm.eta} disabled={!canEditShippingFields} onChange={(event) => setShippingForm({ ...shippingForm, eta: event.target.value })} /></label>
          </div>
          {canEditShippingFields ? <button className="primary-button" type="button" onClick={saveShippingFields}>保存国际运输信息</button> : null}
        </section>
      ) : null}

      {order.currentStage === "customs_clearance" ? (
        <section className="panel overseas-purchase-panel customs-clearance-panel">
          <div className="panel-head">
            <div>
              <h2>报关清关信息</h2>
              <p>记录报关单号、报关行、税费预估、实际缴税和放行状态，作为进入入库分拣前的结构化资料。</p>
            </div>
            <StatusPill status={order.customsReleaseStatus ?? "待补充"} />
          </div>
          <div className="overseas-form-grid">
            <label><span>报关单号</span><input value={customsForm.customsDeclarationNo} disabled={!canEditCustomsFields} onChange={(event) => setCustomsForm({ ...customsForm, customsDeclarationNo: event.target.value })} /></label>
            <label><span>报关行</span><input value={customsForm.customsBrokerName} disabled={!canEditCustomsFields} onChange={(event) => setCustomsForm({ ...customsForm, customsBrokerName: event.target.value })} /></label>
            <label><span>放行状态</span><input value={customsForm.customsReleaseStatus} disabled={!canEditCustomsFields} onChange={(event) => setCustomsForm({ ...customsForm, customsReleaseStatus: event.target.value })} /></label>
            <label><span>放行日期</span><input type="date" value={customsForm.customsReleasedAt} disabled={!canEditCustomsFields} onChange={(event) => setCustomsForm({ ...customsForm, customsReleasedAt: event.target.value })} /></label>
            <label><span>预估关税</span><input value={customsForm.estimatedDutyCny} disabled={!canEditCustomsFields} onChange={(event) => setCustomsForm({ ...customsForm, estimatedDutyCny: event.target.value })} /></label>
            <label><span>预估增值税</span><input value={customsForm.estimatedVatCny} disabled={!canEditCustomsFields} onChange={(event) => setCustomsForm({ ...customsForm, estimatedVatCny: event.target.value })} /></label>
            <label><span>实际缴税金额</span><input value={customsForm.actualTaxPaidCny} disabled={!canEditCustomsFields} onChange={(event) => setCustomsForm({ ...customsForm, actualTaxPaidCny: event.target.value })} /></label>
            <label><span>查验状态</span><input value={customsForm.customsInspectionStatus} disabled={!canEditCustomsFields} onChange={(event) => setCustomsForm({ ...customsForm, customsInspectionStatus: event.target.value })} /></label>
          </div>
          {canEditCustomsFields ? <button className="primary-button" type="button" onClick={saveCustomsFields}>保存报关清关信息</button> : null}
        </section>
      ) : null}

      <section className="order-detail-layout">
        <article className="panel order-stage-panel">
          <div className="panel-head">
            <div>
              <h2>订单阶段文件</h2>
              <p>{currentStage ? `当前节点需要：${currentStage.requiredDocuments.join("、")}` : "按履约节点管理文件和单据"}</p>
            </div>
            <StatusPill status={order.stageLabel} />
          </div>
          <div className="order-stage-list">
            {workflow.map((stage, index) => {
              const stageDocuments = documents.filter((document) => document.stage === stage.label);
              const stageUploadIds = new Set(stageDocuments.map((document) => document.fileUploadId).filter(Boolean));
              const stageUploads = uploads.filter((upload) => stageUploadIds.has(upload.id));
              const canManagerUpload = !isBuyer && operatorRole === "manager" && stage.stage === order.currentStage;
              const canBuyerUploadPaymentProof = isBuyer && stage.stage === order.currentStage && order.currentStage === "deposit_payment";
              const canUpload = canManagerUpload || canBuyerUploadPaymentProof;
              const uploadFileTypes = canBuyerUploadPaymentProof ? ["预付款证明"] : stage.requiredDocuments;
              return (
                <article className={`order-stage-card ${stage.stage === order.currentStage ? "active" : ""}`} key={stage.stage}>
                  <div className="stage-index">{index + 1}</div>
                  <div className="stage-body">
                    <div className="stage-title-line">
                      <div>
                        <h3>{stage.label}</h3>
                        <p>必备文件：{stage.requiredDocuments.join("、")}</p>
                      </div>
                      <StatusPill status={stage.stage === order.currentStage ? "当前节点" : stage.progress < order.progress ? "已生成" : "未到节点"} />
                    </div>
                    <div className="stage-file-tags">
                      {stage.requiredDocuments.map((fileType) => {
                        const matchedDocument = stageDocuments.find((document) => document.documentType === fileType);
                        const gateItem = stage.gate.requiredStatuses.find((item) => item.documentType === fileType);
                        return <span key={fileType}>{fileType} · {gateItem?.status ?? matchedDocument?.status ?? "待上传"}</span>;
                      })}
                    </div>
                    {canUpload ? (
                      <div className="stage-upload-slot">
                        <FileUploadForm
                          product={product ?? productCatalog[0]}
                          order={order}
                          stage={{
                            stage: stage.label,
                            timing: "当前订单节点",
                            owner: canBuyerUploadPaymentProof ? "企业采购" : "商品运营经理",
                            files: uploadFileTypes,
                            status: canBuyerUploadPaymentProof ? "企业待上传" : "经理补资料中",
                            buyerStatus: "状态可见",
                            note: canBuyerUploadPaymentProof ? "企业上传付款证明后，等待平台复核。" : "订单详情页上传，文件会绑定当前采购项目。",
                          }}
                          sequence={index + 1}
                          onUploaded={loadOrder}
                        />
                      </div>
                    ) : null}
                    {stageUploads.length ? (
                      <div className="order-upload-lines">
                        {stageUploads.map((upload) => (
                          <div className="uploaded-file-line" key={upload.id}>
                            <span>{upload.originalFileName}</span>
                            <small>{upload.businessNo} · {Math.round(upload.sizeBytes / 1024)} KB</small>
                            <StatusPill status={upload.manualReviewStatus} />
                            <button className="plain-link inline-action" type="button" onClick={() => openFileDownload(upload.id)}>下载</button>
                            {!isBuyer && operatorRole === "director" ? <button className="plain-link inline-action" type="button" onClick={() => reviewFile(upload.id, "approve")}>复核通过</button> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <aside className="order-side">
          <section className="panel">
            <h2>订单单据</h2>
            {documents.length === 0 ? <p className="empty-note">暂无订单单据。</p> : null}
            {documents.slice(0, 8).map((document) => (
              <div className="checkline" key={document.id}>
                <span>{document.documentType}</span>
                <StatusPill status={document.status} />
              </div>
            ))}
          </section>
          <section className="panel">
            <h2>履约时间线</h2>
            {events.map((event) => (
              <div className="timeline-item" key={event.id}>
                <time>{event.createdAt}</time>
                <strong>{event.action}</strong>
                <span>{event.note || `${event.fromStage ?? "新建"} → ${event.toStage}`}</span>
              </div>
            ))}
          </section>
        </aside>
      </section>
    </>
  );
}

function IntentionAdminPage({
  operatorRole,
  setView,
  setSelectedId,
}: {
  operatorRole: OperatorRole;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const isDirector = operatorRole === "director";
  const [rows, setRows] = useState<PurchaseIntentionRow[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [actionState, setActionState] = useState("");

  const loadIntentions = () => {
    setLoadState("loading");
    fetch("/api/purchase-intentions/")
      .then(async (response) => {
        const data = (await response.json()) as {
          purchaseIntentions?: PurchaseIntentionRow[];
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "采购意向加载失败");
        setRows(data.purchaseIntentions ?? []);
        setLoadState("ready");
      })
      .catch(() => {
        setLoadState("error");
      });
  };

  useEffect(() => {
    loadIntentions();
  }, []);

  const reviewIntention = async (id: string, action: "submit_for_director" | "approve" | "request_changes" | "reject") => {
    setActionState("正在处理采购意向...");
    try {
      const response = await fetch("/api/purchase-intentions/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          actorRole: operatorRole,
          comment: action === "approve" ? "总监确认通过，进入二次确认/成团汇总。" : "按当前节点处理。",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "处理失败");
      setActionState("处理完成，状态已写入数据库。");
      loadIntentions();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "处理失败");
    }
  };

  const pendingCount = rows.filter((row) => row.status === "submitted").length;
  const reviewableCount = rows.filter((row) => row.quantityBoxes >= 120).length;

  return (
    <>
      <PageTitle title="意向审核" subtitle={isDirector ? "商品总监审批成团二次确认，经理账号不能代替审批" : "商品运营经理汇总企业意向、补齐资料并提交总监审批"} />
      <section className="metric-strip client-metrics">
        <MetricCard icon="◇" label="待审核意向" value={loadState === "ready" ? String(pendingCount) : "-"} hint="来自真实采购意向表" />
        <MetricCard icon="▤" label="待核价" value="0" hint="需确认供应商报价口径" />
        <MetricCard icon="▧" label="待补资料" value="0" hint="包装、标签、授权资料未完整" />
        <MetricCard icon="♙" label="可二次确认" value={loadState === "ready" ? String(reviewableCount) : "-"} hint="按已提交意向初步判断" />
      </section>
      <section className="progress-filter-row">
        <input placeholder="搜索企业、商品、区域仓" />
        <button type="button">全部状态⌄</button>
        <button type="button">商品国家⌄</button>
        <button type="button">到货窗口⌄</button>
        <button type="button" onClick={loadIntentions}>刷新</button>
        <button className="primary-button" type="button" onClick={() => rows[0] ? reviewIntention(rows[0].id, isDirector ? "approve" : "submit_for_director") : setActionState("没有可处理的采购意向。")}>{isDirector ? "批准第一条意向" : "提交第一条给总监"}</button>
      </section>
      {actionState ? <div className="operation-result">{actionState}</div> : null}
      <section className="approval-gate-strip">
        {["达到20尺柜", "最终报价版本", "到货窗口", "合同条款", "授权与标签"].map((item, index) => (
          <article key={item} className={index < 3 ? "done" : ""}>
            <b>{index < 3 ? "✓" : "!"}</b>
            <span>{item}</span>
          </article>
        ))}
      </section>
      <section className="procurement-layout">
        <article className="panel intention-admin-table">
          <h2>企业采购意向列表</h2>
          <div className="data-table intention-admin">
            <div>企业</div><div>商品</div><div>意向数量</div><div>收货区域</div><div>到货窗口</div><div>当前状态</div><div>操作</div>
            {loadState === "loading" ? <div className="table-state" aria-live="polite">正在加载真实采购意向...</div> : null}
            {loadState === "error" ? <div className="table-state error">采购意向加载失败，请检查数据库和 API。</div> : null}
            {loadState === "ready" && rows.length === 0 ? <div className="table-state">暂无企业采购意向。</div> : null}
            {rows.flatMap((row) => (
              [
                row.enterpriseName ?? row.enterpriseId,
                row.productName ?? row.productId,
                `${row.quantityBoxes} 箱`,
                row.receivingRegion,
                row.expectedArrivalWindow,
                row.status === "submitted" ? "待审核" : row.status,
                "操作",
              ].map((cell, cellIndex) => (
                <div key={`${row.id}-${cellIndex}`}>
                  {cellIndex === 5 ? <span className="status-pill">{cell}</span> : cell}
                  {cellIndex === 6 ? (
                    <div className="inline-action-group">
                      <button
                        className="plain-link inline-action"
                        type="button"
                        onClick={() => {
                          setSelectedId(row.productId);
                          setView("detail");
                        }}
                      >
                        商品
                      </button>
                      {isDirector ? (
                        <>
                          <button className="plain-link inline-action" type="button" onClick={() => reviewIntention(row.id, "approve")}>通过</button>
                          <button className="plain-link inline-action" type="button" onClick={() => reviewIntention(row.id, "request_changes")}>补充</button>
                          <button className="plain-link inline-action danger" type="button" onClick={() => reviewIntention(row.id, "reject")}>驳回</button>
                        </>
                      ) : (
                        <button className="plain-link inline-action" type="button" onClick={() => reviewIntention(row.id, "submit_for_director")}>提交总监</button>
                      )}
                    </div>
                  ) : null}
                </div>
              ))
            ))}
          </div>
        </article>
        <aside className="procurement-side">
          <section className="panel stage-card">
            <h2>审核要点 <span>运营端</span></h2>
            <div className="stage-steps">
              {["供应商报价口径", "品牌授权范围", "HS 编码和税费", "包装与中文标签", "20 尺柜装柜量", "二次确认价格"].map((step, index) => (
                <div key={step} className={index === 0 ? "active" : ""}>
                  <b>{index + 1}</b>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="advice-card">
            <strong>价格口径提醒</strong>
            <p>企业端只展示预估到仓成本。运营端在二次确认前必须复核供货价、国际物流、税费、二配和服务费。</p>
          </section>
        </aside>
      </section>
    </>
  );
}

function FileCenterPage({
  portal,
  setView,
  setSelectedId,
}: {
  portal: Portal;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const isBuyer = portal === "buyer";
  const files = isBuyer ? buyerFileItems : operatorFileItems;
  const [documents, setDocuments] = useState<BusinessDocumentRow[]>([]);
  const [documentState, setDocumentState] = useState<"loading" | "ready" | "error">("loading");

  const loadDocuments = () => {
    setDocumentState("loading");
    fetch("/api/documents/")
      .then(async (response) => {
        const data = (await response.json()) as { documents?: BusinessDocumentRow[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "单据加载失败");
        setDocuments(data.documents ?? []);
        setDocumentState("ready");
      })
      .catch(() => setDocumentState("error"));
  };

  useEffect(() => {
    loadDocuments();
  }, []);
  const metrics = isBuyer
    ? [
        ["可下载文件", "18", "商品资料、意向、合同、付款、签收"],
        ["待确认文件", "3", "二次确认和最终报价"],
        ["待处理节点", "2", "付款证明、收货异常照片"],
        ["历史归档", "42", "按订单和商品归档"],
      ]
    : [
        ["缺失节点", "31", "分散在商品流程中处理"],
        ["AI 初审中", "24", "等待字段抽取和一致性检查"],
        ["待人工复核", "16", "商品、关务、财务、法务分工"],
        ["已归档文件", "128", "按商品、订单、柜号归档"],
      ];

  return (
    <>
      <PageTitle
        title={isBuyer ? "合同与单据" : "资料文件中心"}
        subtitle={isBuyer ? "按商品和采购阶段下载资料、合同、付款、交付和结算文件" : "这里只做总览和缺失预警；上传必须进入具体商品页，并绑定当前流程节点"}
      />

      <section className="metric-strip document-metrics">
        {metrics.map((metric, index) => (
          <MetricCard key={metric[0]} icon={["▦", "◎", "◇", "▤"][index]} label={metric[0]} value={metric[1]} hint={metric[2]} />
        ))}
      </section>

      <section className="workflow-strip">
        {workflowStages.map((stage, index) => (
          <article key={stage[0]} className={index === 1 && !isBuyer ? "active" : ""}>
            <b>{index + 1}</b>
            <strong>{stage[0]}</strong>
            <span>{stage[1]}</span>
          </article>
        ))}
      </section>

      <section className="document-layout">
        <article className="panel document-table-panel">
          <div className="panel-head">
            <div>
              <h2>{isBuyer ? "我的业务单据" : "业务单据台账"}</h2>
              <p>{isBuyer ? "只显示本企业可见单据" : "真实单据记录，文件上传后会自动形成单据台账"}</p>
            </div>
            <div className="file-tools">
              <input placeholder="搜索商品、阶段、订单号" />
              <button className="outline-button" type="button" onClick={loadDocuments}>刷新</button>
            </div>
          </div>
          <div className="business-document-list">
            {documentState === "loading" ? <div className="table-state">正在加载真实单据...</div> : null}
            {documentState === "error" ? <div className="table-state error">单据加载失败，请确认账号权限。</div> : null}
            {documentState === "ready" && documents.length === 0 ? <div className="table-state">暂无业务单据。后台上传文件或生成合同后会出现在这里。</div> : null}
            {documents.map((document) => (
              <article className="business-document-row" key={document.id}>
                <div>
                  <strong>{document.title}</strong>
                  <span>{document.documentNo} · {document.documentType} · {document.stage}</span>
                </div>
                <div>
                  <span>{document.productName ?? document.productId ?? "未绑定商品"}</span>
                  <small>{document.enterpriseName ?? document.enterpriseId ?? "内部单据"}</small>
                </div>
                <StatusPill status={document.status} />
                <button
                  className="outline-button"
                  type="button"
                  disabled={!document.fileUploadId}
                  onClick={() => document.fileUploadId ? openFileDownload(document.fileUploadId) : undefined}
                >
                  下载
                </button>
              </article>
            ))}
          </div>
          <div className="file-list">
            {(isBuyer ? files : products.slice(0, 6).map((product, index) => {
              const stage = productFlowFiles[index % productFlowFiles.length];
              return [stage.stage, product.cnName, stage.status, stage.files.join("、")];
            })).map((file, index) => (
              <article className="file-row" key={`${file[0]}-${file[1]}`}>
                <div className="file-main">
                  <span className="file-type-icon">▦</span>
                  <div>
                    <h3>{isBuyer ? file[0] : `${file[1]} · ${file[0]}`}</h3>
                    <p>{file[1]}</p>
                    <small>{isBuyer ? file[3] : `该节点文件：${file[3]}`}</small>
                  </div>
                </div>
                <StatusPill status={file[2]} />
                <div className="file-actions">
                  {isBuyer ? (
                    <>
                      <button className="outline-button" type="button" disabled={!canDownloadStatus(file[2])}>
                        下载
                      </button>
                      <button className="soft-button" type="button">
                        查看
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="outline-button"
                        type="button"
                        onClick={() => {
                          setSelectedId(products[index % products.length].id);
                          setView("detail");
                        }}
                      >
                        打开商品页
                      </button>
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => {
                          setSelectedId(products[index % products.length].id);
                          setView(file[2] === "AI初审中" || file[2] === "需补正" ? "aiReview" : "detail");
                        }}
                      >
                        {file[2] === "已归档" ? "查看归档" : "按节点处理"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="document-side">
          <section className="panel flow-rule-card">
            <h2>{isBuyer ? "文件查看规则" : "上传规则"}</h2>
            <p>{isBuyer ? "企业端只下载当前企业、当前商品、当前订单可见的文件。" : "后台上传入口放在商品页的流程节点内，总览页不允许绕过流程上传。"}</p>
            <div>
              {["绑定商品", "绑定阶段", "绑定责任人", "AI 初审", "人工复核"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <button
              className="primary-button full"
              type="button"
              onClick={() => {
                setSelectedId(products[0].id);
                setView("detail");
              }}
            >
              {isBuyer ? "打开商品文件" : "进入商品页上传"}
            </button>
          </section>

          <section className="panel checklist-panel">
            <h2>{isBuyer ? "文件包" : "缺失预警"}</h2>
            {[
              ["商品资料包", "已审核"],
              ["成本说明", "可下载"],
              ["合同订单", isBuyer ? "待生成" : "待复核"],
              ["报关资料", isBuyer ? "状态可见" : "缺 2 份"],
              ["签收结算", "待上传"],
            ].map((item) => (
              <div key={item[0]} className="checkline">
                <span>{item[0]}</span>
                <StatusPill status={item[1]} />
              </div>
            ))}
          </section>
        </aside>
      </section>
    </>
  );
}

function AiReviewPage({ operatorRole, setView }: { operatorRole: OperatorRole; setView: (view: View) => void }) {
  const isDirector = operatorRole === "director";
  const [uploads, setUploads] = useState<FileUploadRow[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [actionState, setActionState] = useState("");

  const loadUploads = () => {
    setLoadState("loading");
    fetch("/api/files/")
      .then(async (response) => {
        const data = (await response.json()) as { uploads?: FileUploadRow[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "文件加载失败");
        setUploads(data.uploads ?? []);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  };

  useEffect(() => {
    loadUploads();
  }, []);

  const reviewFile = async (id: string, action: "ai_pass" | "ai_warning" | "approve" | "request_changes" | "reject") => {
    setActionState("正在处理文件审核...");
    try {
      const response = await fetch("/api/files/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          actorRole: operatorRole,
          summary: action === "ai_pass" ? "AI 初审字段完整，等待人工复核。" : action === "approve" ? "总监确认文件可归档。" : "需补充或修正文件。",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "文件审核失败");
      setActionState("文件状态已更新。");
      loadUploads();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "文件审核失败");
    }
  };

  return (
    <>
      <PageTitle title="AI 初审队列" subtitle={isDirector ? "总监复核 AI 初审结果并决定通过、退回或驳回" : "经理处理 AI 初审提示，补资料后提交总监复核"} />
      <section className="metric-strip ai-metrics">
        <MetricCard icon="◎" label="待初审" value={loadState === "ready" ? String(uploads.filter((item) => item.aiReviewStatus === "pending").length) : "-"} hint="来自真实上传文件" />
        <MetricCard icon="!" label="需补正" value={loadState === "ready" ? String(uploads.filter((item) => item.manualReviewStatus === "changes_requested").length) : "-"} hint="授权、报价、装箱资料问题较多" />
        <MetricCard icon="◇" label="待人工复核" value={loadState === "ready" ? String(uploads.filter((item) => item.manualReviewStatus === "pending").length) : "-"} hint="按岗位分配处理" />
        <MetricCard icon="▦" label="已上传文件" value={loadState === "ready" ? String(uploads.length) : "-"} hint="绑定商品、阶段和业务单号" />
      </section>
      {actionState ? <div className="operation-result">{actionState}</div> : null}

      <section className="ai-layout">
        <article className="panel ai-queue-panel">
          <div className="panel-head">
            <div>
              <h2>待处理文件</h2>
              <p>AI 只做初步审核，最终以人工复核为准</p>
            </div>
            <div className="file-tools">
              <button className="outline-button" type="button">风险等级⌄</button>
              <button className="outline-button" type="button">责任岗位⌄</button>
              <button className="primary-button" type="button" onClick={loadUploads}>刷新队列</button>
            </div>
          </div>
          <div className="review-list">
            {loadState === "loading" ? <div className="table-state" aria-live="polite">正在加载真实上传文件...</div> : null}
            {loadState === "error" ? <div className="table-state error">文件队列加载失败。</div> : null}
            {loadState === "ready" && uploads.length === 0 ? <div className="table-state">暂无上传文件。请先进入商品详情页的流程节点上传。</div> : null}
            {uploads.map((item) => (
              <article className="review-card" key={item.id}>
                <div className="review-head">
                  <div>
                    <h3>{item.originalFileName}</h3>
                    <p>{item.productId} · {item.businessNo}</p>
                    <p>{Math.round(item.sizeBytes / 1024)} KB · {item.mimeType}</p>
                  </div>
                  <div className="review-badges">
                    <span className={`risk-badge risk-${item.aiReviewStatus === "warning" ? "高" : "低"}`}>{item.aiReviewStatus === "warning" ? "高风险" : "待核验"}</span>
                    <StatusPill status={item.manualReviewStatus} />
                  </div>
                </div>
                <div className="extracted-grid">
                  {["文件名", item.originalFileName, "业务单号", item.businessNo, "存储键", item.storageKey].map((field) => (
                    <span key={field}>{field}</span>
                  ))}
                </div>
                <div className="review-issue">
                  <strong>初审提示</strong>
                  <p>{item.aiReviewSummary ?? "已接收文件，等待初审和人工复核。"}</p>
                </div>
                <div className="review-actions">
                  <button className="outline-button" type="button" onClick={() => openFileDownload(item.id)}>查看原件</button>
                  {isDirector ? (
                    <>
                      <button className="outline-button" type="button" onClick={() => reviewFile(item.id, "request_changes")}>退回补正</button>
                      <button className="primary-button" type="button" onClick={() => reviewFile(item.id, "approve")}>确认入库</button>
                    </>
                  ) : (
                    <>
                      <button className="outline-button" type="button" onClick={() => reviewFile(item.id, "ai_warning")}>标记异常</button>
                      <button className="primary-button" type="button" onClick={() => reviewFile(item.id, "ai_pass")}>初审通过</button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="ai-side">
          <section className="panel flow-rule-card">
            <h2>队列来源</h2>
            <p>AI 初审队列只接收从商品页流程节点上传的文件。每份文件已经带有商品、阶段、责任岗位和业务单号。</p>
            <div>
              {["商品页上传", "节点锁定", "字段抽取", "人工复核"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <button className="primary-button full" type="button" onClick={() => setView("catalog")}>
              选择商品处理
            </button>
          </section>

          <section className="panel ai-rule-panel">
            <h2>初审检查项</h2>
            {["文件类型是否匹配", "关键字段是否完整", "金额、数量、币种是否一致", "有效期和日期是否异常", "敏感信息是否需要脱敏", "是否缺少下一节点必传文件"].map((item) => (
              <div key={item}><span>✓</span>{item}</div>
            ))}
            <button className="outline-button full" type="button" onClick={() => setView("documents")}>返回文件中心</button>
          </section>
        </aside>
      </section>
    </>
  );
}

function ProgressBoard({
  portal,
  setView,
  setSelectedId,
}: {
  portal: Portal;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const ordered = [...products].sort((a, b) => progressOf(b) - progressOf(a));
  const isBuyer = portal === "buyer";

  return (
    <>
      <PageTitle title="单品 20 尺柜进度看板" subtitle={isBuyer ? "企业端不展示其他参与企业，仅展示总进度" : "后台查看单品成团总量、二次确认条件和运营跟进重点"} />
      <section className="panel progress-panel">
        <div className="progress-title">
          <div>
            <span>总进度展示</span>
            <h2>{isBuyer ? "企业端不展示其他参与企业" : "后台按单品汇总成团进度"}</h2>
          </div>
          <span className="privacy-badge">{isBuyer ? "♢ 隐私保护" : "◇ 内部汇总"}</span>
        </div>
        <div className="progress-list">
          {ordered.map((product) => {
            const pct = progressOf(product);
            return (
              <article className="progress-row" key={product.id}>
                <ProductImage product={product} size="mini" />
                <div className="progress-copy">
                  <h2>{product.cnName}</h2>
                  <p>
                    {product.brand} · {product.country} · {product.caseSpec}
                  </p>
                </div>
                <div className="progress-meter">
                  <strong>{pct}%</strong>
                  <ProgressBar value={pct} />
                </div>
                <div className="progress-total">
                  <strong>
                    {product.currentBoxes} / {product.targetBoxes} 箱
                  </strong>
                  <span>当前总意向</span>
                </div>
                <button
                  className="row-button"
                  type="button"
                  onClick={() => {
                    setSelectedId(product.id);
                    setView("detail");
                  }}
                >
                  查看详情
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function ReportsPage() {
  return (
    <>
      <PageTitle title="数据报表" subtitle="多维度数据分析，助力业务决策" />
      <section className="report-filters">
        <button type="button">时间范围<br /><strong>2026-05-01 ~ 2026-05-31</strong></button>
        <button type="button">对比维度<br /><strong>环比⌄</strong></button>
        <button type="button">商品类别<br /><strong>全部类别⌄</strong></button>
        <button type="button">品牌<br /><strong>全部品牌⌄</strong></button>
        <button type="button">国家/地区<br /><strong>全部国家⌄</strong></button>
        <button className="outline-button" type="button">重置</button>
        <button className="primary-button" type="button">导出报表</button>
      </section>
      <section className="metric-strip report-metrics">
        <ReportMetric label="采购金额" value="¥ 2,450,890.60" change="较上月 ↑ 18.6%" />
        <ReportMetric label="订单数" value="312" change="较上月 ↑ 12.4%" />
        <ReportMetric label="成团数" value="68" change="较上月 ↑ 25.9%" />
        <ReportMetric label="商品数" value="1,245" change="较上月 ↑ 8.3%" />
        <ReportMetric label="客单价" value="¥ 7,852.21" change="较上月 ↑ 5.7%" />
      </section>
      <section className="report-grid">
        <article className="panel line-panel">
          <h2>采购金额趋势</h2>
          <div className="line-legend"><span />采购金额（元）<b />订单数（单）</div>
          <div className="line-chart">
            {Array.from({ length: 28 }, (_, index) => (
              <i key={index} style={{ height: `${28 + ((index * 17) % 52)}%` }} />
            ))}
          </div>
        </article>
        <article className="panel donut-panel">
          <h2>品类采购金额占比</h2>
          <div className="report-donut"><strong>¥ 2,450,890.60</strong><span>总金额</span></div>
          <ul className="legend-list">
            {["糖果巧克力 28.6% ¥ 701,754.95", "饼干糕点 22.4% ¥ 549,688.30", "饮料冲调 18.7% ¥ 458,912.40", "粮油调味 12.9% ¥ 316,313.40", "休闲食品 8.3% ¥ 203,134.60", "其他 9.1% ¥ 221,086.95"].map((text, index) => (
              <li key={text}><span className={`legend-dot color-${index}`} />{text}</li>
            ))}
          </ul>
        </article>
        <RankPanel title="国家/地区采购金额" items={["德国 ¥ 856,200.50", "英国 ¥ 647,800.30", "奥地利 ¥ 398,600.20", "意大利 ¥ 296,400.10"]} />
        <RankPanel title="品牌采购金额 TOP5" items={["HARIBO ¥ 245,600.30", "Walker's ¥ 198,700.20", "Manner ¥ 156,400.10", "Ritter Sport ¥ 132,600.80", "Lavazza ¥ 118,300.50"]} />
        <article className="panel report-table">
          <h2>采购概览</h2>
          <div className="data-table four">
            <div>指标</div><div>本期（2026-05）</div><div>上期（2026-04）</div><div>环比变化</div>
            {[
              ["采购金额（元）", "2,450,890.60", "2,067,441.80", "↑ 18.6%"],
              ["订单数（单）", "312", "277", "↑ 12.4%"],
              ["成团数（单）", "68", "54", "↑ 25.9%"],
              ["商品数（个）", "1,245", "1,150", "↑ 8.3%"],
              ["客单价（元）", "7,852.21", "7,451.23", "↑ 5.7%"],
            ].flat().map((cell, index) => <div key={`${cell}-${index}`}>{cell}</div>)}
          </div>
        </article>
      </section>
    </>
  );
}

function ReportMetric({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <article className="report-metric">
      <span className="metric-icon">▣</span>
      <div><small>{label}</small><strong>{value}</strong><p>{change}</p></div>
      <div className="sparkline">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ height: `${20 + ((i * 13) % 40)}%` }} />)}</div>
    </article>
  );
}

function RankPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="panel rank-panel">
      <h2>{title}</h2>
      {items.map((item, index) => (
        <div className="rank-line" key={item}>
          <span>{item}</span>
          <b style={{ width: `${88 - index * 12}%` }} />
        </div>
      ))}
    </article>
  );
}

function ClientsPage() {
  const [enterpriseUsers, setEnterpriseUsers] = useState<AccountListRow[]>([]);
  const [operatorUsers, setOperatorUsers] = useState<AccountListRow[]>([]);
  const [accountState, setAccountState] = useState("");
  const [newAccount, setNewAccount] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer_manager",
    enterpriseId: "ent_jiarong",
    enterpriseName: "广东嘉荣超市有限公司",
    enterpriseShortName: "广东嘉荣集团",
    enterpriseType: "区域头部超市",
    enterpriseRegion: "华南",
  });

  const loadAccounts = () => {
    fetch("/api/users/")
      .then(async (response) => {
        const data = (await response.json()) as { enterpriseUsers?: AccountListRow[]; operatorUsers?: AccountListRow[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "账号加载失败");
        setEnterpriseUsers(data.enterpriseUsers ?? []);
        setOperatorUsers(data.operatorUsers ?? []);
      })
      .catch((error) => setAccountState(error instanceof Error ? error.message : "账号加载失败"));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const createEnterpriseUser = async () => {
    setAccountState("正在创建企业采购账号...");
    try {
      const response = await fetch("/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: "enterprise_user",
          ...newAccount,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "账号创建失败");
      setAccountState("企业采购账号已创建。");
      setNewAccount((current) => ({ ...current, name: "", email: "", password: "" }));
      loadAccounts();
    } catch (error) {
      setAccountState(error instanceof Error ? error.message : "账号创建失败");
    }
  };

  const clients = [
    ["广东嘉荣超市有限公司", "华南区域头部超市", "合作中", "★★★★★", "采购负责人", "客户经理已登记", "¥ 5,680,000", "2026-05-20"],
    ["家家悦集团股份有限公司", "山东区域连锁超市", "合作中", "★★★★★", "进口食品负责人", "客户经理已登记", "¥ 4,320,000", "2026-05-18"],
    ["湖南佳惠百货有限责任公司", "湖南区域商贸零售", "合作中", "★★★★☆", "休食采购负责人", "客户经理已登记", "¥ 3,980,000", "2026-05-17"],
    ["福建冠超市商业有限公司", "福建区域连锁超市", "合作中", "★★★★☆", "采购中心负责人", "客户经理已登记", "¥ 3,650,000", "2026-05-16"],
    ["安徽乐城投资股份有限公司", "安徽区域精品超市", "潜在客户", "★★★☆☆", "商品部负责人", "待补充", "¥ 1,280,000", "2026-05-10"],
    ["四川舞东风超市连锁股份有限公司", "西南区域社区零售", "跟进中", "★★★☆☆", "采购经理", "待补充", "¥ 980,000", "2026-04-28"],
    ["重庆重客隆超市连锁有限责任公司", "重庆区域连锁超市", "待评估", "★★☆☆☆", "商品经理", "待补充", "¥ 670,000", "2026-04-15"],
  ];
  return (
    <>
      <PageTitle title="企业客户" subtitle="管理和维护企业客户信息，建立长期合作关系" />
      <section className="panel account-admin-panel">
        <div className="panel-head">
          <div>
            <h2>企业采购账号管理</h2>
            <p>为区域超市企业创建员工账号，采购端登录后只能查看本企业数据。</p>
          </div>
          <button className="outline-button" type="button" onClick={loadAccounts}>刷新账号</button>
        </div>
        <div className="account-create-grid">
          <input placeholder="员工姓名" value={newAccount.name} onChange={(event) => setNewAccount({ ...newAccount, name: event.target.value })} />
          <input placeholder="登录邮箱" value={newAccount.email} onChange={(event) => setNewAccount({ ...newAccount, email: event.target.value })} />
          <input placeholder="初始密码，至少10位" type="password" value={newAccount.password} onChange={(event) => setNewAccount({ ...newAccount, password: event.target.value })} />
          <input placeholder="企业ID" value={newAccount.enterpriseId} onChange={(event) => setNewAccount({ ...newAccount, enterpriseId: event.target.value })} />
          <input placeholder="企业全称" value={newAccount.enterpriseName} onChange={(event) => setNewAccount({ ...newAccount, enterpriseName: event.target.value })} />
          <input placeholder="企业简称" value={newAccount.enterpriseShortName} onChange={(event) => setNewAccount({ ...newAccount, enterpriseShortName: event.target.value })} />
          <button className="primary-button" type="button" onClick={createEnterpriseUser}>创建采购账号</button>
        </div>
        {accountState ? <div className="operation-result">{accountState}</div> : null}
        <div className="account-list-grid">
          <article>
            <h3>企业员工账号</h3>
            {enterpriseUsers.map((user) => (
              <div className="account-line" key={user.id}>
                <span>{user.name}</span><small>{user.email} · {user.enterpriseId} · {user.role}</small><StatusPill status={user.hasPassword ? "可登录" : "未设置密码"} />
              </div>
            ))}
          </article>
          <article>
            <h3>内部后台账号</h3>
            {operatorUsers.map((user) => (
              <div className="account-line" key={user.id}>
                <span>{user.name}</span><small>{user.email} · {user.role}</small><StatusPill status={user.hasPassword ? "可登录" : "未设置密码"} />
              </div>
            ))}
          </article>
        </div>
      </section>
      <section className="metric-strip client-metrics">
        <MetricCard icon="♙" label="客户总数" value="128" hint="较上月 +12 ↑" />
        <MetricCard icon="▧" label="活跃客户" value="89" hint="活跃率 69.5%" />
        <MetricCard icon="♢" label="合作金额（本年）" value="¥ 28,560,000" hint="较去年 +18.6% ↑" />
        <MetricCard icon="▥" label="订单总数（本年）" value="2,346" hint="较去年 +15.3% ↑" />
      </section>
      <section className="client-actions">
        <input placeholder="搜索客户名称、联系人、电话" />
        <button type="button">客户状态⌄</button>
        <button type="button">合作等级⌄</button>
        <button type="button">所在地区⌄</button>
        <button type="button">更多筛选⌄</button>
        <button className="plain-link" type="button">重置</button>
        <button className="outline-button" type="button">导出数据</button>
        <button className="primary-button" type="button">+ 新增客户</button>
      </section>
      <section className="clients-layout">
        <article className="panel client-table">
          <div className="data-table clients">
            <div>客户名称</div><div>客户状态</div><div>合作等级</div><div>联系人</div><div>联系电话</div><div>合作金额（本年）</div><div>最后订单时间</div><div>操作</div>
            {clients.flatMap((row) => (
              row.concat("查看详情 编辑 ⋯").map((cell, index) => (
                <div key={`${row[0]}-${index}`} className={index === 2 ? "stars" : ""}>{cell}</div>
              ))
            ))}
          </div>
          <footer className="table-footer">共 128 条 <button type="button">10 条/页⌄</button><span>‹</span><b>1</b><span>2</span><span>3</span><span>4</span><span>5</span><span>…</span><span>13</span><span>›</span></footer>
        </article>
        <aside className="client-side">
          <section className="panel side-donut"><h2>客户状态分布</h2><div className="mini-donut">128<span>客户总数</span></div><p>合作中 89（69.5%）</p><p>潜在客户 21（16.4%）</p><p>已暂停 12（9.4%）</p></section>
          <section className="panel grade-card"><h2>合作等级分布</h2>{["战略合作伙伴 23", "优质合作伙伴 45", "一般合作伙伴 38", "潜力合作伙伴 16", "待发展伙伴 6"].map((item) => <p key={item}>★★★★★ <span>{item}</span></p>)}</section>
          <section className="panel recent-card"><h2>最近新增客户</h2>{["深圳市美宜佳控股...", "广州钱大妈农产品...", "佛山市顺客隆商业..."].map((item) => <p key={item}>{item}<span>潜在客户</span></p>)}</section>
        </aside>
      </section>
    </>
  );
}

function MessagesPage() {
  const categories = [["全部消息", "12"], ["系统公告", "3"], ["订单通知", "4"], ["成团进度", "2"], ["费用通知", "1"], ["服务通知", "1"], ["平台活动", "1"], ["其他消息", "0"]];
  const messages = [
    ["系统升级维护通知", "SPAR 联采平台将于 2026年5月25日 22:00 - 5月26日 02:00 进行系统升级维护，期间平台部分功能将受影响...", "系统公告", "10:30", "未读"],
    ["订单支付成功通知", "您的订单 PO-20260524001 已支付成功，金额 ¥78,450.00 元。感谢您的采购！", "订单通知", "昨天 16:45", "未读"],
    ["成团进度更新", "您参与的团组「进口饼干零食专场」成团率已更新至 83%，距离成团目标还差 17%。", "成团进度", "昨天 11:20", "未读"],
    ["费用结算通知", "您的 2026年5月 结算单已生成，金额 ¥12,680.00 元，请及时查看并安排付款。", "费用通知", "5月23日 09:15", "已读"],
    ["服务商响应通知", "您的售后服务请求（工单号：SR-20260522001）已有新回复，请及时查看。", "服务通知", "5月22日 14:30", "已读"],
    ["618 进口好物节活动预告", "SPAR 联采 618 进口好物节即将开启，多重优惠等你来享！", "平台活动", "5月21日 10:00", "已读"],
  ];
  return (
    <>
      <section className="dashboard-title"><h1>消息中心</h1><p>下午好，王经理</p></section>
      <section className="message-layout">
        <aside className="panel message-sidebar">
          <h2>消息分类</h2>
          {categories.map((item, index) => <button className={index === 0 ? "active" : ""} key={item[0]} type="button"><span>{item[0]}</span><b>{item[1]}</b></button>)}
          <h2>消息状态</h2>
          {["全部状态 12", "未读消息 3", "已读消息 9"].map((item) => <button key={item} type="button">{item}</button>)}
        </aside>
        <section className="panel message-main">
          <div className="message-tools"><label><input type="checkbox" /> 全选</label><button type="button">标为已读</button><button type="button">删除</button><span /><button type="button">全部时间⌄</button><button type="button">最新在前⌄</button><button type="button">刷新</button></div>
          {messages.map((message, index) => (
            <article className={`message-item ${index === 0 ? "featured" : ""}`} key={message[0]}>
              <input type="checkbox" />
              <span className="message-icon">●</span>
              <div><h2>{message[0]}</h2><p>{message[1]}</p><b>{message[2]}</b></div>
              <time>{message[3]}</time>
              <small>{message[4]}</small>
            </article>
          ))}
          <footer className="table-footer">共 12 条消息 <span>‹</span><b>1</b><span>2</span><span>›</span><button type="button">20 条/页⌄</button></footer>
        </section>
      </section>
    </>
  );
}

function HelpPage() {
  const cats = [["账户与权限", "账户注册、权限管理、企业信息维护", "12 篇文章"], ["采购流程", "商品搜索、下单、成团、订单跟踪", "18 篇文章"], ["支付与结算", "支付方式、发票申请、对账结算", "15 篇文章"], ["物流与配送", "配送方式、运费说明、物流跟踪", "10 篇文章"], ["售后与服务", "退换货政策、售后服务、投诉建议", "8 篇文章"], ["政策与规则", "平台规则、隐私政策、合规说明", "6 篇文章"]];
  const docs = ["如何快速发起采购需求", "成团规则与进度说明", "费用构成与结算说明", "发票申请操作指南", "物流配送说明", "售后服务与退换货政策"];
  const faq = ["如何注册 SPAR 联采平台账号？", "如何发起采购意向？", "成团需要满足什么条件？", "订单确认后可以修改吗？", "如何申请发票？", "商品质量问题如何处理？", "配送范围和时效是怎样的？", "如何联系客户支持？"];
  return (
    <>
      <PageTitle title="帮助中心" subtitle="为您提供全面的帮助与支持" />
      <section className="help-hero">
        <div>
          <h2>您好，王经理<br />有什么可以帮助您?</h2>
          <div className="help-search"><input placeholder="搜索帮助文档、问题或功能..." /><button className="primary-button" type="button">搜索</button></div>
          <p>热门搜索： 成团规则 费用说明 订单管理 发票申请 退换货政策</p>
        </div>
        <div className="help-visual">SPAR</div>
      </section>
      <h2 className="section-label">常见问题分类</h2>
      <section className="help-categories">
        {cats.map((cat, index) => <article className="panel" key={cat[0]}><span className={`help-dot color-${index}`}>▣</span><h3>{cat[0]}</h3><p>{cat[1]}</p><small>{cat[2]}</small></article>)}
      </section>
      <section className="help-grid">
        <article className="panel doc-list"><h2>热门文档</h2>{docs.map((doc, index) => <div key={doc}><span>▤</span><strong>{doc}</strong><small>{index + 1}.{index % 2 ? "8" : "3"}k 浏览</small></div>)}</article>
        <article className="panel faq-list"><h2>常见问题 FAQ</h2>{faq.map((item) => <button key={item} type="button">{item}<span>⌄</span></button>)}</article>
        <aside className="panel support-card"><h2>需要更多帮助?</h2><p>我们的客服团队随时为您提供专业支持</p><div>在线客服 <b>推荐</b><small>7×24小时在线服务</small></div><div>电话咨询<small>400-888-SPAR (7727)</small></div><div>邮件支持<small>support@spar.com.cn</small></div><button className="primary-button full" type="button">提交工单</button></aside>
      </section>
    </>
  );
}

function IntentionForm({ selectedProduct, setView }: { selectedProduct: Product; setView: (view: View) => void }) {
  const pct = progressOf(selectedProduct);
  const [quantityBoxes, setQuantityBoxes] = useState("120");
  const [receivingRegion] = useState("山东区域仓");
  const [expectedArrivalWindow] = useState("2026 年 Q4");
  const [note, setNote] = useState("");
  const [submitState, setSubmitState] = useState<{
    status: "idle" | "submitting" | "success" | "error";
    message: string;
    id?: string;
  }>({ status: "idle", message: "" });

  const submitIntention = async () => {
    setSubmitState({ status: "submitting", message: "正在提交采购意向..." });
    try {
      const response = await fetch("/api/purchase-intentions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantityBoxes,
          receivingRegion,
          expectedArrivalWindow,
          note,
        }),
      });
      const result = (await response.json()) as {
        purchaseIntention?: { id: string };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "提交失败");
      }

      setSubmitState({
        status: "success",
        message: "采购意向已提交，平台已记录并进入成团汇总。",
        id: result.purchaseIntention?.id,
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "提交失败",
      });
    }
  };

  return (
    <>
      <PageTitle title="提交企业采购意向" subtitle="仅形成意向，不锁定价格、库存和交期" />
      <div className="intention-grid">
        <section className="panel form-panel">
          <h2 className="section-title">商品信息</h2>
          <div className="form-grid">
            <label><span>商品</span><button className="field-button product-field" type="button"><ProductImage product={selectedProduct} size="mini" /><strong>{selectedProduct.cnName}</strong><em>⌄</em></button></label>
            <label><span>意向数量</span><div className="number-field"><input value={quantityBoxes} onChange={(event) => setQuantityBoxes(event.target.value)} aria-label="意向数量" /><b>箱</b></div></label>
            <label><span>收货区域</span><button className="field-button" type="button">{receivingRegion} <em>⌄</em></button></label>
            <label><span>期望到货窗口</span><button className="field-button" type="button">{expectedArrivalWindow} <em>⌄</em></button></label>
          </div>
          <label className="note-field"><span>备注（选填）</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="填写陈列计划、门店覆盖、采购审批要求或其他说明" maxLength={200} /><small>{note.length} / 200</small></label>
          <div className="intent-upload-block">
            <h3>采购附件</h3>
            <p>可上传企业内部审批、门店陈列计划或付款前置资料，上传后进入资料整理。</p>
            <UploadDropzone label="采购审批文件 / 陈列计划 / 其他补充资料" />
          </div>
          <div className="notice"><b>i</b><span>提交后平台只记录企业采购意向，达到 20 尺柜后，平台发起二次确认；正式采购前再确认价格口径、合同、预付款和交期。</span></div>
          {submitState.status !== "idle" ? (
            <div className={`submit-result ${submitState.status}`}>
              <strong>{submitState.message}</strong>
              {submitState.id ? <span>意向单号：{submitState.id}</span> : null}
            </div>
          ) : null}
          <button className="primary-button submit-button" type="button" onClick={submitIntention} disabled={submitState.status === "submitting"}>{submitState.status === "submitting" ? "提交中..." : "提交意向"}</button>
        </section>
        <aside className="intention-side">
          <section className="panel current-product"><h2>当前商品</h2><div className="current-product-body"><ProductImage product={selectedProduct} size="thumb" /><div><h3>{selectedProduct.cnName}</h3><p>{selectedProduct.spec} · {selectedProduct.caseSpec}</p><PriceBlock product={selectedProduct} compact /></div></div><button className="soft-button" type="button" onClick={() => setView("detail")}>查看商品详情 →</button></section>
          <section className="panel selection-card"><h2>当前选择</h2><SelectionLine icon="▰" label="意向数量" value={`${quantityBoxes || 0} 箱`} /><SelectionLine icon="⌖" label="收货区域" value={receivingRegion} /><SelectionLine icon="□" label="期望到货窗口" value={expectedArrivalWindow} /><div className="selection-progress"><div><span>成团进度</span><strong>{pct}%</strong></div><ProgressBar value={pct} /><small>距离成团目标 {100 - pct}%</small></div></section>
          <section className="rule-card"><h2>意向规则</h2><p>企业可修改或撤回意向；成团后二次确认前，平台不应对外承诺最终成交价格。</p><button className="plain-link" type="button">查看平台规则 →</button></section>
        </aside>
      </div>
      <section className="trust-strip"><TrustCard icon="◇" title="意向保护" text="仅记录意向，不锁定价格、库存和交期，让采购更灵活。" /><TrustCard icon="♙" title="成团通知" text="达到起订量后，平台将自动通知您进行二次确认。" /><TrustCard icon="▤" title="安全合规" text="所有交易遵循平台规则，保障您的采购安全与合规。" /></section>
    </>
  );
}

function DetailPage({
  product,
  portal,
  operatorRole,
  setView,
}: {
  product: Product;
  portal: Portal;
  operatorRole: OperatorRole;
  setView: (view: View) => void;
}) {
  const pct = progressOf(product);
  const isBuyer = portal === "buyer";

  return (
    <>
      <PageTitle title={product.cnName} subtitle={`${product.brand} · ${product.country} · ${product.category}`} />
      <section className="panel detail-panel">
        <ProductImage product={product} size="wide" />
        <div className="detail-copy">
          <TagRow tags={product.tags} />
          <h2>采购判断信息</h2>
          <p>{product.summary}</p>
          <p>{product.decisionNote}</p>
          <div className="detail-metrics">
            <Spec label="商品规格" value={product.spec} />
            <Spec label="整箱规格" value={product.caseSpec} />
            <Spec label={priceTermLabel} value={product.price} />
            <Spec label="预估毛利带" value={product.gross} />
            <Spec label="20 尺柜目标" value={`${product.targetBoxes.toLocaleString()} 箱`} />
            <Spec label="当前总意向" value={`${product.currentBoxes.toLocaleString()} 箱`} />
            <Spec label="过去12个月总采购量" value={`${product.last12MonthBoxes.toLocaleString()} 箱`} />
            <Spec label="历史采购口径" value="已完成采购箱数" />
          </div>
          <section className="decision-info-panel">
            <h2>进口采购关键资料</h2>
            <div className="decision-info-grid">
              {decisionInfoRows(product).map((item) => (
                <div key={item[0]}>
                  <span>{item[0]}</span>
                  <strong>{item[1]}</strong>
                </div>
              ))}
            </div>
          </section>
          <CostDisclosure />
          <div className="card-actions detail-actions"><button className="outline-button" type="button" onClick={() => setView("catalog")}>返回{isBuyer ? "目录" : "资料库"}</button><button className="primary-button" type="button" onClick={() => setView(isBuyer ? "intention" : "intentionAdmin")}>{isBuyer ? "提交采购意向" : "查看意向审核"}</button></div>
          <ProductFlowFilePanel product={product} isBuyer={isBuyer} operatorRole={operatorRole} setView={setView} />
          <div className="detail-progress"><div><strong>{pct}%</strong><span>当前成团进度</span></div><ProgressBar value={pct} /></div>
        </div>
      </section>
    </>
  );
}

function ProductFlowFilePanel({
  product,
  isBuyer,
  operatorRole,
  setView,
}: {
  product: Product;
  isBuyer: boolean;
  operatorRole: OperatorRole;
  setView: (view: View) => void;
}) {
  const canSubmit = !isBuyer && operatorRole === "manager";
  const canApprove = !isBuyer && operatorRole === "director";
  const [uploads, setUploads] = useState<FileUploadRow[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  const loadProductFiles = () => {
    setLoadState("loading");
    fetch(`/api/files/?productId=${encodeURIComponent(product.id)}`)
      .then(async (response) => {
        const data = (await response.json()) as { uploads?: FileUploadRow[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "文件加载失败");
        setUploads(data.uploads ?? []);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  };

  useEffect(() => {
    loadProductFiles();
  }, [product.id]);

  return (
    <section className="product-flow-panel">
      <div className="panel-head">
        <div>
          <h2>{isBuyer ? "单品流程文件" : "单品流程文件上传"}</h2>
          <p>{isBuyer ? "按当前商品和采购阶段查看可下载资料" : "每个文件必须在对应阶段上传，系统自动绑定当前商品"}</p>
        </div>
        <button className="outline-button" type="button" onClick={() => setView(isBuyer ? "documents" : "aiReview")}>
          {isBuyer ? "查看我的文件" : "查看 AI 初审"}
        </button>
      </div>

      <div className="flow-product-lock">
        <ProductImage product={product} size="mini" />
        <div>
          <strong>{product.cnName}</strong>
          <span>{product.brand} · {product.country} · {product.spec}</span>
        </div>
        <StatusPill status={isBuyer ? "按商品归档" : "上传已锁定商品"} />
      </div>

      {!isBuyer ? (
        <div className="approval-authority-panel">
          <article className={operatorRole === "manager" ? "active" : ""}>
            <b>经理</b>
            <strong>商品运营经理</strong>
            <span>可提报、上传资料、提交总监审批；不能最终审批。</span>
          </article>
          <article className={operatorRole === "director" ? "active" : ""}>
            <b>总监</b>
            <strong>商品总监</strong>
            <span>可审批通过、驳回、要求补充；不能作为提报人上传资料。</span>
          </article>
        </div>
      ) : null}

      <div className="stage-file-list">
        {productFlowFiles.map((stage, index) => {
          const stageStatus = isBuyer ? stage.buyerStatus : stage.status;
          const managerCanUpload = canSubmit && stage.status === "经理补资料中";
          const directorCanApprove = canApprove && stage.status === "待总监审批";
          const managerSubmitted = canSubmit && stage.status === "待总监审批";
          const directorWaiting = canApprove && stage.status === "经理补资料中";
          return (
            <article className={`stage-file-card ${managerCanUpload || directorCanApprove ? "active" : ""}`} key={stage.stage}>
              <div className="stage-index">{index + 1}</div>
              <div className="stage-body">
                <div className="stage-title-line">
                  <div>
                    <h3>{stage.stage}</h3>
                    <p>{stage.timing} · {stage.owner}</p>
                  </div>
                  <StatusPill status={stageStatus} />
                </div>
                <div className="stage-file-tags">
                  {stage.files.map((file) => (
                    <span key={file}>{file}</span>
                  ))}
                </div>
                <p className="stage-note">{stage.note}</p>
                {managerSubmitted ? (
                  <div className="stage-locked-message">
                    <strong>已提交总监审批</strong>
                    <span>经理账号不能审批该提报，只能等待总监处理或在退回后补充资料。</span>
                  </div>
                ) : null}
                {directorWaiting ? (
                  <div className="stage-locked-message">
                    <strong>等待经理提交</strong>
                    <span>经理尚未完成资料提报，总监账号不能代替上传。</span>
                  </div>
                ) : null}
                {managerCanUpload ? (
                  <div className="stage-upload-slot">
                    <FileUploadForm product={product} stage={stage} sequence={index + 1} onUploaded={loadProductFiles} />
                    <div className="upload-fields">
                      <button type="button">流程节点：{index + 1}. {stage.stage}</button>
                      <button type="button">业务单号：{stage.stage === "企业意向与成团" ? "GROUP2026-Q4-001" : stage.stage === "二次确认" ? "CONFIRM2026-Q4-001" : "SKU-" + product.id.toUpperCase()}</button>
                      <button type="button">关联单据：{stage.stage.includes("报关") ? "CUSTOMS2026-001" : stage.stage.includes("运输") ? "柜号待定" : "当前商品"}</button>
                      <button type="button">文件类型已限定：{stage.files[0]} 等⌄</button>
                      <button type="button">绑定商品：{product.cnName}</button>
                      <button type="button">责任岗位：{stage.owner}</button>
                    </div>
                  </div>
                ) : null}
                {directorCanApprove ? (
                  <div className="stage-approval-slot">
                    <strong>总监审批动作</strong>
                    <p>当前账号只处理审批结果，不修改经理提报的原始资料。</p>
                    <div>
                      <button className="primary-button" type="button">审批通过</button>
                      <button className="outline-button" type="button">要求补充</button>
                      <button className="outline-button danger" type="button">驳回</button>
                    </div>
                  </div>
                ) : null}
                {isBuyer ? (
                  <div className="stage-buyer-actions">
                    <button className="outline-button" type="button" disabled={!canDownloadStatus(stage.buyerStatus)}>
                      下载阶段文件
                    </button>
                    <button className="soft-button" type="button">
                      查看状态
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <section className="product-upload-history">
        <h3>该商品已上传文件</h3>
        {loadState === "loading" ? <p>正在加载文件记录...</p> : null}
        {loadState === "error" ? <p>文件记录加载失败。</p> : null}
        {loadState === "ready" && uploads.length === 0 ? <p>暂无真实上传文件。</p> : null}
        {uploads.map((upload) => (
          <div className="uploaded-file-line" key={upload.id}>
            <span>{upload.originalFileName}</span>
            <small>{upload.businessNo} · {Math.round(upload.sizeBytes / 1024)} KB</small>
            <StatusPill status={upload.manualReviewStatus} />
            <button className="plain-link inline-action" type="button" onClick={() => openFileDownload(upload.id)}>下载</button>
          </div>
        ))}
      </section>
    </section>
  );
}

function FileUploadForm({
  product,
  order,
  stage,
  sequence,
  onUploaded,
}: {
  product: Product;
  order?: ProcurementOrderRow;
  stage: (typeof productFlowFiles)[number];
  sequence: number;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [businessNo, setBusinessNo] = useState(order?.orderNo ?? `SKU-${product.id.toUpperCase()}-${sequence}`);
  const [requiredFileType, setRequiredFileType] = useState(stage.files[0] ?? "流程文件");
  const [message, setMessage] = useState("");

  const upload = async () => {
    if (!file) {
      setMessage("请先选择要上传的文件。");
      return;
    }
    setMessage("正在上传文件...");
    const formData = new FormData();
    formData.set("productId", product.id);
    if (order) formData.set("orderId", order.id);
    formData.set("stage", stage.stage);
    formData.set("requiredFileType", requiredFileType);
    formData.set("ownerRole", stage.owner);
    formData.set("businessNo", businessNo);
    formData.set("sequence", String(sequence));
    formData.set("file", file);

    try {
      const response = await fetch("/api/files/", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "上传失败");
      setMessage("文件已上传并进入 AI 初审队列。");
      setFile(null);
      onUploaded();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    }
  };

  return (
    <div className="real-upload-form">
      <label>
        <span>文件类型</span>
        <select value={requiredFileType} onChange={(event) => setRequiredFileType(event.target.value)}>
          {stage.files.map((fileType) => (
            <option key={fileType} value={fileType}>{fileType}</option>
          ))}
        </select>
      </label>
      <label>
        <span>业务单号</span>
        <input value={businessNo} onChange={(event) => setBusinessNo(event.target.value)} />
      </label>
      <label>
        <span>选择文件</span>
        <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
      <button className="primary-button full" type="button" onClick={upload}>
        上传并进入初审
      </button>
      {message ? <p className="upload-message">{message}</p> : null}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.includes("补") || status.includes("高") || status.includes("缺") ? "danger" : status.includes("待") || status.includes("AI") || status.includes("未到") ? "pending" : status.includes("当前") || status.includes("经理") || status.includes("总监") ? "active" : status.includes("归档") || status.includes("审核") || status.includes("下载") || status.includes("锁定") ? "done" : "";
  return <span className={`status-pill ${normalized}`}>{status}</span>;
}

function UploadDropzone({ label }: { label: string }) {
  return (
    <button className="upload-dropzone" type="button">
      <b>↑</b>
      <strong>{label}</strong>
      <span>支持 PDF、图片、Excel、Word；上传后保留版本和审核记录</span>
    </button>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <section className="page-heading inline"><h1>{title}</h1><p>{subtitle}</p></section>;
}

function PriceBlock({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className={`price-block ${compact ? "compact" : ""}`}>
      <span>{priceTermLabel}</span>
      <strong>{product.price}</strong>
      <small>非 FOB/CIF/EXW 最终报价</small>
    </div>
  );
}

function PurchaseVolumeSignal({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className={`purchase-volume-signal ${compact ? "compact" : ""}`}>
      <span>过去12个月总采购量</span>
      <strong>{product.last12MonthBoxes.toLocaleString()} 箱</strong>
      <small>已完成采购箱数</small>
    </div>
  );
}

function CostDisclosure() {
  return (
    <section className="cost-disclosure">
      <div>
        <h2>价格口径</h2>
        <p>{priceBasisText}</p>
      </div>
      <div className="cost-grid">
        {costItems.map((item) => (
          <div key={item[0]}>
            <span>{item[0]}</span>
            <strong>{item[1]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return <div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>;
}

function Spec({ label, value }: { label: string; value: string }) {
  return <div className="spec-item"><span>{label}</span><strong>{value}</strong></div>;
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-bar" aria-label={`当前进度 ${value}%`}><span style={{ width: `${value}%` }} /></div>;
}

function Bundle({ title, names, count }: { title: string; names: string; count: string }) {
  return <article className="bundle-card"><strong>{title}</strong><h3>{names}</h3><p>适合区域门店建立进口食品基础货架。</p><div><span>{count}</span><button type="button">查看组合</button></div></article>;
}

function SelectionLine({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="selection-line"><span>{icon}</span><p>{label}</p><strong>{value}</strong></div>;
}

function TrustCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="trust-card"><b>{icon}</b><div><strong>{title}</strong><p>{text}</p></div></article>;
}

export default function Home() {
  const [portal, setPortalState] = useState<Portal | null>(null);
  const [operatorRole, setOperatorRole] = useState<OperatorRole>("manager");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [operationNotice, setOperationNotice] = useState("");
  const [productCatalog, setProductCatalog] = useState<Product[]>(products);
  const [selectedId, setSelectedId] = useState(products[0].id);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedProduct = useMemo(() => productCatalog.find((product) => product.id === selectedId) ?? productCatalog[0] ?? products[0], [productCatalog, selectedId]);

  const loadProducts = () => {
    fetch("/api/products/")
      .then(async (response) => {
        const data = (await response.json()) as { products?: ApiProduct[] };
        if (response.ok && data.products) {
          const nextProducts = data.products.map(productFromApi);
          setProductCatalog(nextProducts.length ? nextProducts : products);
          if (!nextProducts.some((product) => product.id === selectedId)) {
            setSelectedId(nextProducts[0]?.id ?? products[0].id);
          }
        }
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    loadProducts();
    fetch("/api/auth/me/")
      .then(async (response) => {
        const data = (await response.json()) as { user?: AuthUser | null };
        if (response.ok && data.user) {
          enterWithUser(data.user);
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const enterWithUser = (user: AuthUser) => {
    setAuthUser(user);
    const nextPortal: Portal = user.userType === "enterprise_user" ? "buyer" : "operator";
    const nextOperatorRole: OperatorRole = user.role === "director" ? "director" : "manager";
    setPortalState(nextPortal);
    if (nextPortal === "operator") {
      setOperatorRole(nextOperatorRole);
    }
    setView("dashboard");
  };

  const logout = async () => {
    await fetch("/api/auth/logout/", { method: "POST" }).catch(() => undefined);
    setAuthUser(null);
    setPortalState(null);
    setView("dashboard");
  };

  if (!authChecked) {
    return <main className="login-page"><section className="login-card"><h1>正在检查登录状态</h1><p>请稍候...</p></section></main>;
  }

  if (!portal || view === "login") {
    return <LoginPage onLogin={enterWithUser} />;
  }

  return (
    <AppShell activeView={view} setView={setView} portal={portal} operatorRole={operatorRole} onLogout={logout} operationNotice={operationNotice} onOperation={setOperationNotice}>
      {view === "dashboard" ? <Dashboard portal={portal} operatorRole={operatorRole} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "catalog" ? <Catalog portal={portal} operatorRole={operatorRole} productCatalog={productCatalog} reloadProducts={loadProducts} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "documents" ? <FileCenterPage portal={portal} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "aiReview" ? <AiReviewPage operatorRole={operatorRole} setView={setView} /> : null}
      {view === "procurement" ? <ProcurementProgress portal={portal} operatorRole={operatorRole} productCatalog={productCatalog} setView={setView} setSelectedId={setSelectedId} setSelectedOrderId={setSelectedOrderId} /> : null}
      {view === "orderDetail" ? <OrderDetailPage orderId={selectedOrderId} portal={portal} operatorRole={operatorRole} productCatalog={productCatalog} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "progress" ? <ProgressBoard portal={portal} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "intention" ? <IntentionForm selectedProduct={selectedProduct} setView={setView} /> : null}
      {view === "intentionAdmin" ? <IntentionAdminPage operatorRole={operatorRole} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "detail" ? <DetailPage product={selectedProduct} portal={portal} operatorRole={operatorRole} setView={setView} /> : null}
      {view === "clients" ? <ClientsPage /> : null}
      {view === "reports" ? <ReportsPage /> : null}
      {view === "messages" ? <MessagesPage /> : null}
      {view === "help" ? <HelpPage /> : null}
    </AppShell>
  );
}
