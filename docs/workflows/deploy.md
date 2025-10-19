# Deploy Workflow

> Reference for CI/CD deployment to Cloudflare Workers via OpenNext.

## Triggers
- Push to `main`
- Pull requests targeting `main`
- Manual dispatch with commit SHA or tag

## Steps (high level)
1. Checkout and set up PNPM cache
2. `pnpm install --frozen-lockfile`
3. 复用 `ci.yml` 质量门(Biome/tsc/Vitest/构建)
4. OpenNext build + `wrangler deploy`
5. Health checks:
   - Workflow 自动循环重试 `GET /api/v1/health`（严格模式）直至响应 200，并把结果写入 Step Summary（默认重试 5 次，5 秒间隔，可由仓库变量调节）
   - `GET /api/v1/health?fast=1` 仍可手动调用，用于绕过外部依赖的快速探活
6. 部署审计摘要会在 Step Summary 中附带最新 `CHANGELOG` 发布说明，供发布公告与回溯使用

## Rollback
- `wrangler deploy --rollback`
- Restore D1 backups if schema changed

## Environment
- Use Cloudflare secrets for production credentials
- Prefer `wrangler secret` and typed env via `pnpm cf-typegen`

