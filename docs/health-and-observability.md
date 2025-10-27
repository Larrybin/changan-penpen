# Health & Observability

## Health Endpoint
- Path: `/api/v1/health`
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
- 内置指标缓冲：`instrumentation.ts` 会通过 `recordMetric` 记录请求错误、AI 摘要成功/降级等事件；调用 `logMetrics()` 会刷出当前缓冲，用于在 Workers 中定时打印或接入第三方上报。

### Fault Injection & Chaos Tests
- 通过 `FAULT_INJECTION` 环境变量或请求头 `x-fault-injection` 启动特定的故障注入开关，多个值使用逗号分隔，例如：
  - `summarizer.before-run` — 在调用 Workers AI 前直接触发异常。
  - `summarizer.retry-attempt` — 每次重试前抛错，可验证熔断/降级逻辑。
  - `summarizer.fallback` — 在降级阶段再次抛错，确保调用方具备兜底。
- 使用 `enableFaultInjection()` 可以在脚本或测试中动态启用标识，便于编写混沌测试脚本。

## Playbooks
- Health fails on DB: re‑run migrations, check D1 binding, confirm region
- Health fails on R2: verify binding and permissions (supply `X-Health-Token` to see exact missing binding)
- Health fails on external: review status page, credentials, and timeouts

### Alert → Owner Mapping

| Symptom | Alert Name / Channel | Immediate Actions | Primary Owner |
| --- | --- | --- | --- |
| `/api/v1/health` reports `D1` failure | PagerDuty: `HealthCheck/D1Unavailable` | Check Wrangler bindings, run `pnpm db:migrate:local` (for repro), validate `next_cf_app` connectivity | Platform / Infra |
| `/api/v1/health` reports `R2` failure | Slack `#ops-alerts` (`health-r2-degraded`) | Verify `next_cf_app_bucket` permissions, inspect R2 dashboard, re-run health with token for details | Platform / Infra |
| `/api/v1/health` external check fails (Creem) | PagerDuty: `HealthCheck/CreemUnavailable` | Confirm `CREEM_API_URL` reachable, rotate API key if 401, coordinate with Billing vendor | Billing Squad |
| AI summarization returns `SERVICE_UNAVAILABLE` | Slack `#ai-alerts` (`ai-binding-missing`) | Validate Workers AI binding, redeploy if binding missing, notify ML lead | AI / Platform |
| Webhook rate limit (`RATE_LIMITED` on `/api/v1/webhooks/creem`) | Slack `#billing-alerts` (`webhook-rate-limited`) | Inspect Upstash metrics, increase window or investigate retry storm from Creem | Billing Squad |
| Auth flow blocked by rate limit | PagerDuty: `AuthFlowRateLimited` | Confirm Upstash availability, review recent login spikes, communicate with Support | Identity Team |

