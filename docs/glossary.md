# 术语表（Glossary）

| 术语 | 说明 |
| --- | --- |
| **OpenNext** | 适配 Next.js 到 Cloudflare/AWS 的构建工具，本项目使用 `@opennextjs/cloudflare` 输出 Worker 与静态资源。 |
| **Workers** | Cloudflare 的无服务器计算平台，负责运行本仓库生成的 Worker 代码。 |
| **D1** | Cloudflare 提供的 SQLite 兼容数据库，通过 `src/db` + Drizzle ORM 访问。 |
| **R2** | Cloudflare 对象存储，封装在 `src/lib/r2.ts`，用于静态资产或备份。 |
| **Fast Health** | `/api/health?fast=1`，仅校验环境变量与关键绑定，部署前快速确认环境是否就绪。 |
| **Strict Health** | `/api/health` 默认模式，额外检查 D1 查询、外部依赖（如 Creem），可通过 `HEALTH_REQUIRE_*` 控制是否阻断。 |
| **Better Auth** | 认证框架，负责 Google OAuth、Session 管理，入口在 `src/app/api/auth/[...all]/route.ts` 与 `src/modules/auth`。 |
| **Workers AI** | Cloudflare AI 推理服务，绑定名为 `AI`，可选用于文本总结与翻译。 |
| **Wrangler** | Cloudflare 官方 CLI，用于开发、迁移、部署与日志查看。 |
| **Code Owners** | GitHub 功能，用于指定默认审阅人，本仓库在 `.github/CODEOWNERS` 中定义。 |
| **Quality Gate** | CI 工作流中的质量闸门：Biome、TypeScript、Vitest、Next 构建均需通过后方可部署。 |
| **HEALTH_REQUIRE_DB/R2/EXTERNAL** | 切换严格健康检查时的必选项，开启后对应子检查失败将返回 503。 |
| **NEXT_PUBLIC_APP_URL** | 站点基准 URL，影响 SEO、结构化数据与健康检查校验，生产环境禁止使用 localhost。 |
| **Creem** | 支付与订阅集成模块，相关 API 位于 `src/app/api/creem/*` 与 `src/app/api/webhooks/creem/route.ts`。 |
| **TanStack Query** | React 数据获取库，用于客户端缓存与请求状态管理，封装在多个模块中。 |
| **Install & Heal** | `.github/actions/install-and-heal` 组合 Action，执行 `pnpm install --frozen-lockfile`，失败时自动 `pnpm dedupe` 后重试。 |

> 如有新增术语，请更新此表并在 `docs/00-index.md` 中同步说明。
