"use client";

import { useMemo, useState } from "react";

type View = "dashboard" | "catalog" | "progress" | "intention" | "detail" | "account" | "reports";

type Product = {
  id: string;
  cnName: string;
  brand: string;
  enName: string;
  country: "德国" | "奥地利" | "英国";
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
  tags: string[];
  summary: string;
  decisionNote: string;
  image: string;
};

const products: Product[] = [
  {
    id: "manner-neapolitan-75g",
    cnName: "曼纳原味榛子威化 75g",
    brand: "Manner",
    enName: "Original Neapolitan Wafers 75g",
    country: "奥地利",
    flag: "🇦🇹",
    category: "威化饼干",
    spec: "75g / 包",
    caseSpec: "12 包 / 箱",
    shelfLife: "12 个月",
    price: "¥ 107.60 / 箱",
    priceBand: "RMB 9.90-13.90 / 包",
    gross: "28%~38%",
    moq: "MOQ 10 箱起订",
    currentBoxes: 3820,
    targetBoxes: 4600,
    tags: ["奥地利", "威化饼干", "品牌资料较完整"],
    summary: "粉色包装和奥地利威化身份能快速形成记忆点，适合激发采购对陈列效果的想象。",
    decisionNote: "适合下午茶、女神节、办公室零食、会员日加购等场景，可作为进口零食基础款。",
    image: "/product-assets/manner.png",
  },
  {
    id: "haribo-goldbears-175g",
    cnName: "哈瑞宝金熊果汁软糖 175g",
    brand: "HARIBO",
    enName: "Goldbears 175g",
    country: "德国",
    flag: "🇩🇪",
    category: "糖果",
    spec: "175g / 袋",
    caseSpec: "24 袋 / 箱",
    shelfLife: "18 个月",
    price: "¥ 178.50 / 箱",
    priceBand: "RMB 19.90-26.90 / 袋",
    gross: "26%~36%",
    moq: "MOQ 8 箱起订",
    currentBoxes: 2110,
    targetBoxes: 2600,
    tags: ["德国", "糖果", "需确认进口授权"],
    summary: "消费者第一眼能识别彩色软糖和儿童零食场景，适合用来提升进口糖果区活跃度。",
    decisionNote: "适合亲子客群、节庆糖果、收银台附近陈列；正式推进前需要确认进口授权。",
    image: "/product-assets/haribo.png",
  },
  {
    id: "walkers-fingers-250g",
    cnName: "沃克斯黄油酥饼条 250g",
    brand: "Walker's",
    enName: "Shortbread Fingers 250g",
    country: "英国",
    flag: "🇬🇧",
    category: "饼干",
    spec: "250g / 盒",
    caseSpec: "24 盒 / 箱",
    shelfLife: "15 个月",
    price: "¥ 382.40 / 箱",
    priceBand: "RMB 39.90-49.90 / 袋",
    gross: "22%~32%",
    moq: "MOQ 6 箱起订",
    currentBoxes: 1460,
    targetBoxes: 2100,
    tags: ["英国", "饼干", "需确认进口标签资料"],
    summary: "英国黄油酥饼身份清晰，适合提升门店进口食品质感，并承接节庆礼赠需求。",
    decisionNote: "适合精品超市、会员店、办公零食区和下午茶组合陈列，价格带要结合区域客群验证。",
    image: "/product-assets/walkers.png",
  },
  {
    id: "ritter-dark-100g",
    cnName: "瑞特斯波德黑巧克力 100g",
    brand: "Ritter Sport",
    enName: "Dark Chocolate 100g",
    country: "德国",
    flag: "🇩🇪",
    category: "巧克力",
    spec: "100g / 板",
    caseSpec: "12 板 / 箱",
    shelfLife: "12 个月",
    price: "¥ 128.90 / 箱",
    priceBand: "RMB 16.90-22.90 / 板",
    gross: "24%~34%",
    moq: "MOQ 10 箱起订",
    currentBoxes: 3180,
    targetBoxes: 5200,
    tags: ["德国", "巧克力", "品牌资料待审核"],
    summary: "消费者喜爱的经典高品质黑巧，方形包装、成人巧克力口味，购买理由比普通甜巧克力更清楚。",
    decisionNote: "适合进口巧克力区、办公室零食区、节庆组合；夏季需要确认温控物流方案。",
    image: "/product-assets/ritter.png",
  },
  {
    id: "mcvities-digestives-400g",
    cnName: "麦维他原味消化饼干 400g",
    brand: "McVitie's",
    enName: "Original Digestives 400g",
    country: "英国",
    flag: "🇬🇧",
    category: "饼干",
    spec: "400g / 包",
    caseSpec: "12 包 / 箱",
    shelfLife: "12 个月",
    price: "¥ 226.80 / 箱",
    priceBand: "RMB 24.90-32.90 / 包",
    gross: "23%~33%",
    moq: "MOQ 8 箱起订",
    currentBoxes: 1750,
    targetBoxes: 2600,
    tags: ["英国", "饼干", "家庭分享装"],
    summary: "经典英式消化饼干，家庭装规格更适合区域超市日常复购货架。",
    decisionNote: "适合早餐、办公室茶点和家庭装区域，可与茶饮形成组合陈列。",
    image: "/product-assets/mcvities.png",
  },
  {
    id: "redbull-250ml",
    cnName: "红牛能量饮料 250ml",
    brand: "Red Bull",
    enName: "Energy Drink 250ml",
    country: "奥地利",
    flag: "🇦🇹",
    category: "饮料",
    spec: "250ml / 罐",
    caseSpec: "24 罐 / 箱",
    shelfLife: "18 个月",
    price: "¥ 265.80 / 箱",
    priceBand: "RMB 9.90-13.90 / 罐",
    gross: "18%~28%",
    moq: "MOQ 12 箱起订",
    currentBoxes: 890,
    targetBoxes: 1800,
    tags: ["奥地利", "饮料", "需确认中国销售权限"],
    summary: "消费者认知强，购买决策快，适合饮料冷柜和即时消费场景。",
    decisionNote: "品牌授权和渠道边界必须在正式采购前确认，适合先做权限核验商品。",
    image: "/product-assets/redbull.png",
  },
  {
    id: "twinings-eb-100ct",
    cnName: "川宁英式早餐红茶 100 袋",
    brand: "Twinings",
    enName: "English Breakfast 100ct",
    country: "英国",
    flag: "🇬🇧",
    category: "茶叶",
    spec: "100 袋 / 盒",
    caseSpec: "6 盒 / 箱",
    shelfLife: "24 个月",
    price: "¥ 428.60 / 箱",
    priceBand: "RMB 69.90-89.90 / 盒",
    gross: "28%~38%",
    moq: "MOQ 6 箱起订",
    currentBoxes: 980,
    targetBoxes: 2400,
    tags: ["英国", "茶叶", "品牌资料较完整"],
    summary: "标准英式早餐茶，消费者认知面宽，适合家庭及办公饮用场景。",
    decisionNote: "适合早餐食品区、进口茶饮区和办公室团购场景，需重点确认中文标签资料。",
    image: "/product-assets/twinings.png",
  },
];

const countryTabs = ["全部", "德国", "奥地利", "英国"];

const navItems: { label: string; view: View; icon: string; badge?: string; dividerBefore?: boolean }[] = [
  { label: "工作台", view: "dashboard", icon: "⌂" },
  { label: "商品目录", view: "catalog", icon: "▤" },
  { label: "成团进度", view: "progress", icon: "▧" },
  { label: "采购意向", view: "intention", icon: "◇" },
  { label: "企业账户", view: "account", icon: "♙" },
  { label: "数据报表", view: "reports", icon: "▥" },
  { label: "消息中心", view: "account", icon: "○", badge: "3", dividerBefore: true },
  { label: "帮助中心", view: "account", icon: "?" },
];

function progressOf(product: Product) {
  return Math.round((product.currentBoxes / product.targetBoxes) * 100);
}

function AppShell({
  activeView,
  setView,
  children,
}: {
  activeView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
}) {
  const navView = activeView === "detail" ? "catalog" : activeView;

  return (
    <div className="app-shell">
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
          <span>当前企业</span>
          <strong>广东嘉荣集团</strong>
          <small>食品采购部 · 王经理</small>
          <i>⌄</i>
        </div>
      </aside>

      <section className="workspace">
        <header className="app-topbar">
          <button className="menu-button" type="button" aria-label="展开导航">
            ☰
          </button>
          <div className="topbar-actions">
            <button className="icon-button alert" type="button" aria-label="消息">
              ♧
              <span>3</span>
            </button>
            <button className="icon-button" type="button" aria-label="帮助">
              ?
            </button>
            <div className="user-chip">
              <b>W</b>
              <span>王经理</span>
              <em>⌄</em>
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
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

function Dashboard({
  setView,
  setSelectedId,
}: {
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const featured = products.slice(0, 3);
  const topProgress = products[0];
  const pct = progressOf(topProgress);

  return (
    <>
      <section className="dashboard-title">
        <h1>工作台</h1>
        <p>下午好，王经理 👋</p>
      </section>

      <section className="metric-strip">
        <MetricCard icon="▱" label="真实商品资料" value="7" hint="德国、奥地利、英国商品" />
        <MetricCard icon="♙" label="接近成团" value="3" hint="超过 70% 的单品" />
        <MetricCard icon="▰" label="我的意向" value="12" hint="待二次确认 3 个" />
        <MetricCard icon="▤" label="费用拆解" value="5 项" hint="采购价、运输、税费、配送、服务费" />
      </section>

      <div className="dashboard-grid">
        <section className="panel hero-panel">
          <div className="panel-head">
            <div>
              <h2>重点单品</h2>
              <p>成团进度高、资料相对完整的商品</p>
            </div>
            <button className="text-link" type="button" onClick={() => setView("catalog")}>
              查看全部商品 ›
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
                  <Spec label="规格" value={product.spec} />
                  <Spec label="单位" value={`箱 (${product.caseSpec.replace(" / 箱", "")})`} />
                  <Spec label="保质期" value={product.shelfLife} />
                </div>
                <div className="price-split">
                  <div>
                    <span>价格</span>
                    <strong>{product.price}</strong>
                  </div>
                  <div>
                    <span>毛利率</span>
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
                      setView("intention");
                    }}
                  >
                    🛒 立即采购
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
            <strong>处理建议</strong>
            <p>提交基础意向，并要求平台补充实物包装和外箱照片。</p>
            <p>下午茶主题、女神节、办公零食、会员日加购。</p>
          </section>

          <section className="status-card">
            <h2>采购状态</h2>
            <p>公开资料已录入：箱规、费用、装柜量和毛利带需供应商内部复核。</p>
            <button className="plain-link" type="button" onClick={() => setView("catalog")}>
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
          <Bundle title="欧洲早餐组合" names="Twinings + Walker's + McVitie's" count="共 6 个商品" />
          <Bundle title="儿童糖果引流组合" names="HARIBO + 低糖果蔬威化" count="共 4 个商品" />
          <Bundle title="进口零食基础组合" names="Ritter Sport + Manner + McVitie's" count="共 5 个商品" />
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
  selectedCountry,
  setSelectedCountry,
  setView,
  setSelectedId,
}: {
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const list = useMemo(
    () => products.filter((product) => selectedCountry === "全部" || product.country === selectedCountry),
    [selectedCountry],
  );

  return (
    <>
      <section className="page-heading with-filters">
        <div>
          <p>筛选 〉</p>
          <h1>按国家查看</h1>
        </div>
        <div className="country-tabs">
          {countryTabs.map((country) => (
            <button
              key={country}
              className={selectedCountry === country ? "active" : ""}
              type="button"
              onClick={() => setSelectedCountry(country)}
            >
              {country}
            </button>
          ))}
        </div>
      </section>

      <section className="catalog-list">
        {list.map((product) => (
          <article className="catalog-row" key={product.id}>
            <ProductImage product={product} size="thumb" />
            <span className="flag">{product.flag}</span>
            <div className="catalog-copy">
              <h2>{product.cnName}</h2>
              <p>
                {product.brand} · {product.enName.replace(product.brand, "").trim()} · {product.spec}
              </p>
              <p>{product.summary}</p>
              <TagRow tags={product.tags} />
            </div>
            <div className="catalog-price">
              <strong>{product.priceBand}</strong>
              <span>售价带</span>
            </div>
            <div className="catalog-price compact">
              <strong>{product.gross}</strong>
              <span>毛利带</span>
            </div>
            <button
              className="row-button"
              type="button"
              onClick={() => {
                setSelectedId(product.id);
                setView("detail");
              }}
            >
              详情
            </button>
          </article>
        ))}
      </section>

      <footer className="pagination">
        <span>共 128 条商品</span>
        <button type="button">‹</button>
        <button className="active" type="button">1</button>
        <button type="button">2</button>
        <button type="button">3</button>
        <button type="button">4</button>
        <button type="button">5</button>
        <span>…</span>
        <button type="button">13</button>
        <button type="button">›</button>
        <button className="page-size" type="button">10 条/页⌄</button>
      </footer>
    </>
  );
}

function ProgressBoard({
  setView,
  setSelectedId,
}: {
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const ordered = [...products].sort((a, b) => progressOf(b) - progressOf(a));

  return (
    <>
      <section className="page-heading">
        <p>成团进度</p>
        <h1>单品 20 尺柜进度看板</h1>
      </section>

      <section className="panel progress-panel">
        <div className="progress-title">
          <div>
            <span>总进度展示</span>
            <h2>企业端不展示其他参与企业</h2>
          </div>
          <span className="privacy-badge">♢ 隐私保护</span>
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

function IntentionForm({ selectedProduct, setView }: { selectedProduct: Product; setView: (view: View) => void }) {
  const pct = progressOf(selectedProduct);

  return (
    <>
      <section className="page-heading">
        <p>采购意向 / 提交企业采购意向</p>
        <h1>提交企业采购意向</h1>
        <small>仅形成意向，不锁定价格、库存和交期</small>
      </section>

      <div className="intention-grid">
        <section className="panel form-panel">
          <h2 className="section-title">商品信息</h2>
          <div className="form-grid">
            <label>
              <span>商品</span>
              <button className="field-button product-field" type="button">
                <ProductImage product={selectedProduct} size="mini" />
                <strong>{selectedProduct.cnName}</strong>
                <em>⌄</em>
              </button>
            </label>
            <label>
              <span>意向数量</span>
              <div className="number-field">
                <input defaultValue="120" aria-label="意向数量" />
                <b>箱</b>
              </div>
            </label>
            <label>
              <span>收货区域</span>
              <button className="field-button" type="button">
                山东区域仓 <em>⌄</em>
              </button>
            </label>
            <label>
              <span>期望到货窗口</span>
              <button className="field-button" type="button">
                2026 年 Q4 <em>⌄</em>
              </button>
            </label>
          </div>
          <label className="note-field">
            <span>备注（选填）</span>
            <textarea placeholder="填写陈列计划、门店覆盖、采购审批要求或其他说明" maxLength={200} />
            <small>0 / 200</small>
          </label>
          <div className="notice">
            <b>i</b>
            <span>提交后平台只记录企业采购意向，达到 20 尺柜后，平台发起二次确认；正式采购前再确认价格、合同、预付款和交期。</span>
          </div>
          <button className="primary-button submit-button" type="button">
            ✈ 提交意向
          </button>
        </section>

        <aside className="intention-side">
          <section className="panel current-product">
            <h2>当前商品</h2>
            <div className="current-product-body">
              <ProductImage product={selectedProduct} size="thumb" />
              <div>
                <h3>{selectedProduct.cnName}</h3>
                <p>
                  {selectedProduct.spec} · {selectedProduct.caseSpec}
                </p>
                <strong>{selectedProduct.price}</strong>
                <span>预计到仓成本</span>
              </div>
            </div>
            <button className="soft-button" type="button" onClick={() => setView("detail")}>
              查看商品详情 →
            </button>
          </section>

          <section className="panel selection-card">
            <h2>当前选择</h2>
            <SelectionLine icon="🛒" label="意向数量" value="120 箱" />
            <SelectionLine icon="⌖" label="收货区域" value="山东区域仓" />
            <SelectionLine icon="□" label="期望到货窗口" value="2026 年 Q4" />
            <div className="selection-progress">
              <div>
                <span>成团进度</span>
                <strong>{pct}%</strong>
              </div>
              <ProgressBar value={pct} />
              <small>距离成团目标 {100 - pct}%</small>
            </div>
          </section>

          <section className="rule-card">
            <h2>意向规则</h2>
            <p>企业可修改或撤回意向；成团后二次确认前，平台不应对外承诺最终成交价格。</p>
            <button className="plain-link" type="button">
              查看平台规则 →
            </button>
          </section>
        </aside>
      </div>

      <section className="trust-strip">
        <TrustCard icon="◇" title="意向保护" text="仅记录意向，不锁定价格、库存和交期，让采购更灵活。" />
        <TrustCard icon="♙" title="成团通知" text="达到起订量后，平台将自动通知您进行二次确认。" />
        <TrustCard icon="▤" title="安全合规" text="所有交易遵循平台规则，保障您的采购安全与合规。" />
      </section>
    </>
  );
}

function DetailPage({
  product,
  setView,
}: {
  product: Product;
  setView: (view: View) => void;
}) {
  const pct = progressOf(product);

  return (
    <>
      <section className="page-heading detail-heading">
        <p>商品目录 / 商品详情</p>
        <h1>{product.cnName}</h1>
        <small>
          {product.brand} · {product.country} · {product.category}
        </small>
      </section>

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
            <Spec label="预计到仓成本" value={product.price} />
            <Spec label="毛利带" value={product.gross} />
            <Spec label="20 尺柜目标" value={`${product.targetBoxes.toLocaleString()} 箱`} />
            <Spec label="当前总意向" value={`${product.currentBoxes.toLocaleString()} 箱`} />
          </div>
          <div className="detail-progress">
            <div>
              <strong>{pct}%</strong>
              <span>当前成团进度</span>
            </div>
            <ProgressBar value={pct} />
          </div>
          <div className="card-actions detail-actions">
            <button className="outline-button" type="button" onClick={() => setView("catalog")}>
              返回目录
            </button>
            <button className="primary-button" type="button" onClick={() => setView("intention")}>
              提交采购意向
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function SimpleAdminPage({ title, text }: { title: string; text: string }) {
  return (
    <section className="panel simple-page">
      <h1>{title}</h1>
      <p>{text}</p>
      <div className="empty-table">
        <div>企业账户</div>
        <div>角色权限</div>
        <div>数据状态</div>
        <div>广东嘉荣集团</div>
        <div>食品采购部 · 王经理</div>
        <div>可查看商品、提交意向、查看总进度</div>
      </div>
    </section>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="tag-row">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="spec-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-bar" aria-label={`当前进度 ${value}%`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function Bundle({ title, names, count }: { title: string; names: string; count: string }) {
  return (
    <article className="bundle-card">
      <strong>{title}</strong>
      <h3>{names}</h3>
      <p>适合区域门店建立进口食品基础货架。</p>
      <div>
        <span>{count}</span>
        <button type="button">查看组合</button>
      </div>
    </article>
  );
}

function SelectionLine({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="selection-line">
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <article className="trust-card">
      <b>{icon}</b>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </article>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [selectedCountry, setSelectedCountry] = useState("全部");
  const [selectedId, setSelectedId] = useState(products[0].id);
  const selectedProduct = products.find((product) => product.id === selectedId) ?? products[0];

  return (
    <AppShell activeView={view} setView={setView}>
      {view === "dashboard" ? <Dashboard setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "catalog" ? (
        <Catalog
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          setView={setView}
          setSelectedId={setSelectedId}
        />
      ) : null}
      {view === "progress" ? <ProgressBoard setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "intention" ? <IntentionForm selectedProduct={selectedProduct} setView={setView} /> : null}
      {view === "detail" ? <DetailPage product={selectedProduct} setView={setView} /> : null}
      {view === "account" ? <SimpleAdminPage title="企业账户" text="企业主账户下可管理采购员工、权限和消息通知。" /> : null}
      {view === "reports" ? <SimpleAdminPage title="数据报表" text="后续用于查看商品浏览、采购意向、成团效率和费用拆解数据。" /> : null}
    </AppShell>
  );
}
