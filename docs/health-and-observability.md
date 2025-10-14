# Health & Observability

## Health Endpoint
- Path: `/api/health`
- Modes:
  - `?fast=1` — skip expensive checks (e.g., external services)
  - strict (no `fast`) — check DB, R2, external endpoints; returns 503 on failure
- Auth:
  - Set `HEALTH_ACCESS_TOKEN` in Cloudflare/Wrangler and send `X-Health-Token` or `Authorization: Bearer <token>` to receive detailed diagnostics
  - Without the token, the endpoint returns sanitized summaries (boolean only) and withholds secret/binding names; failures respond with guidance to supply the token
- Use in CI and post‑deploy gates; dashboards can poll it for status

## What It Checks
- DB (D1): basic read (e.g., `SELECT 1` or minimal select)
- R2: bucket list/read capability
- App URL: resolves from settings/env and validates format (details masked unless a valid token is presented)
- External: HEAD/GET against `CREEM_API_URL` with fallback from HEAD→GET

## Logging
- Prefer structured logs (JSON) on Workers
- Include request id, user id (if available), route, and duration
- Avoid logging secrets or PII

## Monitoring
- Workers Analytics — Edge 侧访问与性能指标
- `wrangler tail` / 日志聚合 — 捕获异常与慢请求，必要时自建或引入第三方
- Alerting — 基于健康检查失败或日志指标构建告警

## Playbooks
- Health fails on DB: re‑run migrations, check D1 binding, confirm region
- Health fails on R2: verify binding and permissions (supply `X-Health-Token` to see exact missing binding)
- Health fails on external: review status page, credentials, and timeouts

