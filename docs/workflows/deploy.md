# Deploy Workflow

> Reference for CI/CD deployment to Cloudflare Workers via OpenNext.

## Triggers
- Push to `main`
- Manual dispatch with commit SHA or tag

## Steps (high level)
1. Checkout and set up PNPM cache
2. `pnpm install --frozen-lockfile`
3. `pnpm lint && pnpm test --coverage && pnpm build`
4. OpenNext build + `wrangler deploy`
5. Health checks:
   - `GET /api/health?fast=1` must return 200 `{ ok: true }`
   - `GET /api/health` (strict) must return 200 before marking success
6. Post‑deploy notifications

## Rollback
- `wrangler deploy --rollback`
- Restore D1 backups if schema changed

## Environment
- Use Cloudflare secrets for production credentials
- Prefer `wrangler secret` and typed env via `pnpm cf-typegen`

