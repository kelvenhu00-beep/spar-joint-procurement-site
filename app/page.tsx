"use client";

import { useMemo, useState } from "react";

type View =
  | "login"
  | "dashboard"
  | "catalog"
  | "procurement"
  | "progress"
  | "intention"
  | "intentionAdmin"
  | "detail"
  | "clients"
  | "reports"
  | "messages"
  | "help";

type Portal = "buyer" | "operator";

type NavItem = { label: string; view: View; icon: string; badge?: string; dividerBefore?: boolean };

type Product = {
  id: string;
  cnName: string;
  brand: string;
  enName: string;
  country: "德国" | "奥地利" | "英国" | "意大利";
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
    tags: ["奥地利", "威化饼干"],
    summary: "粉色包装和奥地利威化身份能快速形成记忆点，适合激发采购对陈列效果的想象。",
    decisionNote: "适合下午茶、女神节、办公室零食、会员日加购等场景，可作为进口零食基础款。",
    image: "/product-assets/manner.png",
  },
  {
    id: "walkers-fingers-250g",
    cnName: "JACOB'S 沃克斯黄油酥饼",
    brand: "JACOB'S",
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
  { label: "我的采购进度", view: "procurement", icon: "▥" },
  { label: "消息中心", view: "messages", icon: "○", badge: "3", dividerBefore: true },
  { label: "帮助中心", view: "help", icon: "?" },
];

const operatorNavItems: NavItem[] = [
  { label: "运营工作台", view: "dashboard", icon: "⌂" },
  { label: "商品资料库", view: "catalog", icon: "▤" },
  { label: "成团管理", view: "progress", icon: "▧" },
  { label: "意向审核", view: "intentionAdmin", icon: "◇" },
  { label: "采购履约", view: "procurement", icon: "▥" },
  { label: "企业客户", view: "clients", icon: "♙" },
  { label: "数据报表", view: "reports", icon: "▥" },
  { label: "消息中心", view: "messages", icon: "○", badge: "3", dividerBefore: true },
  { label: "帮助中心", view: "help", icon: "?" },
];

const portalProfiles: Record<
  Portal,
  {
    name: string;
    shortName: string;
    organization: string;
    role: string;
    userName: string;
    userInitial: string;
  }
> = {
  buyer: {
    name: "企业采购端",
    shortName: "采购端",
    organization: "广东嘉荣集团",
    role: "食品采购部 · 王经理",
    userName: "王经理",
    userInitial: "W",
  },
  operator: {
    name: "平台运营后台",
    shortName: "运营端",
    organization: "SPAR 中国供应链",
    role: "商品运营部 · 刘经理",
    userName: "刘经理",
    userInitial: "L",
  },
};

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

function progressOf(product: Product) {
  return Math.round((product.currentBoxes / product.targetBoxes) * 100);
}

function AppShell({
  activeView,
  setView,
  portal,
  setPortal,
  onLogout,
  children,
}: {
  activeView: View;
  setView: (view: View) => void;
  portal: Portal;
  setPortal: (portal: Portal) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const navView = activeView === "detail" ? "catalog" : activeView;
  const navItems = portal === "buyer" ? buyerNavItems : operatorNavItems;
  const profile = portalProfiles[portal];

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
          <span>{portal === "buyer" ? "当前企业" : "当前组织"}</span>
          <strong>{profile.organization}</strong>
          <small>{profile.role}</small>
          <i>⌄</i>
        </div>
      </aside>

      <section className="workspace">
        <header className="app-topbar">
          <button className="menu-button" type="button" aria-label="展开导航">
            ☰
          </button>
          <div className="topbar-actions">
            <div className="portal-switch" aria-label="演示端口切换">
              <button className={portal === "buyer" ? "active" : ""} type="button" onClick={() => setPortal("buyer")}>
                企业采购端
              </button>
              <button className={portal === "operator" ? "active" : ""} type="button" onClick={() => setPortal("operator")}>
                平台运营后台
              </button>
            </div>
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

function LoginPage({ onLogin }: { onLogin: (portal: Portal) => void }) {
  const [selectedPortal, setSelectedPortal] = useState<Portal>("buyer");
  const selectedProfile = portalProfiles[selectedPortal];

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
        <div className="login-context">
          <span>当前登录端口</span>
          <strong>{selectedProfile.name}</strong>
          <small>{selectedProfile.organization} · {selectedProfile.role}</small>
        </div>
        <label>
          <span>账号</span>
          <input placeholder={selectedPortal === "buyer" ? "企业员工账号 / 邮箱" : "运营后台账号 / 邮箱"} />
        </label>
        <label>
          <span>密码</span>
          <input placeholder="请输入密码" type="password" />
        </label>
        <div className="login-options">
          <label>
            <input type="checkbox" /> 记住我
          </label>
          <button type="button">忘记密码?</button>
        </div>
        <button className="primary-button full" type="button" onClick={() => onLogin(selectedPortal)}>
          进入{selectedProfile.shortName}
        </button>
        <div className="login-divider">或</div>
        <button className="outline-button full" type="button" onClick={() => onLogin(selectedPortal)}>
          演示登录
        </button>
        <small>
          当前为演示登录。正式系统需要接入真实认证、企业组织、员工账号和角色权限。
        </small>
      </section>
      <footer className="login-footer">
        <span>© 2024 SPAR 联采 | 进口商品 B2B 平台</span>
        <span>隐私政策 | 用户协议 | 帮助中心</span>
        <span>简体中文⌄</span>
      </footer>
    </main>
  );
}

function Dashboard({
  portal,
  setView,
  setSelectedId,
}: {
  portal: Portal;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const featured = products.slice(0, 3);
  const topProgress = products[1];
  const pct = progressOf(topProgress);
  const isBuyer = portal === "buyer";
  const profile = portalProfiles[portal];

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
            <MetricCard icon="▤" label="成本拆解" value="5 项" hint="供货价、运输、税费、配送、服务费" />
          </>
        ) : (
          <>
            <MetricCard icon="▱" label="待完善商品" value="18" hint="缺实物图、外箱图或标签资料" />
            <MetricCard icon="♙" label="待核价商品" value="9" hint="供应商报价和税费需复核" />
            <MetricCard icon="▰" label="待审核意向" value="37" hint="来自 12 家区域零售企业" />
            <MetricCard icon="▤" label="接近成团" value="3" hint="需要运营跟进二次确认" />
          </>
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
                    {isBuyer ? "加入采购" : "维护资料"}
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
            <p>{isBuyer ? "下午茶主题、女神节、办公零食、会员日加购。" : "先处理 Manner、HARIBO、JACOB'S 的二次确认资料。"}</p>
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
          <Bundle title="欧洲早餐组合" names="Twinings + JACOB'S + Lavazza" count="共 6 个商品" />
          <Bundle title="儿童糖果引流组合" names="HARIBO + Manner" count="共 4 个商品" />
          <Bundle title="进口零食基础组合" names="Ritter Sport + Manner + JACOB'S" count="共 5 个商品" />
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
  setView,
  setSelectedId,
}: {
  portal: Portal;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const isBuyer = portal === "buyer";

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
          <FilterGroup title="原产国/地区" items={["全部", "德国", "英国", "法国", "意大利", "西班牙"]} />
          <FilterGroup title="品牌" items={["全部", "Haribo", "Jacob's", "Manner", "Twinings", "Ritter Sport"]} hasSearch />
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
            <span>共 1,248 个商品</span>
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
            {products.map((product) => (
              <article className="catalog-card" key={product.id}>
                <ProductImage product={product} />
                <TagRow tags={[product.country, product.category]} />
                <h2>{product.cnName}</h2>
                <p>{product.spec}</p>
                <PriceBlock product={product} compact />
                <small>{product.moq} · 非最终成交报价</small>
                <div>
                  <button
                    className="favorite-button"
                    type="button"
                    aria-label={`收藏 ${product.cnName}`}
                    onClick={() => {
                      setSelectedId(product.id);
                    }}
                  >
                    ♡
                  </button>
                  <button
                    className="primary-button full"
                    type="button"
                    onClick={() => {
                      setSelectedId(product.id);
                      setView(isBuyer ? "intention" : "detail");
                    }}
                  >
                    {isBuyer ? "加入采购" : "维护资料"}
                  </button>
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
  setView,
  setSelectedId,
}: {
  portal: Portal;
  setView: (view: View) => void;
  setSelectedId: (id: string) => void;
}) {
  const isBuyer = portal === "buyer";
  const rows = [
    ["曼纳原味榛子威化 75g", "SPAR20240524001", "德国奥地利供应商", "清关中", 83, "2024-06-05", "进行中"],
    ["哈瑞宝金熊软糖 175g", "SPAR20240523002", "HARIBO GmbH & Co. KG", "运输中", 62, "2024-06-08", "进行中"],
    ["沃克斯黄油酥饼条 250g", "SPAR20240520003", "Burton's Biscuits Co.", "已到港", 90, "2024-06-03", "异常"],
    ["瑞特斯波德巧克力 100g", "SPAR20240518004", "Ritter Sport GmbH", "已完成", 100, "2024-05-25", "已完成"],
    ["雅各布斯速溶咖啡 200g", "SPAR20240516005", "JACOBS Douwe Egberts", "采购中", 35, "2024-06-12", "进行中"],
    ["费列罗榛果威化巧克力 48粒", "SPAR20240514006", "Ferrero S.p.A.", "需求确认", 15, "2024-06-15", "进行中"],
  ];

  return (
    <>
      <PageTitle
        title={isBuyer ? "我的采购进度" : "采购履约进度"}
        subtitle={isBuyer ? "查看本企业已确认采购项目的履约状态" : "平台内部跟踪采购、运输、报关、分拣和配送状态"}
      />
      <section className="metric-strip procurement-metrics">
        <MetricCard icon="◰" label="进行中项目" value="8" hint="较上周 ↑ 2" />
        <MetricCard icon="☑" label="已完成项目" value="26" hint="较上周 ↑ 5" />
        <MetricCard icon="◷" label="按时交付率" value="92%" hint="较上周 ↑ 3%" />
        <MetricCard icon="◴" label="整体完成率" value="78%" hint="较上周 ↑ 6%" />
        <MetricCard icon="▣" label="平均交付周期" value="18 天" hint="较上周 ↓ 2天" />
        <MetricCard icon="!" label="异常项目" value="2" hint="较上周 ↓ 1" />
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
        <button type="button">重置</button>
        {isBuyer ? null : <button className="primary-button" type="button">导出报表</button>}
      </section>
      <section className="procurement-layout">
        <div className="panel procurement-table">
          <h2>采购项目列表</h2>
          <div className="data-table procurement">
            <div>项目 / 柜号</div>
            <div>供应商</div>
            <div>当前阶段</div>
            <div>整体进度</div>
            <div>计划交付</div>
            <div>状态</div>
            <div>操作</div>
            {rows.map((row, index) => (
              <ProcurementRow
                key={row[1].toString()}
                row={row}
                product={products[index % products.length]}
                onDetail={() => {
                  setSelectedId(products[index % products.length].id);
                  setView("detail");
                }}
              />
            ))}
          </div>
          <footer className="table-footer">共 8 条 <span>‹</span><b>1</b><span>›</span><button type="button">10 条/页⌄</button></footer>
        </div>
        <aside className="procurement-side">
          <section className="panel stage-card">
            <h2>阶段说明 <span>共 6 个阶段</span></h2>
            <div className="stage-steps">
              {["需求确认", "采购中", "运输中", "清关中", "已到港", "已完成"].map((step, index) => (
                <div key={step} className={index === 3 ? "active" : ""}>
                  <b>{index + 1}</b>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="panel timeline-card">
            <h2>项目时间线</h2>
            {[
              ["2024-05-24 09:30", "需求已确认", "采购需求已提交并确认"],
              ["2024-05-24 14:20", "采购已下单", "采购订单已发送至供应商"],
              ["2024-05-27 16:45", "货物已发运", "供应商已发货，预计 2024-06-02 到港"],
              ["2024-06-02 10:15", "货物已到港", "货物已到达目的港，等待清关"],
              ["2024-06-03 11:30", "清关中", "海关清关进行中"],
            ].map((item) => (
              <div className="timeline-item" key={item[0]}>
                <time>{item[0]}</time>
                <strong>{item[1]}</strong>
                <span>{item[2]}</span>
              </div>
            ))}
            <button className="outline-button full" type="button">查看全部时间线</button>
          </section>
        </aside>
      </section>
    </>
  );
}

function ProcurementRow({
  row,
  product,
  onDetail,
}: {
  row: (string | number)[];
  product: Product;
  onDetail: () => void;
}) {
  const percent = Number(row[4]);
  return (
    <>
      <div className="project-cell">
        <ProductImage product={product} size="mini" />
        <span><strong>{row[0]}</strong><small>柜号：{row[1]}</small></span>
      </div>
      <div>{product.flag} {row[2]}</div>
      <div><span className="dot" />{row[3]}<small>阶段 {Math.ceil(percent / 18)} / 6</small></div>
      <div><strong className="green-text">{percent}%</strong><ProgressBar value={percent} /></div>
      <div>{row[5]}<small>{percent > 90 ? "提前 2 天" : "剩余 5 天"}</small></div>
      <div><span className={`status-pill ${row[6] === "异常" ? "danger" : row[6] === "已完成" ? "done" : ""}`}>{row[6]}</span></div>
      <div><button className="outline-button" type="button" onClick={onDetail}>查看详情</button></div>
    </>
  );
}

function IntentionAdminPage({ setView, setSelectedId }: { setView: (view: View) => void; setSelectedId: (id: string) => void }) {
  const rows = [
    ["广东嘉荣集团", "Manner 曼纳威化饼干", "120 箱", "山东区域仓", "2026 年 Q4", "待核价"],
    ["家家悦集团", "HARIBO 哈瑞宝金熊软糖", "260 箱", "山东区域仓", "2026 年 Q4", "待确认授权"],
    ["湖南佳惠百货", "JACOB'S 沃克斯黄油酥饼", "80 箱", "华中区域仓", "2026 年 Q4", "待补资料"],
    ["广东嘉荣集团", "Ritter Sport 瑞特斯波德牛奶巧克力", "160 箱", "华南区域仓", "2026 年 Q4", "待二次确认"],
  ];

  return (
    <>
      <PageTitle title="意向审核" subtitle="平台运营后台用于审核企业意向、补齐资料并发起二次确认" />
      <section className="metric-strip client-metrics">
        <MetricCard icon="◇" label="待审核意向" value="37" hint="来自 12 家区域零售企业" />
        <MetricCard icon="▤" label="待核价" value="9" hint="需确认供应商报价口径" />
        <MetricCard icon="▧" label="待补资料" value="14" hint="包装、标签、授权资料未完整" />
        <MetricCard icon="♙" label="可二次确认" value="6" hint="接近或达到 20 尺柜" />
      </section>
      <section className="progress-filter-row">
        <input placeholder="搜索企业、商品、区域仓" />
        <button type="button">全部状态⌄</button>
        <button type="button">商品国家⌄</button>
        <button type="button">到货窗口⌄</button>
        <button type="button">重置</button>
        <button className="primary-button" type="button">发起二次确认</button>
      </section>
      <section className="procurement-layout">
        <article className="panel intention-admin-table">
          <h2>企业采购意向列表</h2>
          <div className="data-table intention-admin">
            <div>企业</div><div>商品</div><div>意向数量</div><div>收货区域</div><div>到货窗口</div><div>当前状态</div><div>操作</div>
            {rows.flatMap((row, index) => (
              row.concat("查看商品 审核").map((cell, cellIndex) => (
                <div key={`${row[0]}-${row[1]}-${cellIndex}`}>
                  {cellIndex === 5 ? <span className="status-pill">{cell}</span> : cell}
                  {cellIndex === 6 ? (
                    <button
                      className="plain-link inline-action"
                      type="button"
                      onClick={() => {
                        setSelectedId(products[index % products.length].id);
                        setView("detail");
                      }}
                    >
                      打开
                    </button>
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
      <PageTitle title="单品 20 尺柜进度看板" subtitle="企业端不展示其他参与企业，仅展示总进度" />
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

function ReportsPage() {
  return (
    <>
      <PageTitle title="数据报表" subtitle="多维度数据分析，助力业务决策" />
      <section className="report-filters">
        <button type="button">时间范围<br /><strong>2024-05-01 ~ 2024-05-31</strong></button>
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
        <RankPanel title="国家/地区采购金额 TOP5" items={["德国 ¥ 856,200.50", "英国 ¥ 647,800.30", "法国 ¥ 398,600.20", "日本 ¥ 296,400.10", "美国 ¥ 251,200.40"]} />
        <RankPanel title="品牌采购金额 TOP5" items={["HARIBO ¥ 245,600.30", "JACOBS ¥ 198,700.20", "Manner ¥ 156,400.10", "Ritter Sport ¥ 132,600.80", "Walker's ¥ 118,300.50"]} />
        <article className="panel report-table">
          <h2>采购概览</h2>
          <div className="data-table four">
            <div>指标</div><div>本期（2024-05）</div><div>上期（2024-04）</div><div>环比变化</div>
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
  const clients = [
    ["广东嘉荣超市有限公司", "华南区域头部超市", "合作中", "★★★★★", "采购负责人", "客户经理已登记", "¥ 5,680,000", "2024-05-20"],
    ["家家悦集团股份有限公司", "山东区域连锁超市", "合作中", "★★★★★", "进口食品负责人", "客户经理已登记", "¥ 4,320,000", "2024-05-18"],
    ["湖南佳惠百货有限责任公司", "湖南区域商贸零售", "合作中", "★★★★☆", "休食采购负责人", "客户经理已登记", "¥ 3,980,000", "2024-05-17"],
    ["福建冠超市商业有限公司", "福建区域连锁超市", "合作中", "★★★★☆", "采购中心负责人", "客户经理已登记", "¥ 3,650,000", "2024-05-16"],
    ["安徽乐城投资股份有限公司", "安徽区域精品超市", "潜在客户", "★★★☆☆", "商品部负责人", "待补充", "¥ 1,280,000", "2024-05-10"],
    ["四川舞东风超市连锁股份有限公司", "西南区域社区零售", "跟进中", "★★★☆☆", "采购经理", "待补充", "¥ 980,000", "2024-04-28"],
    ["重庆重客隆超市连锁有限责任公司", "重庆区域连锁超市", "待评估", "★★☆☆☆", "商品经理", "待补充", "¥ 670,000", "2024-04-15"],
  ];
  return (
    <>
      <PageTitle title="企业客户" subtitle="管理和维护企业客户信息，建立长期合作关系" />
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
    ["系统升级维护通知", "SPAR 联采平台将于 2024年5月25日 22:00 - 5月26日 02:00 进行系统升级维护，期间平台部分功能将受影响...", "系统公告", "10:30", "未读"],
    ["订单支付成功通知", "您的订单 PO-20240524001 已支付成功，金额 ¥78,450.00 元。感谢您的采购！", "订单通知", "昨天 16:45", "未读"],
    ["成团进度更新", "您参与的团组「进口饼干零食专场」成团率已更新至 83%，距离成团目标还差 17%。", "成团进度", "昨天 11:20", "未读"],
    ["费用结算通知", "您的 2024年5月 结算单已生成，金额 ¥12,680.00 元，请及时查看并安排付款。", "费用通知", "5月23日 09:15", "已读"],
    ["服务商响应通知", "您的售后服务请求（工单号：SR-20240522001）已有新回复，请及时查看。", "服务通知", "5月22日 14:30", "已读"],
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

  return (
    <>
      <PageTitle title="提交企业采购意向" subtitle="仅形成意向，不锁定价格、库存和交期" />
      <div className="intention-grid">
        <section className="panel form-panel">
          <h2 className="section-title">商品信息</h2>
          <div className="form-grid">
            <label><span>商品</span><button className="field-button product-field" type="button"><ProductImage product={selectedProduct} size="mini" /><strong>{selectedProduct.cnName}</strong><em>⌄</em></button></label>
            <label><span>意向数量</span><div className="number-field"><input defaultValue="120" aria-label="意向数量" /><b>箱</b></div></label>
            <label><span>收货区域</span><button className="field-button" type="button">山东区域仓 <em>⌄</em></button></label>
            <label><span>期望到货窗口</span><button className="field-button" type="button">2026 年 Q4 <em>⌄</em></button></label>
          </div>
          <label className="note-field"><span>备注（选填）</span><textarea placeholder="填写陈列计划、门店覆盖、采购审批要求或其他说明" maxLength={200} /><small>0 / 200</small></label>
          <div className="notice"><b>i</b><span>提交后平台只记录企业采购意向，达到 20 尺柜后，平台发起二次确认；正式采购前再确认价格口径、合同、预付款和交期。</span></div>
          <button className="primary-button submit-button" type="button">提交意向</button>
        </section>
        <aside className="intention-side">
          <section className="panel current-product"><h2>当前商品</h2><div className="current-product-body"><ProductImage product={selectedProduct} size="thumb" /><div><h3>{selectedProduct.cnName}</h3><p>{selectedProduct.spec} · {selectedProduct.caseSpec}</p><PriceBlock product={selectedProduct} compact /></div></div><button className="soft-button" type="button" onClick={() => setView("detail")}>查看商品详情 →</button></section>
          <section className="panel selection-card"><h2>当前选择</h2><SelectionLine icon="▰" label="意向数量" value="120 箱" /><SelectionLine icon="⌖" label="收货区域" value="山东区域仓" /><SelectionLine icon="□" label="期望到货窗口" value="2026 年 Q4" /><div className="selection-progress"><div><span>成团进度</span><strong>{pct}%</strong></div><ProgressBar value={pct} /><small>距离成团目标 {100 - pct}%</small></div></section>
          <section className="rule-card"><h2>意向规则</h2><p>企业可修改或撤回意向；成团后二次确认前，平台不应对外承诺最终成交价格。</p><button className="plain-link" type="button">查看平台规则 →</button></section>
        </aside>
      </div>
      <section className="trust-strip"><TrustCard icon="◇" title="意向保护" text="仅记录意向，不锁定价格、库存和交期，让采购更灵活。" /><TrustCard icon="♙" title="成团通知" text="达到起订量后，平台将自动通知您进行二次确认。" /><TrustCard icon="▤" title="安全合规" text="所有交易遵循平台规则，保障您的采购安全与合规。" /></section>
    </>
  );
}

function DetailPage({ product, portal, setView }: { product: Product; portal: Portal; setView: (view: View) => void }) {
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
          </div>
          <CostDisclosure />
          <div className="detail-progress"><div><strong>{pct}%</strong><span>当前成团进度</span></div><ProgressBar value={pct} /></div>
          <div className="card-actions detail-actions"><button className="outline-button" type="button" onClick={() => setView("catalog")}>返回{isBuyer ? "目录" : "资料库"}</button><button className="primary-button" type="button" onClick={() => setView(isBuyer ? "intention" : "intentionAdmin")}>{isBuyer ? "提交采购意向" : "查看意向审核"}</button></div>
        </div>
      </section>
    </>
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
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState(products[0].id);
  const selectedProduct = useMemo(() => products.find((product) => product.id === selectedId) ?? products[0], [selectedId]);

  const setPortal = (nextPortal: Portal) => {
    setPortalState(nextPortal);
    setView("dashboard");
  };

  const logout = () => {
    setPortalState(null);
    setView("dashboard");
  };

  if (!portal || view === "login") {
    return <LoginPage onLogin={setPortal} />;
  }

  return (
    <AppShell activeView={view} setView={setView} portal={portal} setPortal={setPortal} onLogout={logout}>
      {view === "dashboard" ? <Dashboard portal={portal} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "catalog" ? <Catalog portal={portal} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "procurement" ? <ProcurementProgress portal={portal} setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "progress" ? <ProgressBoard setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "intention" ? <IntentionForm selectedProduct={selectedProduct} setView={setView} /> : null}
      {view === "intentionAdmin" ? <IntentionAdminPage setView={setView} setSelectedId={setSelectedId} /> : null}
      {view === "detail" ? <DetailPage product={selectedProduct} portal={portal} setView={setView} /> : null}
      {view === "clients" ? <ClientsPage /> : null}
      {view === "reports" ? <ReportsPage /> : null}
      {view === "messages" ? <MessagesPage /> : null}
      {view === "help" ? <HelpPage /> : null}
    </AppShell>
  );
}
