# 架构概览（Architecture Overview）

> 15 分钟快速掌握仓库内的技术决策、代码分层与运行流程。新增模块或调整目录结构时，请同步维护本文与 `docs/00-index.md`。

## 技术栈与运行环境
- **Next.js 15 App Router**：大量使用 Server Components 与 Server Actions，入口位于 `src/app`。
- **Cloudflare Workers + OpenNext**：通过 `@opennextjs/cloudflare` 构建，产物写入 `.open-next/`，由 `wrangler` 部署。
- **数据层**：Cloudflare D1（SQLite）+ Drizzle ORM（`src/db`、`src/drizzle`）。
- **对象存储**：Cloudflare R2，封装在 `src/lib/r2.ts`。
- **认证**：Better Auth + Google OAuth，Server 端入口集中在 `src/modules/auth`。
- **UI & 状态**：Tailwind CSS、shadcn/ui、React Hook Form、TanStack Query。
- **可选 AI**：Cloudflare Workers AI / Gemini / OpenAI，通过 `src/services` 与 `scripts/translate-*` 使用。

## 运行时拓扑
```
Browser ─▶ Next.js App Router (Edge/SSR) ─▶ Server Actions / Route Handlers
      └───────────────▶ Drizzle ORM ─▶ Cloudflare D1
      └───────────────▶ R2 / Workers AI / 外部服务（Creem）
      └───────────────▶ 平台工具（认证、缓存、日志）
```
- **Edge First**：页面、Server Actions、API 默认在 Workers 上执行，必要时切换 `runtime = "nodejs"`（如 `api/health`）。
- **静态资源**：OpenNext 将静态资源写入 `.open-next/assets`，通过 Worker `ASSETS` 绑定暴露。
- **API 路由**：位于 `src/app/api/*/*.route.ts` 或 `route.ts`，与页面共享模块层。
- **健康检查**：`/api/health` 同时支持 fast / strict 模式，部署与告警依赖该接口。

## 目录速查
| 目录 | 说明 |
| --- | --- |
| `src/app` | App Router 入口，包含页面、布局、路由处理。按照 `(segment)` 划分权限，如 `(auth)`、`(admin)`。
| `src/modules/<feature>` | 领域模块：actions / components / hooks / services / schemas / utils。
| `src/components` | 跨模块复用组件；`ui/` 存放二次封装的 shadcn 组件。
| `src/lib` | 平台级工具（Cloudflare bindings、日志、SEO、缓存等）。
| `src/db` | Drizzle schema 与数据库助手函数。
| `src/drizzle` | SQL 迁移（由 `drizzle-kit` 生成），`drizzle.config.ts` 负责配置。
| `src/services` | 跨领域服务（如 `auth.service.ts`、`billing.service.ts`）。
| `scripts/` | 构建、部署、国际化等辅助脚本。
| `tests/` | 全局测试夹具与工具。

> 示例：`src/app/dashboard/page.tsx` 渲染 `src/modules/dashboard/dashboard.page.tsx`，后者再调用 `modules/todos` 与 `modules/creem`。

## 模块分层范式
1. **页面 / 布局（`page.tsx` / `layout.tsx`）**：组合 Server/Client 组件，负责路由与 SEO。
2. **领域模块（`src/modules/<feature>`）**：将 UI、动作与 schema 聚合，Server Actions 默认位于 `actions/`。
3. **服务层（`services/`）**：处理业务逻辑，协调数据库与外部 API。例如 `modules/admin/services/site-settings.service.ts`。
4. **数据层（`src/db`）**：封装 Drizzle 查询，禁止直接在 UI 中访问数据库。
5. **基础设施（`src/lib`）**：提供 Cloudflare binding、缓存、日志、SEO、国际化等通用能力。

## 数据流与依赖
1. **请求进入**：Edge Runtime 匹配页面或 API Route。
2. **认证与中间件**：`middleware.ts` 和 Better Auth session 校验 `/dashboard`、`/admin` 等路径。
3. **Server Action / Route Handler**：调用对应 `modules/*/services` 与 `src/services`。
4. **数据库访问**：通过 `getDb()` 获取与环境匹配的 D1 连接；迁移由 `src/drizzle` 管理。
5. **缓存与再验证**：`revalidatePath` + TanStack Query，结合 Cloudflare Cache（后续可拓展）。
6. **外部依赖**：R2、Creem、Workers AI 通过 `CloudflareEnv` 绑定与环境变量访问。

## Cloudflare 绑定与环境
- **Wrangler 配置**：`wrangler.jsonc` 启用 `nodejs_compat` 与 `global_fetch_strictly_public`。
- **绑定**：`next_cf_app` (D1)、`next_cf_app_bucket` (R2)、`AI`、`ASSETS`。
- **环境变量**：`cloudflare-env.d.ts` 定义运行时类型，更新绑定后务必运行 `pnpm cf-typegen`。
- **部署脚本**：`package.json` 中 `build:cf` / `deploy:cf` 由 OpenNext + Wrangler 执行。

## 开发到部署流程
1. **本地**：`pnpm dev`（Node runtime）或 `pnpm dev:cf`（OpenNext + Wrangler）启动；调试技巧详见 `docs/local-dev.md`。
2. **质量闸门**：`pnpm lint`、`pnpm test`、`pnpm build`；CI (`ci.yml`) 自动执行。
3. **部署**：推送 `main` 触发 `deploy.yml`，执行备份 → 迁移 → OpenNext 构建 → `wrangler deploy` → `/api/health` 校验。
4. **回滚**：使用 `wrangler deploy --rollback`，并从 artifact 中恢复 D1 备份；流程详见 `docs/deployment/cloudflare-workers.md`。

## 扩展指南
- 新建页面 → `src/app/<route>/page.tsx`，尽量复用模块组件。
- 新建领域模块 → 在 `src/modules/<feature>` 下创建 `components/services/schemas`。
- 新增 API → 优先考虑 Server Actions；若需 REST，放在 `src/app/api/<name>/<action>.route.ts`。
- 新增定时任务或额外 Worker → 更新 `wrangler.jsonc`、`docs/opennext.md` 以及部署文档。

## 兼容性与注意事项
- OpenNext Worker 中禁止使用 Node `fs` 写操作；如需，请启用 `nodejs_compat` 并确认 Cloudflare 支持。
- 谨慎执行长时 CPU 或外部请求，必要时设置超时并捕获异常。
- 任何变更必须同步更新对应文档、`.dev.vars.example` 以及 `docs/env-and-secrets.md`，保持“文档即运行手册”。

---

遇到架构层面的新增或重构，请在 PR 中链接此文档并说明差异，确保团队成员获得最新上下文。
