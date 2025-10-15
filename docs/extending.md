# 扩展与多平台部署指南

> 本文面向需要在现有项目基础上扩展业务模块、补充 API，以及迁移到不同部署平台的开发者。阅读完后，你应当能够快速落地新的领域功能，并在 Vercel、Node.js 服务器或 Railway 等环境完成部署。

## 1. 新增业务模块

### 1.1 目录与文件约定

新增领域模块时保持“前端页面 + API + 数据层”解耦。推荐目录结构如下：

```text
src/
├── app/
│   ├── orders/
│   │   ├── page.tsx          # 页面入口（App Router 自动注册 /orders）
│   │   ├── [id]/page.tsx     # 订单详情
│   │   └── new/page.tsx      # 新建订单
│   └── api/
│       └── orders/
│           ├── route.ts      # /api/orders（GET 列表、POST 创建）
│           └── [id]/route.ts # /api/orders/{id}
└── db/
    └── schema/
        └── orders.ts         # Drizzle ORM 表定义
```

遵循模块化原则：

- UI 组件放在 `src/modules/<feature>/components`，复用公共组件位于 `src/components` 或 `src/components/ui`。
- Service、Action、Hook 等逻辑位于 `src/modules/<feature>/{services,actions,hooks}`。
- 数据库 Schema 统一放在 `src/db/schema` 或模块内的 `schemas/` 目录，通过 `drizzle-kit` 生成迁移。

### 1.2 页面与路由注册

Next.js 15 App Router 会根据目录自动注册页面，创建 `page.tsx` 即可生成路由。如需嵌套路由或布局，参考已有模块（例如 `src/app/dashboard`）。

- 更新全局导航/侧边栏时，别忘了在相关组件（例如 `AdminRefineApp`）添加入口。
- 动态路由使用 `[param]` 目录，必要时结合 `generateStaticParams` 或 `generateMetadata`。

### 1.3 数据模型与 API

1. 在 `src/db/schema` 定义新表，字段类型通过 `drizzle-orm/sqlite-core` 等模块声明。
2. 运行 `pnpm db:generate` 生成迁移，或编写对应 SQL 脚本后通过 `pnpm db:migrate:local` 应用。
3. API Route 中调用 Service 层执行业务逻辑。保持请求/响应使用 Zod schema 校验，与自动化 OpenAPI 文档保持一致：
   - 在 schema 上调用 `.openapi({...})` 添加描述/示例。
   - 在 `src/modules/openapi/registrations` 内注册新路径，确保 `/api/openapi` 能同步输出最新规范。
4. 若业务需要 Server Action，可将其视为内部 RPC 并在 `registerServerActionPaths` 中登记，便于团队自查。

### 1.4 服务层与测试

- 推荐在 `src/modules/<feature>/services` 编写纯函数，API/Action 调用这些服务以保持职责清晰。
- 若模块需要鉴权，复用 `@/modules/auth/utils/auth-utils` 中的 `requireAuth`/`requireAdminRequest` 等工具。
- 单元测试使用 Vitest：将测试放置在同目录下的 `*.test.ts`，必要时 mock D1/R2 或外部 API。

### 1.5 前端组件与 UI

- 表单场景沿用 React Hook Form + Zod 方案，配合 Shadcn UI 组件库保持一致外观。
- 多语言文本通过 `next-intl` 提供的 `useTranslations` 访问。
- 如需展示 OpenAPI 文档，可直接在 `/admin/api-docs` 验证接口定义。

## 2. 自动化 API 文档工作流

- `@asteasolutions/zod-to-openapi` 结合 `swagger-ui-react` 已在项目中集成。
- `/api/openapi` 返回最新 OpenAPI 3.1 规范（需管理员会话）。
- `/admin/api-docs` 提供 Swagger UI，可在线调试受保护接口。
- 维护步骤：
  1. 在对应 Zod schema 上添加 `.openapi()` 元数据；
  2. 在 `src/modules/openapi/registrations/*.ts` 中注册路径、请求和响应；
  3. 运行 `pnpm openapi:generate` 更新 `public/openapi.json` 并提交。

## 3. 部署到不同平台

### 3.1 环境变量

- 统一通过 `.env` 或平台提供的环境变量面板配置以下关键值：
  - `DATABASE_URL`：数据库连接字符串；
  - `NEXT_PUBLIC_APP_URL`：站点基础 URL（用于 OpenAPI server 及 SEO）；
  - 第三方服务密钥（如 `CREEM_API_KEY`、Workers AI 绑定等）。
- Cloudflare Workers 专用的 KV/D1/R2 绑定在其他平台需要替换为等价服务或环境变量。

### 3.2 部署到 Vercel

1. 连接 Git 仓库后，Vercel 会自动执行 `pnpm install` 和 `pnpm build`。
2. 在项目设置中添加所有环境变量，尤其是新的数据库连接。
3. 若不再使用 Cloudflare D1，可改用 Neon/Supabase 等 Postgres 服务，在 `drizzle.config.ts` 中切换驱动。
4. 如需构建前执行数据库迁移，可在 Vercel **Build Command** 中追加脚本。
5. 注意 Vercel Serverless 环境的连接数限制，推荐使用连接池或提供的 Serverless 驱动。

### 3.3 部署到自托管 Node.js 服务器

1. 准备 Node.js 18+ 环境，拉取代码后执行 `pnpm install`。
2. 配置 `.env` 并运行 `pnpm build`，随后使用 `pnpm start` 启动生产服务。
3. 可结合 PM2/Supervisor 保持进程常驻，或使用 Docker 将应用容器化。
4. 将静态资源交给 Nginx/Cloudflare CDN 代理，保障缓存与 HTTPS。

### 3.4 部署到 Railway

1. 新建 Railway 项目并连接仓库；默认会执行 `pnpm install && pnpm build && pnpm start`。
2. 在变量面板填写环境变量，可直接添加 Postgres/MySQL 插件并引用自动生成的 `DATABASE_URL`。
3. 部署后通过提供的域名访问，若需要自定义域名可在 Railway 控制台配置。

### 3.5 数据库迁移与替换

- 从 Cloudflare D1 迁移：使用 `wrangler d1 backup` 导出，再导入到 Postgres/MySQL；或编写脚本读取旧库写入新库。
- 更新 `src/db/index.ts` 与 `drizzle.config.ts` 中的连接配置，选择正确的 `drizzle-orm` 适配器（例如 `drizzle-orm/postgres-js`）。
- 别忘了同步执行 `pnpm db:generate`/`pnpm db:migrate:*`，确保 schema 一致。

### 3.6 构建命令调整

- Cloudflare Workers 专用的 `prebuild:cf`/`build:cf` 对 Node/Vercel 不再适用，标准构建流程只需 `pnpm build`。
- 若脚本中存在 `wrangler` 相关步骤，迁移其他平台时需删除或替换。
- `pnpm openapi:generate` 可在 CI 或发布前执行，确保 `public/openapi.json` 与代码一致。

## 4. 结语

通过以上流程，团队可以在保持代码质量与文档一致性的前提下，高效扩展 Changan-penpen。新增模块时优先更新 Zod schema 并同步注册 OpenAPI 路径，部署到新平台前提前规划环境变量与数据库替换策略，能显著降低故障率。
