# SPAR 进口商品联采系统

面向区域头部超市企业的进口商品 B2B 联合采购平台，基于
[vinext](https://github.com/cloudflare/vinext)（Next.js on Cloudflare
Workers）构建，使用 Cloudflare D1（Drizzle ORM）存储业务数据、R2 存储流程文件。

## 环境要求

- Node.js `>=22.13.0`

## 快速开始

```bash
npm install

# 首次运行需要先把 drizzle/*.sql 迁移应用到本地 D1（否则会看到
# "数据库表尚未创建" 报错，登录、商品列表等接口全部不可用）：
npm run db:migrate:local

npm run dev
```

打开终端打印出的本地地址即可使用。演示账号见下方「演示账号」一节。

`npm run build` 用于验证生产构建产物；`npm run db:migrate:local` 需要在每次清空
`.wrangler/state`（本地 D1/R2 持久化目录）之后重新执行一次。

This starter does not use `wrangler.jsonc`.

## 演示账号

`drizzle/0001_seed_initial_data.sql` 预置了三个账号（企业采购端 `buyer@jiarong.example`、
运营后台 `manager@spar-supply.example` / `director@spar-supply.example`），
`drizzle/0010_seed_demo_passwords.sql` 为它们写入了可登录的密码哈希——**该文件只包含
PBKDF2 哈希，不包含明文密码，明文密码不会出现在本仓库或任何 commit / PR 里**，
请通过内部密钥管理渠道单独获取，或直接用下面的脚本给这些账号设置你自己的密码：

```bash
npm run db:migrate:local   # 先确保表已存在
node build/set-demo-password.mjs buyer@jiarong.example '你的新密码'
node build/set-demo-password.mjs manager@spar-supply.example '你的新密码'
node build/set-demo-password.mjs director@spar-supply.example '你的新密码'
```

如果 `/api/setup` 显示尚未初始化管理员，也可以通过登录页的“首次初始化管理员”表单
创建总监账号（需要部署时配置的 `SETUP_KEY` 环境变量）。

⚠️ 请勿把任何账号的明文密码写入 commit message、PR 描述、README 或其他会被推送到
远程仓库的文件。

## 本地开发常见问题

- **登录/商品列表报“数据库表尚未创建”**：说明本地 D1（`.wrangler/state`）还没有
  应用 `drizzle/` 下的迁移文件，执行 `npm run db:migrate:local` 即可。
- **清空过 `.wrangler` 目录后功能全部失效**：本地 D1/R2 数据都持久化在
  `.wrangler/state`，删除该目录等于清空数据库，需要重新执行
  `npm run db:migrate:local`。
- **通过 sandbox / 代理域名访问开发服务器报 403 "Blocked request"**：已在
  `vite.config.ts` 中设置 `server.allowedHosts = true`，允许任意 Host 头访问本地
  开发服务器；生产部署不受影响。

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
