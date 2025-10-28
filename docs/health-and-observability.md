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
- 内置指标缓冲：`instrumentation.ts`、`cache.ts`、`SummarizerService` 等会通过 `recordMetric` 记录关键事件，缓冲会自动上报到 `OBSERVABILITY_METRICS_ENDPOINT`；调用 `logMetrics()` 可以强制立即 flush 并将当前缓冲打印到日志。

### Metrics Reference

| Metric | 描述 | 关键标签 |
| --- | --- | --- |
| `cache.lookup` | API 缓存命中/未命中/跳过/错误次数 | `cache_name`, `layer`, `operation="get"`, `result` (`hit`/`miss`/`bypass`/`error`), `reason`, `error_type`, `error_name` |
| `cache.write` | API 缓存写入成功与失败 | `cache_name`, `layer`, `operation="set"`, `result` (`success`/`error`), `ttl_seconds`, `error_type`, `error_name` |
| `external_api.request.count` | 外部 API 调用次数（包括 Workers AI） | `service`, `route`, `method`, `status`, `outcome` (`success`/`client_error`/`server_error`), `traceId`, `userId` |
| `external_api.request.duration_ms` | 外部 API 调用耗时（毫秒） | 同上 |
| `ai.summarizer.outcome` | 摘要服务成功或回退次数 | `result` (`success`/`fallback`), `status`, `style`, `language` |
| `ai.summarizer.circuit_breaker.transition` | 摘要断路器状态变化 | `breaker`, `state` (`open`/`half-open`/`closed`) |
| `ai.summarizer.circuit_breaker.blocked` | 因断路器拒绝的请求次数 | `breaker`, `state` |

### Metrics Runbook（Workers Analytics Engine 示范）

1. **配置环境变量**：在 Cloudflare Worker 中设置
   - `OBSERVABILITY_METRICS_ENDPOINT`：指向自建指标接收 Worker（该 Worker 将写入 Analytics Engine 数据集或转发到 Sentry/第三方）。
   - 可选：`OBSERVABILITY_METRICS_TOKEN`（Bearer Token）、`OBSERVABILITY_METRICS_FLUSH_INTERVAL_MS`（默认 15s）、`OBSERVABILITY_METRICS_MAX_BUFFER`（默认 200）。
2. **确认摄取**：部署后，通过 `wrangler tail` 或接收 Worker 的日志确认收到 `metrics` JSON 载荷；字段结构为
   ```json
   {
     "metrics": [
       {"name": "cache.lookup", "value": 1, "tags": {"result": "hit", "cache_name": "api-response", ...}, "timestamp": 1730832000000},
       ...
     ],
     "sentAt": "2024-11-05T08:00:00.000Z"
   }
   ```
3. **查询示例**：若接收 Worker 将数据写入 Analytics Engine 数据集 `observability_metrics`，可以使用 Wrangler CLI：
   ```bash
   wrangler analyticsengine query observability_metrics \
     "SELECT metric.name, metric.tags->>'result' AS result, SUM(metric.value) AS total
      FROM observability_metrics
      WHERE metric.name = 'cache.lookup' AND $__CF_INTERVAL_START >= DATE_ADD('minute', -60, NOW())
      GROUP BY 1, 2
      ORDER BY total DESC;"
   ```
   - 将 `metric.tags->>'result'` 替换为 `metric.tags->>'service'` 可筛选外部 API 调用。
   - 查询 `ai.summarizer.outcome` 时，可按 `result='fallback'` 聚合统计回退次数。
4. **仪表盘与告警**：
   - 在 Analytics Engine 中创建图表：缓存命中率 = `hit / (hit + miss)`。
   - 设置告警阈值：`ai.summarizer.outcome{result="fallback"}` 在 5 分钟窗口内超过阈值时发送 PagerDuty。
   - 对外部 API 调用监控 95 分位延迟：`P95(external_api.request.duration_ms{service="workers-ai"})`。

### Fault Injection & Chaos Tests
- 通过 `FAULT_INJECTION` 环境变量或请求头 `x-fault-injection` 启动特定的故障注入开关，多个值使用逗号分隔，例如：
  - `summarizer.before-run` — 在调用 Workers AI 前直接触发异常。
  - `summarizer.retry-attempt` — 每次重试前抛错，可验证熔断/降级逻辑。
  - `summarizer.fallback` — 在降级阶段再次抛错，确保调用方具备兜底。
- 使用 `enableFaultInjection()` 可以在脚本或测试中动态启用标识，便于编写混沌测试脚本。

### Summarizer Circuit Breaker

- **配置入口**：`config/environments/*.json` 中的 `services.external_apis.circuit_breaker` 字段，或通过环境变量 `SERVICES_EXTERNAL_APIS_FAILURE_THRESHOLD`、`SERVICES_EXTERNAL_APIS_RECOVERY_TIMEOUT_SECONDS`、`EXTERNAL_API_RETRY_ATTEMPTS` 等覆盖。
- **关键参数**：
  - `failure_threshold` — 连续失败达到该次数后熔断（默认 5 次）。
  - `recovery_timeout` — 熔断后等待多长时间进入半开状态，支持 `30s`、`1m` 等写法。
  - `half_open_max_calls` — 半开状态下允许的并发探测请求数（默认 1）。
- **与重试的协同**：熔断器在进入打开或半开状态前会在每次请求前检查；一旦进入打开状态，重试逻辑不会继续尝试，直接快速失败并返回 503，响应中会附带 `Retry-After`（秒）提示可恢复时间。调整 `retry_attempts` 时需要考虑 `failure_threshold`，以避免单次请求的内部重试就耗尽失败预算。推荐：
  - 将 `failure_threshold` 设置为大于单次请求内的最大重试次数，例如重试 3 次时设为 ≥5。
  - 当需要快速恢复时，缩短 `recovery_timeout` 并结合 `half_open_max_calls` 在半开状态允许并发探测，以验证下游是否恢复。
- **可观测性**：`ai.summarizer.circuit_breaker.transition` 记录打开/半开/关闭事件；`ai.summarizer.circuit_breaker.blocked` 统计被熔断拒绝的请求数，可配合日志或告警追踪下游异常窗口。

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

