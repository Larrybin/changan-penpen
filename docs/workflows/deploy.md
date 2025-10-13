# Deploy Workflow

> Reference for CI/CD deployment to Cloudflare Workers via OpenNext.

## Triggers
- Push to `main`
- Pull requests targeting `main`
- Manual dispatch with commit SHA or tag

## Steps (high level)
1. Checkout and set up PNPM cache
2. `pnpm install --frozen-lockfile`
3. 复用 `ci.yml` 质量门（Biome/tsc/Vitest/构建）
4. OpenNext build + `wrangler deploy`
5. Health checks:
   - Workflow automatically calls `GET /api/health?fast=1` and expects 200 `{ ok: true }`
   - 严格模式 `GET /api/health` 需人工触发（如仍建议执行）

## Rollback
- `wrangler deploy --rollback`
- Restore D1 backups if schema changed

## Environment
- Use Cloudflare secrets for production credentials
- Prefer `wrangler secret` and typed env via `pnpm cf-typegen`

