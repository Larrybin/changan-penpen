# 架构总览（Architecture Overview）

> 本文帮助新成员在 15 分钟内弄清“代码长什么样”“请求怎么走”“改动要动哪里”。涉及的路径均位于 `src/`。

## 技术栈速览
- **Next.js 15 App Router**：使用 Server Components + Server Actions，入口位于 `src/app`
- **Cloudflare Workers + OpenNext**：通过 `@opennextjs/cloudflare` 构建，入口 Worker 在 `.open-next/worker.js`
- **数据库层**：Cloudflare D1，使用 Drizzle ORM（`src/db`、`src/drizzle`）
- **对象存储**：Cloudflare R2（封装在 `src/lib/r2.ts` 等工具内）
- **认证**：Better Auth Google OAuth 集成（`src/modules/auth`、`src/services/auth`）
- **UI 与状态**：Shadcn UI、React Hook Form、Zod、TanStack Query
- **翻译**：基于自定义脚本，支持 Gemini / OpenAI，脚本在 `scripts/` 与 `src/services/translation`

## 运行时拓扑
```
Browser → Next.js App Router (Edge) → Server Actions / Route Handlers
     └── 调用 Drizzle ORM → Cloudflare D1
     └── 访问 Cloudflare R2 / AI bindings
     └── 共享 libs (认证、缓存、日志)
```

- **Edge First**：所有请求在 Cloudflare Workers 上执行，SSR、Server Actions 均跑在边缘。
- **静态资源**：由 OpenNext 构建产物 `.open-next/assets` 通过 Worker `ASSETS` binding 提供。
- **API 路由**：位于 `src/app/api/*/*.route.ts`，与页面组件共享同一运行时。
- **健康检查**：`/api/health` 提供 fast / strict 模式，用于部署质量闸门。

## 目录导读

| 目录 | 说明 |
| --- | --- |
| `src/app` | App Router 入口，包含页面、布局、API route。按照 `(segment)` 组织权限域，如 `(auth)`、`(admin)` |
| `src/modules/<feature>` | 业务模块（actions/components/hooks/models/schemas/utils），可在页面中组合复用 |
| `src/components` | 全局共用组件（含 `ui/` 封装 shadcn），以及 SEO/导航等基础件 |
| `src/lib` | 平台级工具（Cloudflare binding、日志、缓存、http client 等） |
| `src/db` | Drizzle schema + 查询辅助，下游由 `src/modules/*/services` 使用 |
| `src/drizzle` | 数据库迁移（SQL）与 `drizzle.config.ts` 配置 |
| `src/services` | 跨模块业务服务（例如 `auth.service.ts`、`billing.service.ts`） |
| `scripts/` | 构建、国际化、预处理脚本，如 `prebuild-cf.mjs`、`fix-i18n-encoding.mjs` |

### App Router 层
- `layout.tsx`：全局布局，挂载语言包、主题、全局 provider。
- `(segment)/layout.tsx`：区域级布局（例如后台管理 `src/modules/admin/admin.layout.tsx`）。
- `page.tsx`：页面入口，以组合模块组件为主。
- `api/*/*.route.ts`：RESTful 样式或 Server Actions 暴露。

### 模块分层
以 `src/modules/todos` 为例：
- `actions/`：Server Actions，封装输入验证 + 调服务层。
- `components/`：UI 组件，可被页面、其他组件复用。
- `schemas/`：Zod schema，用于前后端共享。
- `services/`：执行业务逻辑，调用 `src/db` 或外部服务。
- `utils/`：模块级工具函数。

规范：调用从 `page` → `module components` → `actions/services` → `db/lib`，避免组件直接触达数据库。

## 数据流说明
1. **请求进来**：Next.js Edge runtime 接收，按 route 匹配页面或 API。
2. **鉴权**：Better Auth 的 middleware（`src/middleware.ts`）在边缘拦截、注入 session。
3. **业务逻辑**：页面触发 Server Action → `modules/*/actions` 调用 `services` → `db`。
4. **数据访问**：`src/db/index.ts` 暴露 `db` 实例，自动连接到对应环境的 D1。
5. **缓存与并发**：TanStack Query + Next.js revalidate，实现客户端缓存与 ISR。
6. **静态资源**：R2 通过 binding `next_cf_app_bucket` 查询，封装在 `src/lib`。

## 环境与绑定
- Worker bindings 定义于 `wrangler.jsonc`：`next_cf_app`（D1）、`next_cf_app_bucket`（R2）、`AI`（Workers AI）。
- 预览环境使用 `env.preview` 中的资源 ID，生产环境使用默认顶层配置。
- 任何新增 binding 后必须运行 `pnpm cf-typegen` 以刷新 `cloudflare-env.d.ts`。

## 关键执行路径
1. **本地开发**：`pnpm dev`（Node runtime）或 `pnpm dev:cf`（OpenNext + Workers 模拟）。
2. **构建部署**：GitHub Actions `deploy.yml` 或手动 `pnpm deploy:cf` → 触发 OpenNext 构建 → Wrangler 发布。
3. **迁移执行**：`pnpm db:migrate:local|preview|prod` 通过 Wrangler 调用 D1 migrations。
4. **自动化修复**：`.github/workflows/auto-fix.yml` 会在指定文件变动时创建 rolling PR。

## 常见扩展点
- 新页面：在 `src/app/<route>/page.tsx` 创建，复用模块组件。
- 新业务域：在 `src/modules/<feature>` 下补齐 `components | services | schemas` 子目录。
- 新 API：优先使用 Server Action；若需要 REST endpoint，则在 `src/app/api/<name>/<verb>.route.ts`。
- 定时任务：通过 Cron Triggers（后续计划）或外部 Worker，文档更新后同步至 `docs/`.

## 兼容性提示
- **OpenNext 约束**：不支持 `fs` 写操作；依赖 Node API 时需启用 `nodejs_compat`（已在 `wrangler.jsonc` 配置）。
- **边缘运行**：尽量避免长时 CPU 任务；AI/外部请求使用 `fetch` 并设置超时。
- **多环境**：Preview 与 Production 的 binding 名称一致但资源 ID 不同，代码层无需条件判断。

---

如需更新架构（新增模块、调整目录），请同步修改本文件与 `docs/00-index.md`，并在 PR 模板中勾选“文档已更新”。
