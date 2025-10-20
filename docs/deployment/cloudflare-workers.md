# Deploying on Cloudflare Workers (OpenNext)

This project targets Cloudflare Workers using OpenNext.

## Prerequisites
- `pnpm` installed
- Cloudflare account and `wrangler` CLI authenticated: `pnpm dlx wrangler login`
- Bindings and secrets configured in `wrangler.toml` and Cloudflare dashboard

## Typical Flows

### Local (Workers)
- `pnpm dev:cf` - build via OpenNext and run Workers locally with Wrangler
- `pnpm cf-typegen` - regenerate typed bindings after adding/changing env

### Build
- `pnpm build` - standard Next.js production build (Node runtime)
- `pnpm build:cf` (if present) - OpenNext build targeting Workers

### Deploy
- `pnpm deploy:cf` - OpenNext build + `wrangler deploy`
- Health gate: CI and rollout 默认在部署后重试 `/api/v1/health`(严格模式);可选追加 `/api/v1/health?fast=1` 作为快速自检

### Deployment Audit Trail
- GitHub Actions 的 `Deploy Production` job 会生成部署审计摘要,内容包含版本号,执行者以及推送到生产的提交列表.
- 摘要会自动写入该 workflow run 的 **Summary** 标签页(来自 `$GITHUB_STEP_SUMMARY`),用于长期留存.
- 同一摘要还会通过环境部署注释同步到 GitHub `production` Environment,在仓库 Settings → Environments → production → Deployment history 中可以直接点击最新记录查看,并跳转到完整的运行摘要.

### Rollback
- `wrangler deploy --rollback`
- Restore D1 backup if schema/data changed (see `docs/db-d1.md`)

## Bindings & Secrets
- D1: `next_cf_app`
- R2: `next_cf_app_bucket`
- Workers AI: `AI`
- ASSETS bucket for static assets
- Secrets: `BETTER_AUTH_SECRET`, `CREEM_API_KEY`, `OPENAI_API_KEY`/`GEMINI_API_KEY`(可选,用于 AI 功能), etc.

Run `pnpm cf-typegen` after any change to bindings to refresh `cloudflare-env.d.ts`.

Tip
- CI 变量:工作流支持从 `Actions → Variables` 读取 `CREEM_API_URL`(优先)或 `CREEM_API_URL_PRODUCTION`(回退).建议统一使用 `CREEM_API_URL`.
- 自动下发 Secrets:变量 `SYNC_PRODUCTION_SECRETS` 未显式设为 `false` 时,CI 将自动把 GitHub Secrets 同步到 Cloudflare(production 环境).如需关闭,请将其设置为 `false`.

## Notes
- Enable `nodejs_compat` and `nodejs_als` in `wrangler.toml` when Node APIs or AsyncLocalStorage features are required
- Large/long‑running tasks should be offloaded; add timeouts for outbound calls
- Keep `.dev.vars.example` and this doc in sync with deployments

## Edge Rate Limiting
- Namespace setup: Create a Cloudflare Rate Limiting namespace (e.g. `wrangler ratelimit create creem-checkout --limit 10 --period 60`) and note the generated ID.
- Binding: Update `wrangler.toml` so both the default worker and the `production` environment attach the namespace as `RATE_LIMITER`. Deploying without the binding leaves rate limiting disabled.
- Verification: After deployment, hit `/api/v1/creem/create-checkout` repeatedly with the same user session until a 429 appears, confirming the edge policy works. Use `wrangler tail` to capture the `[rate-limit]` log line for auditing.
- Rollback: Removing the binding or setting a larger quota in the Cloudflare Dashboard takes effect immediately. Document any temporary overrides in the release checklist.
