# Scripts Reference

> Source of truth for the commands exposed in `package.json`. Use this file to understand categories, prerequisites, and the
> environment variables that affect behaviour.

## At a Glance

| 分类 | 目标 | 常用命令 |
|------|------|----------|
| 开发体验 | 本地与 Cloudflare Workers 调试 | `pnpm dev`, `pnpm dev:cf`, `pnpm dev:remote` |
| 数据库 | 迁移、可视化、排障 | `pnpm db:generate`, `pnpm db:migrate:local`, `pnpm db:migrate:prod`, `pnpm db:studio` |
| OpenAPI | 生成、校验、规范检查 | `pnpm run openapi:generate`, `pnpm run openapi:check`, `pnpm run openapi:lint` |
| 质量与类型 | 统一代码质量闸门 | `pnpm run quality:check`, `pnpm run quality:fix`, `pnpm run quality:strict`, `pnpm typecheck` |
| 文档工具链 | 文档一致性与修复 | `pnpm run check:docs`, `pnpm run check:docs:strict`, `pnpm run optimize:docs` |
| 性能与 SEO | Lighthouse、性能与 SEO 体检 | `pnpm run performance:validate`, `pnpm run performance:lighthouse`, `pnpm run seo:audit`, `pnpm run seo:validate` |
| 预部署流程 | 一站式闸门 | `pnpm run pre-deploy:check`, `pnpm run check:all` |
| 发布管理 | 版本与变更管理 | `pnpm run changeset`, `pnpm run release:version`, `pnpm run release:status` |

## Development & Preview
- `pnpm dev` — Next.js 本地开发模式（Node.js runtime）。
- `pnpm dev:cf` — 通过 OpenNext Cloudflare 适配器构建后启动 `wrangler dev`（需本地 D1 绑定）。
- `pnpm dev:remote` — 使用 `wrangler dev --remote` 直连 Cloudflare，适合验证平台差异。
- `pnpm wrangler:dev` — 直接运行 Wrangler 进行 Worker 调试。

## Build Pipeline
- `pnpm build` / `pnpm start` — 标准 Next.js 生产构建与启动。
- `pnpm build:cf` / `pnpm deploy:cf` / `pnpm deploy` — 使用 OpenNext Cloudflare 适配器构建并部署到 Workers。
- `pnpm prebuild` / `pnpm prebuild:cf` — 构建前处理（修复 i18n 编码、生成 headers）。
- `pnpm analyze:bundle` — 以 `ANALYZE=true` 运行构建，生成 Bundle Analyzer 报告。

## Database Utilities
- `pnpm db:generate` / `pnpm db:generate:named` — 基于 schema 生成迁移文件。
- `pnpm db:migrate:local` / `pnpm db:migrate:prod` — 通过 Wrangler 将迁移应用到本地或远程 D1。
- `pnpm db:studio` / `pnpm db:studio:local` — 启动 Drizzle Studio UI（默认读取 `drizzle.config.ts`，本地版本使用 `drizzle.local.config.ts`）。
- `pnpm db:inspect:local` / `pnpm db:inspect:prod` — 在 D1 中执行只读 SQL，便于排障。
- `pnpm db:reset:local` — 清空演示数据并重新应用迁移。

## OpenAPI Workflow
- `pnpm run openapi:generate` — 生成 `public/openapi.json`。
- `pnpm run openapi:check` — 对比当前实现与基线，阻止未记录的变更。
- `pnpm run openapi:lint` — 使用 Spectral 校验 OpenAPI 规范。

## Documentation Tooling
- `pnpm run check:docs` — 运行文档一致性检查。
- `pnpm run check:docs:strict` — 在严格模式下运行（需要 `DOC_STRICT_MODE=1` 或命令显式指定）。
- `pnpm run check:docs:mcp` — 启用 MCP 辅助（`ENABLE_MCP=1`）的文档检查模式。
- `pnpm run optimize:docs` / `:check` / `:fix` / `:report` — 自动化修复与性能分析。
- `pnpm run check:links` — 校验 Markdown 链接。

常用环境变量：
- `DOCS_SYNC*`、`DOCS_AUTOGEN*` — 控制文档同步与自动生成器范围、跳过及详细日志。
- `SKIP_DOCS_NORMALIZE`、`SKIP_DOCS_CHECK` — `check:all.mjs` 中跳过文档校验的开关。

## Quality, Formatting & Types
- `pnpm lint` / `pnpm biome:check` / `pnpm biome:apply` — 使用 Biome 进行检查与自动修复。
- `pnpm run quality:check` — 汇总代码质量检查（Biome +自定义规则）。
- `pnpm run quality:fix` — 在执行质量检查后自动格式化代码。
- `pnpm run quality:strict` — 使用 `tsconfig.strict.json` 执行严格类型检查。
- `pnpm typecheck` — 生成 Cloudflare env 类型后执行标准 TS 检查。
- `pnpm pre-commit:quality` — Husky pre-commit 钩子调用的组合检查。

## Performance & SEO
- `pnpm run performance:validate` — 调用性能验证脚本聚合系统指标。
- `pnpm run performance:lighthouse` — 以 `ANALYZE=true` 构建并用于 Lighthouse 分析。
- `pnpm run seo:audit` — 运行 SEO 审计脚本。
- `pnpm run seo:validate` — 链式执行 SEO 审计与性能验证。

常用环境变量：
- `ANALYZE` — 控制是否生成性能分析产物。
- `OPENNEXT_DEV` — 影响 Cloudflare 构建与本地模拟行为。

## Release & Change Management
- `pnpm run changeset` — 创建或管理 Changeset。
- `pnpm run release:version` — 应用 Changeset 并刷新 lockfile。
- `pnpm run release:status` — 查看待发布的变更。
- `pnpm run push` / `pnpm run push:rollback` — 内部推送与回滚辅助脚本。

## Aggregated Checks
- `pnpm run check:all` — 聚合质量、文档与链接检查，可通过 `SKIP_DOCS_*` 环境变量调节。
- `pnpm run pre-deploy:check` — 在部署前依次运行质量检查、性能验证与 SEO 审计。

## Miscellaneous Utilities
- `pnpm run cf-typegen` — 生成 Cloudflare 环境绑定类型。
- `pnpm run config:headers` — 生成 `next.config.ts` 使用的自定义 Header 配置。
- `pnpm run suggest:api-index` — 基于源码扫描生成 API 索引建议。
- `pnpm run translate` / `translate:<locale>` — 编译多语言脚本并输出翻译。
- `pnpm run check:i18n` / `pnpm run fix:i18n` — 校验并修复 i18n 资源编码。

## Related Documentation
- `.dev.vars.example` — 本地开发环境变量模板。
- [`docs/env-and-secrets.md`](env-and-secrets.md) — 环境变量、绑定与轮换策略。
- [`docs/docs-maintenance.md`](docs-maintenance.md) — 文档工具链与自动化细节。
