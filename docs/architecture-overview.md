# 架构总览（Architecture Overview）

> 帮助新成员在 15 分钟内理解“代码在哪里”“需求怎么落地”“改动需要触碰哪些层”。核心入口位于 `src/`。

## 技术栈速览
- **Next.js 15 App Router**：结合 Server Components 与 Server Actions，入口位于 `src/app`。
- **Cloudflare Workers + OpenNext**：使用 `@opennextjs/cloudflare` 构建，Worker 输出在 `.open-next/worker.js`。
- **数据层**：Cloudflare D1（SQLite）+ Drizzle ORM（`src/db`、`src/drizzle`）。
- **对象存储**：Cloudflare R2，在 `src/lib/r2.ts` 等工具中封装。
- **认证**：Better Auth（`src/modules/auth` + `src/services/auth`）。
- **UI 与状态**：shadcn/ui、React Hook Form、Zod、TanStack Query。
- **AI/翻译**：自研脚本 + Gemini / OpenAI 适配，位于 `scripts/` 与 `src/services/translation`。

## 运行时拓扑
```
Browser → Next.js App Router (Edge) → Server Actions / Route Handlers
         ↘ 调用 Drizzle ORM → Cloudflare D1
         ↘ 访问 Cloudflare R2 / Workers AI
         ↘ 共享 lib（认证、缓存、日志）
```

- **Edge First**：所有请求在 Cloudflare Workers 执行，SSR 与 Server Actions 均运行于边缘。
- **静态资源**：OpenNext 生成 `.open-next/assets`，通过 Worker `ASSETS` binding 暴露。
- **API 路由**：位于 `src/app/api/*/*.route.ts`，与页面组件共用运行时。
- **健康检查**：`/api/health` 提供 fast / strict 两种模式，部署前后均会调用。

## 目录速查

| 目录 | 说明 |
| --- | --- |
| `src/app` | App Router 入口，包含页面、布局、API route。按照 `(segment)` 分组，例如 `(auth)`、`(admin)`。 |
| `src/modules/<feature>` | 业务模块（actions/components/hooks/models/schemas/utils），用于页面组合复用。 |
| `src/components` | 全局复用组件（含 `ui/` 的 shadcn 封装）、SEO、导航等基础能力。 |
| `src/lib` | 平台层工具：Cloudflare binding、日志、缓存、HTTP 客户端等。 |
| `src/db` | Drizzle schema 与查询辅助，由 `src/modules/*/services` 调用。 |
| `src/drizzle` | 数据库迁移脚本，与 `drizzle.config.ts` 配置配对。 |
| `src/services` | 跨模块业务服务（如 `auth.service.ts`、`billing.service.ts`）。 |
| `scripts/` | 构建、国际化、预处理脚本，如 `prebuild-cf.mjs`、`fix-i18n-encoding.mjs`。 |

### App Router 层级
- `layout.tsx`：全局布局，负责国际化、主题、Provider。
- `(segment)/layout.tsx`：区域级布局，例如后台管理的 `src/modules/admin/admin.layout.tsx`。
- `page.tsx`：页面入口，组合模块组件。
- `api/*/*.route.ts`：REST 风格或 Server Actions 暴露点。

### 模块分层
以 `src/modules/todos` 为例：
- `actions/`：Server Actions，包装输入校验并调用服务层。
- `components/`：UI 组件，可被页面或其他模块复用。
- `schemas/`：Zod schema，保证前后端一致。
- `services/`：执行业务逻辑，访问 `src/db` 或外部服务。
- `utils/`：模块级工具函数。

约定：页面调用 → 模块组件 → actions/services → db/lib，避免组件直接访问底层资源。

## 数据流说明
1. **请求进入**：Edge runtime 根据 route 匹配页面或 API。
2. **鉴权**：Better Auth 的 middleware（`src/middleware.ts`）在边缘层验证 Session。
3. **业务逻辑**：页面触发的 Server Action 进入 `modules/*/actions`，再调用 `services` / `db`。
4. **数据访问**：`src/db/index.ts` 暴露 `db` 实例，根据环境自动连接对应 D1。
5. **缓存与增量静态化**：TanStack Query + Next.js `revalidate` 实现客户端缓存与 ISR。
6. **对象存储**：通过 binding `next_cf_app_bucket` 访问 R2，封装在 `src/lib`。

## 环境与绑定
- Worker bindings 定义在 `wrangler.jsonc`：`next_cf_app`（Worker）、`DB`（D1）、`next_cf_app_bucket`（R2）、`AI`（Workers AI）。
- 生产环境使用默认部署配置。
- 新增 binding 后必须运行 `pnpm cf-typegen` 更新 `cloudflare-env.d.ts`。

## 关键执行路径
1. **本地开发**：`pnpm dev`（Node runtime）或 `pnpm dev:cf`（OpenNext + Workers 模拟）。
2. **构建部署**：GitHub Actions `deploy.yml` 或手动 `pnpm deploy:cf`，流程包含 OpenNext 构建与 Wrangler 发布。
3. **迁移执行**：`pnpm db:migrate:local|prod` 通过 Wrangler 操作 D1。

## 常见扩展点
- 新页面：在 `src/app/<route>/page.tsx` 创建，复用模块组件。
- 新业务域：在 `src/modules/<feature>` 下补齐 `components|services|schemas` 等目录。
- 新 API：优先考虑 Server Action；如需 REST endpoint，在 `src/app/api/<name>/<verb>.route.ts` 实现。
- 定时任务：通过 Cron Triggers 或额外 Worker 实现，更新后同步 `docs/`。

## 兼容性提示
- **OpenNext 限制**：不支持直接写入 `fs`；如依赖 Node API，请启用 `nodejs_compat`（已在 `wrangler.jsonc` 配置）。
- **边缘执行**：避免长时间 CPU 任务；外部请求使用 `fetch` 并设置合理超时。

---

若新增模块、调整目录或拓展运行环境，请同步更新本文件与 `docs/00-index.md`，并在 PR 模板中勾选“文档已更新”。
