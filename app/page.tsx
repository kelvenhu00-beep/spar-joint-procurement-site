"use client";

import { useMemo, useState } from "react";

type View = "dashboard" | "catalog" | "detail" | "progress" | "intention" | "account";

type Product = {
  id: string;
  brand: string;
  name: string;
  cnName: string;
  country: string;
  category: string;
  spec: string;
  caseSpec: string;
  source: string;
  sourceUrl: string;
  supplierStatus: string;
  factoryPrice: string;
  freight: string;
  tax: string;
  domestic: string;
  service: string;
  landed: string;
  containerBoxes: number;
  currentBoxes: number;
  minBoxes: number;
  leadTime: string;
  shelf: string;
  tags: string[];
  color: string;
  interestTitle: string;
  buyerReasons: string[];
  packageLook: string;
  shelfScenario: string;
  popularityEvidence: string;
  buyerRisk: string;
  originNote: string;
};

type ProcurementLens = {
  consumerHook: string;
  buyerPromise: string;
  targetStores: string[];
  retailPriceBand: string;
  grossMarginBand: string;
  trialOrderSuggestion: string;
  displayPlan: string;
  promoTrigger: string;
  objectionHandling: string;
  decisionScores: [string, number][];
  demandSignals: string[];
  purchaseTriggers: string[];
  nextAction: string;
};

const products: Product[] = [
  {
    id: "ritter-dark-100g",
    brand: "Ritter Sport",
    name: "Dark Chocolate 100g",
    cnName: "瑞特斯波德黑巧克力 100g",
    country: "德国",
    category: "巧克力",
    spec: "100g / 板",
    caseSpec: "12 板 / 箱",
    source: "Ritter Sport 官网显示 Dark Chocolate 为 100g，50% cocoa。",
    sourceUrl: "https://www.ritter-sport.com/product/dark-chocolate",
    supplierStatus: "品牌资料待复核",
    factoryPrice: "EUR 13.80 / 箱",
    freight: "RMB 2.10 / 箱",
    tax: "RMB 7.60 / 箱",
    domestic: "RMB 1.90 / 箱",
    service: "RMB 2.40 / 箱",
    landed: "RMB 128.90 / 箱",
    containerBoxes: 5200,
    currentBoxes: 3180,
    minBoxes: 5200,
    leadTime: "成团后 45-60 天",
    shelf: "以供应商正式资料为准",
    tags: ["德国知名品牌", "常温", "高认知度"],
    color: "cocoa",
    interestTitle: "德国方形巧克力，品牌识别强，适合做进口巧克力基础款。",
    buyerReasons: ["100g 标准规格，适合常规货架和收银台附近补充陈列。", "Dark Chocolate 50% cocoa 的风味表达清晰，适合成人零食和办公室消费。", "方形包装识别度强，适合做节庆组合和进口巧克力基础陈列。"],
    packageLook: "方形 100g 板装，深色巧克力包装，适合竖插陈列、挂条陈列或节庆组合装。",
    shelfScenario: "进口巧克力区、办公室零食区、礼盒旁边的价格带补充商品。",
    popularityEvidence: "品牌官网突出 Ritter Sport 以多种口味方形巧克力为核心；中国区域销量需要试销后验证。",
    buyerRisk: "巧克力对温控、夏季物流和保质期剩余要求较高，正式采购前应确认运输温控方案。",
    originNote: "Alfred Ritter GmbH & Co. KG，总部位于德国 Waldenbuch。"
  },
  {
    id: "haribo-goldbears-175g",
    brand: "HARIBO",
    name: "Goldbears 175g",
    cnName: "哈瑞宝金熊果汁软糖 175g",
    country: "德国",
    category: "糖果",
    spec: "175g / 袋",
    caseSpec: "24 袋 / 箱",
    source: "HARIBO 官网介绍 Goldbears 自 1922 年以来销售。",
    sourceUrl: "https://www.haribo.com/en/products/haribo/goldbears",
    supplierStatus: "需确认进口授权",
    factoryPrice: "EUR 19.20 / 箱",
    freight: "RMB 3.80 / 箱",
    tax: "RMB 10.40 / 箱",
    domestic: "RMB 2.70 / 箱",
    service: "RMB 3.60 / 箱",
    landed: "RMB 178.50 / 箱",
    containerBoxes: 2600,
    currentBoxes: 2110,
    minBoxes: 2600,
    leadTime: "成团后 45-60 天",
    shelf: "以供应商正式资料为准",
    tags: ["全球认知", "儿童零食", "常温"],
    color: "candy",
    interestTitle: "全球认知度高的软糖大单品，适合快速建立进口糖果货架吸引力。",
    buyerReasons: ["Goldbears 是 HARIBO 经典产品，适合家庭客群和儿童零食场景。", "175g 袋装适合超市常规货架，也便于促销堆头。", "色彩和熊形产品记忆点明确，货架识别度强。"],
    packageLook: "透明或半透明袋装视觉，彩色软糖可见度高，适合挂袋、糖果货架和儿童零食专区。",
    shelfScenario: "儿童糖果区、进口零食区、节庆糖果堆头、亲子购物动线。",
    popularityEvidence: "HARIBO 官网介绍 Goldbears 自 1922 年以来销售，并强调其为广为人知的经典产品；具体中国门店转化率仍需试销数据确认。",
    buyerRisk: "糖果类需关注中文标签、配料、添加剂合规和儿童食品宣传边界。",
    originNote: "HARIBO 为德国糖果品牌，Goldbears 为其经典软糖系列。"
  },
  {
    id: "manner-neapolitan-75g",
    brand: "Manner",
    name: "Original Neapolitan Wafers 75g",
    cnName: "曼纳原味榛子威化 75g",
    country: "奥地利",
    category: "威化饼干",
    spec: "75g / 包",
    caseSpec: "12 包 / 箱",
    source: "Manner 官网显示 Original Neapolitaner Schnitten 75g，并说明该产品 1898 年由 Josef Manner I 发明。",
    sourceUrl: "https://www.manner.com/en-us/range/wafers-more/manner-original-neapolitan-wafers-75g/",
    supplierStatus: "品牌资料较完整",
    factoryPrice: "EUR 11.40 / 箱",
    freight: "RMB 2.20 / 箱",
    tax: "RMB 6.20 / 箱",
    domestic: "RMB 1.80 / 箱",
    service: "RMB 2.20 / 箱",
    landed: "RMB 107.60 / 箱",
    containerBoxes: 4600,
    currentBoxes: 3820,
    minBoxes: 4600,
    leadTime: "成团后 40-55 天",
    shelf: "以供应商正式资料为准",
    tags: ["奥地利经典", "粉色识别", "休闲食品"],
    color: "wafer",
    interestTitle: "奥地利维也纳经典威化，粉色包装有强货架记忆点。",
    buyerReasons: ["75g 规格适合单人休闲零食，客单压力低。", "榛子可可威化口味接受度较广，适合进口零食基础 SKU。", "粉色包装识别度高，容易形成小面积主题陈列。"],
    packageLook: "粉色长方形小包装，品牌视觉鲜明，可做进口威化专区、收银台加购和办公室零食陈列。",
    shelfScenario: "进口休闲食品区、女性消费场景、下午茶零食、收银台附近加购区。",
    popularityEvidence: "Manner 官网称 Original Neapolitan Wafers 是其经典畅销产品，并说明 1898 年发明；海外知名度成立，中国区域表现需要门店试销验证。",
    buyerRisk: "威化易碎，联采前需要确认整箱抗压、运输破损率和到货验收标准。",
    originNote: "Manner 官网称该产品为维也纳经典产品。"
  },
  {
    id: "redbull-250ml",
    brand: "Red Bull",
    name: "Energy Drink 250ml",
    cnName: "红牛能量饮料 250ml",
    country: "奥地利",
    category: "饮料",
    spec: "250ml / 罐",
    caseSpec: "24 罐 / 箱",
    source: "奥地利零售页面显示 Red Bull Energy Drink 24×250ml 包装。",
    sourceUrl: "https://www.gurkerl.at/en-AT/38365-red-bull-energy-drink-dose-24x250ml-einwegpfand",
    supplierStatus: "需确认中国销售权限",
    factoryPrice: "EUR 26.40 / 箱",
    freight: "RMB 8.60 / 箱",
    tax: "RMB 14.80 / 箱",
    domestic: "RMB 5.40 / 箱",
    service: "RMB 5.20 / 箱",
    landed: "RMB 265.80 / 箱",
    containerBoxes: 1800,
    currentBoxes: 890,
    minBoxes: 1800,
    leadTime: "成团后 45-65 天",
    shelf: "以供应商正式资料为准",
    tags: ["高认知饮料", "24 罐箱规", "授权敏感"],
    color: "drink",
    interestTitle: "高认知能量饮料，能拉动饮料区即时消费，但授权与渠道边界必须先核实。",
    buyerReasons: ["250ml 标准罐装认知度高，采购人员容易判断货架位置。", "适合便利型门店、校园周边、写字楼商圈和运动场景。", "如果授权明确，可作为进口饮料区引流商品。"],
    packageLook: "细罐金属包装，蓝银红品牌视觉强，24 罐整箱适合饮料货架和冷柜陈列。",
    shelfScenario: "饮料冷柜、能量饮料专区、收银台附近即饮区、运动消费场景。",
    popularityEvidence: "奥地利零售页面显示 24×250ml 规格，Red Bull 属高认知饮料品牌；中国销售权和供货渠道必须单独核验。",
    buyerRisk: "该商品授权敏感，不能在未取得销售权限前作为确定采购商品推进。",
    originNote: "Red Bull 为奥地利能量饮料品牌，标准罐装常见规格为 250ml。"
  },
  {
    id: "walkers-fingers-250g",
    brand: "Walker's",
    name: "Shortbread Fingers 250g",
    cnName: "沃克斯黄油酥饼条 250g",
    country: "英国",
    category: "饼干",
    spec: "250g / 袋",
    caseSpec: "24 袋 / 箱",
    source: "Walker's Shortbread 官网显示 Shortbread Fingers 250g，12 thick shortbread fingers。",
    sourceUrl: "https://www.walkersshortbread.com/shortbread-fingers-250g/",
    supplierStatus: "需确认进口标签资料",
    factoryPrice: "GBP 36.00 / 箱",
    freight: "RMB 5.90 / 箱",
    tax: "RMB 18.70 / 箱",
    domestic: "RMB 4.60 / 箱",
    service: "RMB 5.80 / 箱",
    landed: "RMB 382.40 / 箱",
    containerBoxes: 2100,
    currentBoxes: 1460,
    minBoxes: 2100,
    leadTime: "成团后 50-70 天",
    shelf: "以供应商正式资料为准",
    tags: ["英国礼赠", "黄油酥饼", "节庆陈列"],
    color: "shortbread",
    interestTitle: "英国黄油酥饼代表性商品，适合节庆礼赠和进口饼干高端价格带。",
    buyerReasons: ["250g 包装含 12 条，适合家庭分享和礼赠。", "黄油酥饼风味明确，区别于普通甜饼干。", "节庆、年货、下午茶场景容易做主题陈列。"],
    packageLook: "红色格纹风格包装，英国和苏格兰识别强，适合礼赠货架、节庆端架和进口饼干区。",
    shelfScenario: "进口饼干区、节庆礼赠区、下午茶组合陈列、会员店家庭装区域。",
    popularityEvidence: "Walker's 官网称 Shortbread Fingers 是其世界知名产品，并显示 250g 规格含 12 条；国内销售表现需结合区域消费者价格接受度验证。",
    buyerRisk: "黄油含量和价格带较高，需确认区域门店是否有足够礼赠和中高端客群。",
    originNote: "Walker's 官网称 Shortbread Fingers 是其世界知名产品。"
  },
  {
    id: "twinings-eb-100ct",
    brand: "Twinings",
    name: "English Breakfast 100ct",
    cnName: "川宁英式早餐红茶 100 袋",
    country: "英国",
    category: "茶饮",
    spec: "100 袋 / 盒",
    caseSpec: "6 盒 / 箱",
    source: "Twinings USA 页面显示 English Breakfast 100ct。",
    sourceUrl: "https://twiningsusa.com/products/english-breakfast",
    supplierStatus: "需确认中文标签",
    factoryPrice: "GBP 42.00 / 箱",
    freight: "RMB 3.80 / 箱",
    tax: "RMB 13.90 / 箱",
    domestic: "RMB 3.20 / 箱",
    service: "RMB 5.10 / 箱",
    landed: "RMB 428.60 / 箱",
    containerBoxes: 2400,
    currentBoxes: 980,
    minBoxes: 2400,
    leadTime: "成团后 50-70 天",
    shelf: "以供应商正式资料为准",
    tags: ["英国茶饮", "早餐场景", "家庭装"],
    color: "tea",
    interestTitle: "英国经典红茶家庭装，适合做进口茶饮的稳定复购型商品。",
    buyerReasons: ["100 袋规格适合家庭和办公室长期饮用。", "English Breakfast 口味认知清晰，便于门店理解早餐和热饮场景。", "与饼干、果酱、早餐食品可做组合陈列。"],
    packageLook: "盒装茶包，适合竖放陈列，包装信息完整度对采购信心很关键。",
    shelfScenario: "进口茶饮区、早餐食品区、办公室采购场景、会员店家庭装区域。",
    popularityEvidence: "Twinings 页面显示 English Breakfast 100ct，并介绍其为多产区红茶拼配；区域销售表现需看当地茶饮消费习惯。",
    buyerRisk: "茶叶需重点确认中文标签、生产日期、保质期剩余和进口食品备案资料。",
    originNote: "Twinings 为英国茶品牌，English Breakfast 为其经典红茶系列。"
  },
  {
    id: "mcvities-digestives-400g",
    brand: "McVitie's",
    name: "Digestives Original 400g",
    cnName: "麦维他原味消化饼干 400g",
    country: "英国",
    category: "饼干",
    spec: "400g / 包",
    caseSpec: "12 包 / 箱",
    source: "英国食品零售页面显示 McVitie's Digestives Original 400g。",
    sourceUrl: "https://myersofkeswick.com/products/mcvities-digestives-400g",
    supplierStatus: "需确认进口授权",
    factoryPrice: "GBP 18.60 / 箱",
    freight: "RMB 4.30 / 箱",
    tax: "RMB 10.70 / 箱",
    domestic: "RMB 3.40 / 箱",
    service: "RMB 3.90 / 箱",
    landed: "RMB 205.30 / 箱",
    containerBoxes: 2600,
    currentBoxes: 1750,
    minBoxes: 2600,
    leadTime: "成团后 50-70 天",
    shelf: "以供应商正式资料为准",
    tags: ["英国经典", "饼干大单品", "高复购"],
    color: "digestive",
    interestTitle: "英国消化饼干大规格基础款，适合做进口饼干区走量商品。",
    buyerReasons: ["400g 规格适合家庭消费，和普通小包装形成差异。", "Digestives 作为英国经典饼干，消费者教育成本较低。", "适合与牛奶、咖啡、红茶做早餐或下午茶组合陈列。"],
    packageLook: "筒状或袋装饼干包装，主视觉直接，适合饼干货架横向陈列。",
    shelfScenario: "进口饼干区、早餐食品区、家庭装区域、茶咖搭配陈列。",
    popularityEvidence: "英国食品零售页面将 McVitie's Digestives Original 400g 作为常规销售商品展示；中国区域复购表现需后续试销验证。",
    buyerRisk: "大包装需要关注破损率、保质期剩余和价格带对比国产饼干后的动销压力。",
    originNote: "McVitie's 为英国经典饼干品牌，Digestives 是其高认知系列。"
  }
];

function productProgress(product: Product) {
  return Math.min(100, Math.round((product.currentBoxes / product.minBoxes) * 100));
}

const defaultProcurementLens: ProcurementLens = {
  consumerHook: "进口商品身份清晰，适合先用少量门店验证动销。",
  buyerPromise: "用小批量意向换取成柜机会，降低单企业独立采购压力。",
  targetStores: ["区域旗舰店", "精品超市", "进口食品区"],
  retailPriceBand: "待区域试销确认",
  grossMarginBand: "待人工测算",
  trialOrderSuggestion: "先选择 10-20 家门店试销，观察 4 周动销和复购。",
  displayPlan: "用端架或进口商品小专区做集中陈列，避免分散在普通货架中失去识别。",
  promoTrigger: "达到 70% 成团进度后提醒采购复核数量。",
  objectionHandling: "如果担心动销，可先申请样品、门店试吃或小范围陈列测试。",
  decisionScores: [["品牌拉力", 70], ["陈列吸引", 68], ["成团机会", 65], ["风险可控", 62], ["利润空间", 60]],
  demandSignals: ["有明确进口身份", "规格适合超市销售", "可与现有品类形成补充"],
  purchaseTriggers: ["样品确认", "达到 20 尺柜临界点", "同区域客户共同参与"],
  nextAction: "提交小批量意向，等待平台汇总成团进度。"
};

const procurementLenses: Record<string, ProcurementLens> = {
  "ritter-dark-100g": {
    consumerHook: "消费者看到的是德国品牌、方形包装、成人巧克力口味，购买理由比普通甜巧克力更清楚。",
    buyerPromise: "它适合做进口巧克力基础款，不靠单次爆发，而靠稳定货架存在和节庆组合销售。",
    targetStores: ["精品超市", "社区中高端门店", "办公室客群门店"],
    retailPriceBand: "RMB 16.90-22.90 / 板",
    grossMarginBand: "24%-34%",
    trialOrderSuggestion: "建议先试 20-30 家门店，每店 2-3 箱，重点看夏季损耗和复购。",
    displayPlan: "进口巧克力竖插陈列；节庆期可与咖啡、威化、礼袋做组合。",
    promoTrigger: "情人节、圣诞、年货节、办公室零食主题。",
    objectionHandling: "采购若担心夏季损耗，应先确认温控运输、到仓温度记录和门店陈列温度。",
    decisionScores: [["品牌拉力", 82], ["陈列吸引", 78], ["成团机会", 61], ["风险可控", 58], ["利润空间", 70]],
    demandSignals: ["德国品牌心智强", "100g 标准规格易定价", "适合节庆组合陈列"],
    purchaseTriggers: ["温控方案确认", "报价有效期明确", "节庆档期前 60 天成团"],
    nextAction: "先提交 80-120 箱意向，并要求平台补充夏季温控方案。"
  },
  "haribo-goldbears-175g": {
    consumerHook: "消费者第一眼能识别彩色软糖和儿童零食场景，适合用来提升进口糖果区活跃度。",
    buyerPromise: "它的价值是引流和稳定动销，不是高客单；适合区域超市快速补强进口糖果货架。",
    targetStores: ["社区家庭型门店", "亲子客群门店", "节庆糖果陈列门店"],
    retailPriceBand: "RMB 19.90-26.90 / 袋",
    grossMarginBand: "26%-36%",
    trialOrderSuggestion: "建议先试 30-50 家门店，每店 2 箱，观察周末和节庆前动销。",
    displayPlan: "挂袋区、儿童糖果区、收银台附近做彩色视觉集中陈列。",
    promoTrigger: "儿童节、开学季、万圣节、圣诞糖果主题。",
    objectionHandling: "糖分、配料、添加剂和儿童食品宣传边界需先完成合规复核，不做功效表达。",
    decisionScores: [["品牌拉力", 88], ["陈列吸引", 91], ["成团机会", 81], ["风险可控", 68], ["利润空间", 72]],
    demandSignals: ["经典软糖产品", "包装视觉强", "亲子购物场景明确"],
    purchaseTriggers: ["成团进度超过 80%", "节庆档期临近", "样品试吃反馈良好"],
    nextAction: "优先追加采购意向，因为当前成团进度高，适合推动二次确认。"
  },
  "manner-neapolitan-75g": {
    consumerHook: "粉色包装和奥地利威化身份能快速形成记忆点，适合激发采购对陈列效果的想象。",
    buyerPromise: "它适合做进口零食区的漂亮小单品，客单压力低，适合试错。",
    targetStores: ["精品超市", "女性客群门店", "写字楼周边门店"],
    retailPriceBand: "RMB 9.90-13.90 / 包",
    grossMarginBand: "28%-38%",
    trialOrderSuggestion: "建议先试 40 家门店，每店 2 箱，重点看收银台和进口零食区两个位置。",
    displayPlan: "粉色小专区、下午茶主题、咖啡旁边交叉陈列。",
    promoTrigger: "下午茶主题、女神节、办公室零食、会员日加购。",
    objectionHandling: "如果担心破损，应先要求平台展示外箱抗压、装柜方式和到货破损处理规则。",
    decisionScores: [["品牌拉力", 76], ["陈列吸引", 90], ["成团机会", 83], ["风险可控", 63], ["利润空间", 75]],
    demandSignals: ["包装辨识度高", "价格带低于礼赠型进口食品", "威化口味接受度广"],
    purchaseTriggers: ["样品到店陈列好看", "成团进度接近满柜", "可与茶咖形成组合"],
    nextAction: "提交基础意向，并要求平台补充实物包装和外箱照片。"
  },
  "redbull-250ml": {
    consumerHook: "消费者认知强，购买决策快，适合饮料冷柜和即时消费场景。",
    buyerPromise: "如果授权和渠道清楚，它能成为进口饮料区的引流商品；但必须先过授权关。",
    targetStores: ["便利型超市", "校园周边门店", "写字楼商圈门店"],
    retailPriceBand: "RMB 9.90-13.90 / 罐",
    grossMarginBand: "18%-28%",
    trialOrderSuggestion: "建议先做少量门店冷柜测试，不建议在授权未确认前大量提交。",
    displayPlan: "冷柜黄金层、运动饮料旁边、收银台即时饮用区。",
    promoTrigger: "高温季、考试季、运动场景、夜间消费门店。",
    objectionHandling: "授权、中文标签和渠道合法性需先确认，未确认前不进入大额意向。",
    decisionScores: [["品牌拉力", 92], ["陈列吸引", 84], ["成团机会", 49], ["风险可控", 35], ["利润空间", 55]],
    demandSignals: ["消费者认知高", "即饮场景强", "冷柜转化快"],
    purchaseTriggers: ["销售授权确认", "中文标签确认", "渠道价格不冲突"],
    nextAction: "暂不建议大额意向，先申请授权资料和渠道边界确认。"
  },
  "walkers-fingers-250g": {
    consumerHook: "英国黄油酥饼能讲清楚礼赠、下午茶和进口食品质感，适合提升门店形象。",
    buyerPromise: "它不是最低价走量商品，而是节庆和精品门店的价格带补充。",
    targetStores: ["区域旗舰店", "精品超市", "节庆礼赠门店"],
    retailPriceBand: "RMB 39.90-49.90 / 袋",
    grossMarginBand: "22%-32%",
    trialOrderSuggestion: "建议围绕节庆档期试 20 家门店，每店 2 箱，同时测试礼赠组合。",
    displayPlan: "英伦下午茶主题端架；与红茶、果酱、咖啡做组合陈列。",
    promoTrigger: "中秋、圣诞、年货节、下午茶主题月。",
    objectionHandling: "如果采购担心价格偏高，应把门店限定在中高端客群和礼赠场景，不做全渠道铺货。",
    decisionScores: [["品牌拉力", 79], ["陈列吸引", 86], ["成团机会", 70], ["风险可控", 61], ["利润空间", 64]],
    demandSignals: ["礼赠场景明确", "英国来源易讲故事", "可与茶饮组合销售"],
    purchaseTriggers: ["节庆档期锁定", "门店客群匹配", "组合陈列物料确认"],
    nextAction: "按节庆门店清单提交意向，不建议平均铺到所有门店。"
  },
  "twinings-eb-100ct": {
    consumerHook: "英式早餐红茶有明确使用场景，适合家庭和办公室长期消费。",
    buyerPromise: "它更像稳定复购品，不靠冲动购买；适合做进口茶饮基础 SKU。",
    targetStores: ["精品超市", "会员店", "办公室客群门店"],
    retailPriceBand: "RMB 69.90-89.90 / 盒",
    grossMarginBand: "20%-30%",
    trialOrderSuggestion: "建议与饼干、果酱、咖啡一起测试欧洲早餐主题陈列。",
    displayPlan: "早餐食品区、茶咖区、进口食品主题墙。",
    promoTrigger: "早餐主题、办公室囤货、会员日、秋冬热饮季。",
    objectionHandling: "如果担心茶包周转慢，应控制试点门店范围，并用组合陈列提高理解速度。",
    decisionScores: [["品牌拉力", 83], ["陈列吸引", 66], ["成团机会", 41], ["风险可控", 72], ["利润空间", 58]],
    demandSignals: ["家庭装规格", "早餐场景清楚", "适合组合陈列"],
    purchaseTriggers: ["组合主题确认", "中文标签资料齐备", "试点门店客群匹配"],
    nextAction: "不要单品孤立采购，建议与 Walkers 或 McVitie's 组成早餐主题意向。"
  },
  "mcvities-digestives-400g": {
    consumerHook: "英国消化饼干是容易被消费者理解的家庭装饼干，适合做进口饼干走量基础款。",
    buyerPromise: "它的优势在于高复购和场景普适，适合区域超市做进口饼干常规陈列。",
    targetStores: ["社区家庭型门店", "会员店", "进口食品区成熟门店"],
    retailPriceBand: "RMB 24.90-32.90 / 包",
    grossMarginBand: "23%-33%",
    trialOrderSuggestion: "建议选择 30 家家庭客群门店，每店 3 箱，观察 4 周复购。",
    displayPlan: "与牛奶、咖啡、红茶做早餐组合；进口饼干区做大包装陈列。",
    promoTrigger: "早餐主题、会员囤货、家庭分享装促销。",
    objectionHandling: "如果采购担心大包装价格竞争，需要和国产饼干区隔陈列，强调英国进口和早餐场景。",
    decisionScores: [["品牌拉力", 77], ["陈列吸引", 70], ["成团机会", 67], ["风险可控", 69], ["利润空间", 70]],
    demandSignals: ["家庭装规格", "早餐搭配场景", "进口饼干基础款"],
    purchaseTriggers: ["门店已有进口饼干货架", "家庭客群占比高", "可做早餐组合"],
    nextAction: "提交中等数量意向，并搭配 Twinings 做主题组合。"
  }
};

function getLens(product: Product) {
  return procurementLenses[product.id] ?? defaultProcurementLens;
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState(products[1].id);
  const selected = products.find((item) => item.id === selectedId) ?? products[0];
  const sorted = useMemo(() => [...products].sort((a, b) => productProgress(b) - productProgress(a)), []);

  function openDetail(id: string) {
    setSelectedId(id);
    setView("detail");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">S</div><div><strong>SPAR 联采</strong><span>进口商品 B2B 平台</span></div></div>
        <nav className="side-nav">
          {[
            ["dashboard", "工作台"],
            ["catalog", "商品目录"],
            ["progress", "成团进度"],
            ["intention", "采购意向"],
            ["account", "企业账户"],
          ].map(([key, label]) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key as View)} type="button">{label}</button>
          ))}
        </nav>
        <div className="account-card">
          <span>当前企业</span><strong>家家悦集团采购中心</strong><small>食品采购部 · 王经理</small>
        </div>
      </aside>

      <main className="workspace">
        {view === "dashboard" && <Dashboard sorted={sorted} openDetail={openDetail} setView={setView} />}
        {view === "catalog" && <Catalog openDetail={openDetail} />}
        {view === "detail" && <Detail product={selected} setView={setView} />}
        {view === "progress" && <ProgressList openDetail={openDetail} />}
        {view === "intention" && <Intention selected={selected} setSelectedId={setSelectedId} />}
        {view === "account" && <Account />}
      </main>
    </div>
  );
}

function Header({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <header className="topbar"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><div className="top-actions">{action}</div></header>;
}

function Dashboard({ sorted, openDetail, setView }: { sorted: Product[]; openDetail: (id: string) => void; setView: (view: View) => void }) {
  const topProduct = sorted[0];
  const pct = productProgress(topProduct);
  const topLens = getLens(topProduct);
  return <>
    <Header eyebrow="企业采购工作台" title="进口商品联采系统" action={<button className="primary-button" onClick={() => setView("catalog")} type="button">进入商品目录</button>} />
    <section className="status-row">
      <article><span>真实商品资料</span><strong>{products.length}</strong><small>德国、奥地利、英国商品</small></article>
      <article><span>接近成团</span><strong>{products.filter((item) => productProgress(item) >= 70).length}</strong><small>超过 70% 的单品</small></article>
      <article><span>我的意向</span><strong>12</strong><small>待二次确认 3 个</small></article>
      <article><span>费用拆解</span><strong>5 项</strong><small>采购价、运输、税费、配送、服务费</small></article>
    </section>
    <section className="content-grid">
      <div className="main-column">
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">重点单品</p><h2>成团进度高、资料相对完整的商品</h2></div><button className="link-button" onClick={() => setView("catalog")} type="button">全部商品</button></div><div className="product-grid">{sorted.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} openDetail={openDetail} />)}</div></section>
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">主题组合</p><h2>按消费场景组织商品</h2></div></div><div className="bundle-grid">{[
          ["欧洲早餐组合", "Twinings + Walker's + McVitie's", "适合精品超市、会员店、办公室客群门店。"],
          ["儿童糖果引流组合", "HARIBO + 低客单威化", "适合亲子客群、节庆糖果、收银台附近陈列。"],
          ["进口零食基础组合", "Ritter Sport + Manner + McVitie's", "适合区域门店先建立进口食品基础货架。"],
        ].map(([title, mix, text]) => <div className="bundle-card" key={title}><h3>{title}</h3><strong>{mix}</strong><p>{text}</p></div>)}</div></section>
      </div>
      <aside className="right-column"><section className="panel progress-panel"><div className="panel-head"><div><p className="eyebrow">最高成团进度</p><h2>{topProduct.cnName}</h2></div><span className="privacy-pill">仅显示总量</span></div><ProgressRing pct={pct} /><div className="progress-meta"><div><span>已收集</span><strong>{topProduct.currentBoxes} 箱</strong></div><div><span>成团目标</span><strong>{topProduct.minBoxes} 箱</strong></div></div><button className="primary-button full" onClick={() => setView("progress")} type="button">成团看板</button></section><section className="panel action-panel"><p className="eyebrow">处理建议</p><h2>{topLens.nextAction}</h2><p>{topLens.promoTrigger}</p></section><section className="panel notice"><h2>资料状态</h2><p>公开资料已录入；箱规、费用、装柜量和毛利带需供应商及内部复核。</p></section></aside>
    </section>
  </>;
}

function ProductCard({ product, openDetail }: { product: Product; openDetail: (id: string) => void }) {
  const lens = getLens(product);
  return <article className="product-card"><div className={`product-art ${product.color}`} /><div className="tag-row"><span>{product.country}</span><span>{product.category}</span></div><h3>{product.cnName}</h3><p>{lens.consumerHook}</p><div className="mini-metrics"><div><span>售价带</span><strong>{lens.retailPriceBand}</strong></div><div><span>毛利带</span><strong>{lens.grossMarginBand}</strong></div></div><div className="price-line"><strong>{product.landed}</strong><span>到仓成本</span></div><button className="card-button" onClick={() => openDetail(product.id)} type="button">详情</button></article>;
}

function Catalog({ openDetail }: { openDetail: (id: string) => void }) {
  const [filter, setFilter] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const rows = products.filter((product) => (filter === "全部" || product.country === filter) && `${product.brand} ${product.name} ${product.cnName} ${product.country} ${product.category}`.toLowerCase().includes(keyword.toLowerCase()));
  return <>
    <Header eyebrow="商品目录" title="欧洲进口商品池" action={<label className="search"><span>搜索</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="输入品牌、商品名、国家" /></label>} />
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">筛选</p><h2>按国家查看</h2></div><div className="filters">{["全部", "德国", "奥地利", "英国"].map((item) => <button key={item} className={filter === item ? "filter active" : "filter"} onClick={() => setFilter(item)} type="button">{item}</button>)}</div></div><div className="catalog-list">{rows.map((product) => { const lens = getLens(product); return <article className="catalog-item" key={product.id}><div className={`mini-art ${product.color}`} /><div><h3>{product.cnName}</h3><p>{product.brand} · {product.name} · {product.spec}</p><p>{lens.consumerHook}</p><div className="tag-row"><span>{product.country}</span><span>{product.category}</span><span>{product.supplierStatus}</span></div></div><div><strong>{lens.retailPriceBand}</strong><p>售价带</p></div><div><strong>{lens.grossMarginBand}</strong><p>毛利带</p></div><button className="link-button" onClick={() => openDetail(product.id)} type="button">详情</button></article>; })}</div></section>
  </>;
}

function Detail({ product, setView }: { product: Product; setView: (view: View) => void }) {
  const pct = productProgress(product);
  const lens = getLens(product);
  return <>
    <Header eyebrow="商品详情" title={product.cnName} action={<button className="ghost-button" onClick={() => setView("catalog")} type="button">返回目录</button>} />
    <section className="content-grid">
      <div className="main-column">
        <section className="panel product-hero-panel"><div className="detail-grid"><div className={`detail-art ${product.color}`} /><div className="product-story"><div className="tag-row">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><p className="eyebrow">商品概览</p><h2>{lens.consumerHook}</h2><p>{lens.buyerPromise}</p></div></div></section>
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">核心卖点</p><h2>门店销售与陈列价值</h2></div></div><div className="reason-grid">{product.buyerReasons.map((reason, index) => <div className="reason-card" key={reason}><span>0{index + 1}</span><p>{reason}</p></div>)}</div></section>
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">价格与试销</p><h2>售价带、毛利带、试单范围</h2></div><span className="source-pill">待复核</span></div><div className="commercial-grid"><div className="commercial-card strong-card"><span>售价带</span><strong>{lens.retailPriceBand}</strong></div><div className="commercial-card"><span>毛利带</span><strong>{lens.grossMarginBand}</strong></div><div className="commercial-card"><span>试单范围</span><strong>{lens.trialOrderSuggestion}</strong></div><div className="commercial-card"><span>适配门店</span><div className="tag-row">{lens.targetStores.map((store) => <span key={store}>{store}</span>)}</div></div></div></section>
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">{product.brand} · {product.country} · {product.category}</p><h2>{product.name}</h2></div><span className="review-badge">{product.supplierStatus}</span></div><div className="detail-grid"><div className={`detail-art ${product.color}`} /><div className="spec-list">{[["英文商品名", product.name], ["规格", product.spec], ["整箱规格", product.caseSpec], ["国家", product.country], ["起团基准", "20 尺柜"], ["装柜箱数", `${product.containerBoxes} 箱`], ["预计周期", product.leadTime], ["保质期", product.shelf]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div></section>
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">包装与陈列</p><h2>包装、陈列、促销、需求信号</h2></div></div><div className="merch-grid">{[["外观包装", product.packageLook], ["陈列方案", lens.displayPlan], ["促销触发点", lens.promoTrigger], ["受欢迎程度依据", product.popularityEvidence], ["需求信号", lens.demandSignals.join("；")], ["风险提示", product.buyerRisk]].map(([label, text]) => <div className="source-card" key={label}><h3>{label}</h3><p>{text}</p></div>)}</div></section>
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">成本构成</p><h2>出厂价、物流、税费、配送</h2></div><span className="source-pill">待复核</span></div><div className="cost-board">{[["出厂参考价", product.factoryPrice], ["国际运输", product.freight], ["进口税费", product.tax], ["国内配送", product.domestic], ["到仓成本", product.landed]].map(([label, value], index) => <div className={index === 4 ? "total" : ""} key={label}><span>{label}</span><strong>{value}</strong><small>{index === 4 ? "非锁定价" : "待复核"}</small></div>)}</div></section>
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">风险提示</p><h2>采购前需确认事项</h2></div></div><div className="objection-card"><strong>{lens.objectionHandling}</strong></div></section>
        <section className="panel"><div className="panel-head"><div><p className="eyebrow">资料依据</p><h2>公开资料与待复核字段</h2></div></div><div className="source-list"><div className="source-card"><h3>公开资料</h3><p>{product.source}</p><p><a href={product.sourceUrl} target="_blank" rel="noreferrer">打开来源页面</a></p></div><div className="source-card"><h3>待复核字段</h3><p>整箱规格、出厂参考价、运输费用、税费、国内配送、服务费、装柜箱数、售价带和毛利带。</p></div></div></section>
      </div>
      <aside className="right-column"><section className="panel progress-panel"><div className="panel-head"><div><p className="eyebrow">成团进度</p><h2>20 尺柜意向量</h2></div><span className="privacy-pill">仅显示总量</span></div><ProgressRing pct={pct} /><div className="progress-meta"><div><span>已收集</span><strong>{product.currentBoxes} 箱</strong></div><div><span>成团目标</span><strong>{product.minBoxes} 箱</strong></div></div><button className="primary-button full" onClick={() => setView("intention")} type="button">提交意向</button></section><section className="panel"><div className="panel-head"><div><p className="eyebrow">商品评分</p><h2>品牌、陈列、成团、风险、利润</h2></div></div><ScoreBars scores={lens.decisionScores} /></section><section className="panel action-panel"><p className="eyebrow">处理建议</p><h2>{lens.nextAction}</h2><div className="trigger-list">{lens.purchaseTriggers.map((item) => <span key={item}>{item}</span>)}</div></section><section className="panel notice"><h2>企业隐私</h2><p>仅显示总体成团进度，不展示其他企业名称、参与数量和采购条件。</p></section></aside>
    </section>
  </>;
}

function ProgressRing({ pct }: { pct: number }) {
  return <><div className="progress-ring" style={{ "--progress": `${pct}%` } as React.CSSProperties}><div><strong>{pct}%</strong><span>当前进度</span></div></div><div className="progress-bar" style={{ "--progress": `${pct}%` } as React.CSSProperties}><span /></div></>;
}

function ScoreBars({ scores }: { scores: [string, number][] }) {
  return <div className="score-list">{scores.map(([label, score]) => <div className="score-row" key={label}><div><strong>{label}</strong><span>{score}</span></div><div className="score-track"><i style={{ width: `${score}%` }} /></div></div>)}</div>;
}

function ProgressList({ openDetail }: { openDetail: (id: string) => void }) {
  return <><Header eyebrow="成团进度" title="单品 20 尺柜进度看板" /><section className="panel"><div className="panel-head"><div><p className="eyebrow">总进度展示</p><h2>企业端不展示其他参与企业</h2></div><span className="privacy-pill">隐私保护</span></div><div className="progress-list">{[...products].sort((a, b) => productProgress(b) - productProgress(a)).map((product) => { const pct = productProgress(product); return <article className="progress-item" key={product.id}><div className={`mini-art ${product.color}`} /><div><h3>{product.cnName}</h3><p>{product.brand} · {product.country} · {product.caseSpec}</p></div><div className="progress-strip"><strong>{pct}%</strong><div className="progress-bar" style={{ "--progress": `${pct}%` } as React.CSSProperties}><span /></div></div><div><strong>{product.currentBoxes} / {product.minBoxes} 箱</strong><p>当前总意向</p></div><button className="link-button" onClick={() => openDetail(product.id)} type="button">详情</button></article>; })}</div></section></>;
}

function Intention({ selected, setSelectedId }: { selected: Product; setSelectedId: (id: string) => void }) {
  const product = selected;
  return <><Header eyebrow="采购意向" title="提交企业采购意向" /><section className="content-grid"><div className="main-column"><section className="panel"><div className="panel-head"><div><p className="eyebrow">意向表单</p><h2>仅形成意向，不锁定价格、库存和交期</h2></div></div><form className="form-grid"><label>商品<select value={product.id} onChange={(event) => setSelectedId(event.target.value)}>{products.map((item) => <option key={item.id} value={item.id}>{item.cnName}</option>)}</select></label><label>意向数量<input type="number" defaultValue="120" min="1" /></label><label>收货区域<select defaultValue="山东区域仓"><option>山东区域仓</option><option>华南区域仓</option><option>湖南区域仓</option><option>华中区域仓</option></select></label><label>期望到货窗口<input defaultValue="2026 年 Q4" /></label><label className="wide-label">备注<textarea rows={5} placeholder="填写陈列计划、门店覆盖、采购审批要求或其他说明" /></label><div className="form-note">提交后平台只记录企业采购意向。达到 20 尺柜后，平台发起二次确认；正式采买前再确认价格、合同、预付款和交期。</div><button className="primary-button" type="button">提交意向</button></form></section></div><aside className="right-column"><section className="panel"><div className="panel-head"><div><p className="eyebrow">当前选择</p><h2>{product.cnName}</h2></div></div><div className="intent-list"><div><strong>{product.spec} · {product.caseSpec}</strong><span>规格</span></div><div><strong>{product.landed}</strong><span>预估到仓成本</span></div><div><strong>{productProgress(product)}%</strong><span>成团进度</span></div></div></section><section className="panel notice"><h2>意向规则</h2><p>企业可修改或撤回意向；成团后二次确认前，平台不应对外承诺最终成交价格。</p></section></aside></section></>;
}

function Account() {
  return <><Header eyebrow="企业账户" title="企业与员工账户层级" /><section className="content-grid"><div className="main-column"><section className="panel"><div className="panel-head"><div><p className="eyebrow">企业档案</p><h2>家家悦集团采购中心</h2></div><span className="review-badge">已启用</span></div><div className="account-grid">{[["企业账户", "统一管理采购权限、收货区域、结算资料和授权联系人。"], ["员工账户", "企业账户下可配置采购负责人、品类负责人、财务复核和管理层查看权限。"], ["数据隔离", "企业只看到本企业意向、平台总成团进度和公开商品信息。"], ["审批状态", "后续可增加企业内部审批、二次确认和预付款确认流程。"]].map(([title, text]) => <div className="table-card" key={title}><h3>{title}</h3><p>{text}</p></div>)}</div></section></div><aside className="right-column"><section className="panel"><div className="panel-head"><div><p className="eyebrow">员工账户</p><h2>示例人员</h2></div></div><div className="intent-list"><div><strong>王经理</strong><span>食品采购部 · 可提交意向</span></div><div><strong>李主管</strong><span>休闲食品品类 · 可查看成本</span></div><div><strong>张总</strong><span>管理层 · 可查看全部进度</span></div></div></section></aside></section></>;
}
