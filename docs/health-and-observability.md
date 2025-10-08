# 健康检查与可观测性
> 本文定义 `/api/health` 的使用方式、观测指标、日志汇集与故障排查路径。

## 1. 健康检查接口
- 路径：`/api/health`
- 运行时：`runtime = "nodejs"`（确保在 Workers 中仍可使用）
- 检查项：
  - **Fast 模式**：`?fast=1` 或 `?mode=fast`。仅验证环境变量、R2 绑定与基本算力，适合部署后快速验证。
  - **Strict 模式**：默认模式。额外检查 D1 查询、外部依赖（例如 Creem API）与可选的队列/AI 服务。
  - 环境变量 `HEALTH_REQUIRE_DB/R2/EXTERNAL` 用于控制是否强制通过对应检查。
- 响应示例：
```json
{
  "ok": true,
  "time": "2025-10-07T12:34:56.789Z",
  "durationMs": 42,
  "checks": {
    "db": {"ok": true},
    "r2": {"ok": true},
    "env": {"ok": true},
    "appUrl": {"ok": true},
    "external": {"ok": true}
  }
}
```

## 2. curl 示例
```bash
# Fast 模式（用于部署后自检）
curl -fsS --retry 3 --retry-all-errors --retry-delay 5 \
  --connect-timeout 3 --max-time 8 \
  "https://<domain>/api/health?fast=1"

# Strict 模式（CI / 运维例行作业）
curl -fsS --retry 2 --retry-delay 3 \
  "https://<domain>/api/health"
```

## 3. 监控建议
| 指标 | 说明 | 汇聚渠道 |
| --- | --- | --- |
| 健康检查响应时长 | `durationMs` | CI、Cron、外部监控平台 |
| Workers 请求错误率 | HTTP status、捕获的异常 | Cloudflare Workers Analytics |
| D1 查询耗时 / 错误 | 成功率、平均等待时长 | `wrangler d1 insights` / Dashboard |
| R2 操作 | `put/get` 成功率 | R2 Analytics |
| AI 调用 | 成功/失败次数、费用 | Cloudflare Workers AI Dashboard 或自建日志 |

## 4. 日志方案
- **Cloudflare Workers Tail**：
  ```bash
  wrangler tail next-cf-app --env production
  ```
- **结构化日志**：推荐统一使用 `console.log(JSON.stringify({ level: "info", ... }))` 输出，方便 Logpush 或第三方检索。
- **Logpush / 外部存储**：可配置推送到 R2、Kafka、Splunk 等，确保日志保留策略满足合规要求。
- **Sentry**（已接入）：
  - `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` 在对应运行时初始化 SDK，自动采集错误和性能数据。
  - `instrumentation.ts` 负责在 Edge 与 Node Runtime 启动阶段注册监控，确保 App Router 与 Workers 共享同一配置。
  - 在 `.dev.vars` / Cloudflare Secrets 中填写 `SENTRY_DSN` 与 `NEXT_PUBLIC_SENTRY_DSN`，并参考 `docs/env-and-secrets.md` 完成样例配置。
  - 通过 `SENTRY_TRACES_SAMPLE_RATE`、`SENTRY_PROFILES_SAMPLE_RATE`、`SENTRY_REPLAYS_*` 调整采样率，默认配置应避免产生过多事件。

## 5. 告警策略
- **即时告警**：健康检查失败或 Sentry 出现新的高优先级事件时，创建 “外部告警” Issue，并同时推送到邮件/Slack。
- **阈值告警**：在 Cloudflare Analytics 中设置错误率、CPU 时间阈值，触发时通知运维值班人。
- **人工巡检**：参考 `docs-maintenance.md` 的月度检查清单，定期确认监控、日志管道与告警渠道处于有效状态。

## 6. 故障排查流程
1. 查看 “外部告警” Tracker Issue 或相关 PR 评论，确认影响范围。
2. 使用 `wrangler tail` 获取实时日志，定位异常请求。
3. 通过命令行验证：
   ```bash
   wrangler d1 execute next-cf-app --remote --command "SELECT COUNT(*) FROM todos;"
   wrangler r2 object list next-cf-app-bucket --limit 1
   ```
4. 检查 Cloudflare Dashboard（Workers → Deployments）中的最近部署，确认是否与发布相关。
5. 若涉及外部依赖，确认 `HEALTH_REQUIRE_EXTERNAL` 是否导致阻塞，并评估该依赖可用性。

## 7. 定期任务建议
- 每日/每小时：监控 `/api/health?fast=1`，失败后自动触发告警。
- 每日：运行 Strict 模式并执行核心业务流程（可结合 Playwright 等 E2E 测试）。
- 每周：审查 Workers Analytics、D1 Insights 与 R2 报表。
- 每月：执行灾备演练，验证恢复流程，详细步骤见 `docs/db-d1.md`。

## Edge rate limiting (English update)
- **Purpose**: Protect `/api/creem/create-checkout` and `/api/webhooks/creem` by throttling abusive traffic on Cloudflare's edge before it reaches business logic.
- **Binding**: The Worker expects a `RATE_LIMITER` binding (see `wrangler.jsonc`) that points to a Cloudflare Rate Limiting namespace. Without the binding the limiter is skipped automatically.
- **Key strategy**: `create-checkout` keys combine the logical name with the authenticated `user.id`; webhook keys fall back to the sender IP when the Creem signature is missing.
- **Operational signals**: Track 429 counts via Workers Analytics or Logpush. A spike indicates either an attack or aggressive client retries—coordinate with support before loosening the threshold.
- **Alerting**: Add a Workers Analytics alert on 429 > baseline +20% over 5 minutes and notify the on-call channel. Document overrides or allow-lists in the incident log.

---

新增监控项或调整健康检查策略后，请同步更新本文件与 `docs/deployment/cloudflare-workers.md`，确保文档与实际配置一致。
