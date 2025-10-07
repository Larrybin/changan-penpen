# 健康检查与可观测性

> 本文定义 `/api/health` 的使用方式、监控指标、日志收集与故障排查路径。

## 1. 健康检查接口
- 路径：`/api/health`
- 运行时：`runtime = "nodejs"`（保证在 Workers 中可用）
- 检查项：
  - **fast 模式**（`?fast=1` 或 `?mode=fast`）：验证环境变量、R2 绑定
  - **strict 模式**：额外检查 D1 轻量查询、外部依赖（如 Creem API）
  - 环境变量 `HEALTH_REQUIRE_DB/R2/EXTERNAL` 控制是否强制通过
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
# Fast 健康（部署管道使用）
curl -fsS --retry 3 --retry-all-errors --retry-delay 5 \
  --connect-timeout 3 --max-time 8 \
  "https://<domain>/api/health?fast=1"

# Strict 健康（人工/定时任务）
curl -fsS --retry 2 --retry-delay 3 \
  "https://<domain>/api/health"
```

## 3. 监控建议
| 指标 | 描述 | 采集途径 |
| --- | --- | --- |
| 健康检查响应时间 | `durationMs` | CI、Cron、外部监控 |
| Workers 请求错误率 | HTTP status、exceptions | Cloudflare Workers Analytics |
| D1 查询耗时 / 错误 | 成功率、锁等待 | `wrangler d1 insights` / Dashboard |
| R2 操作 | `put/get` 成功率 | R2 Analytics |
| AI 调用 | 成功/失败次数、费用 | Cloudflare Workers AI Dashboard 或自定义日志 |

## 4. 日志方案
- **Cloudflare Workers Tail**：
  ```bash
  wrangler tail next-cf-app --env production
  ```
- **Structured Logging**：建议统一使用 `console.log(JSON.stringify({level:'info', ...}))`
- **Logpush / 外部存储**：可配置至 R2、Kafka、Splunk（后续扩展）
- **Sentry**（建议）：
  - 通过 `@sentry/nextjs` Edge 支持
  - 在 `env-and-secrets.md` 中新增 DSN 并更新健康检查可选项

## 5. 告警策略
- **即时告警**：健康检查失败 → `ops-notify` Issue + 邮件/Slack（需要添加额外步骤）
- **趋势告警**：通过 Cloudflare Analytics 设定阈值告警（错误率、CPU 时间）
- **手动巡检**：`docs-maintenance.md` 列出了月度检查清单

## 6. 故障排查清单
1. 查看 `ops-notify` Tracker Issue 或 PR 评论
2. 使用 `wrangler tail` 获取实时日志
3. 命令行验证：
   ```bash
   wrangler d1 execute next-cf-app --remote --command "SELECT COUNT(*) FROM todos;"
   wrangler r2 object list next-cf-app-bucket --limit 1
   ```
4. 检查最近部署（Cloudflare Dashboard → Workers → Deployments）
5. 若外部依赖异常，确认 `HEALTH_REQUIRE_EXTERNAL` 是否影响可用性

## 7. 定期任务建议
- 每日/每小时：监控 `/api/health?fast=1`，失败自动通知
- 每日：运行 Strict 健康 + 关键业务流程（可使用 Playwright）
- 每周：检查 Workers Analytics、D1 Insights
- 每月：手工验证备份/恢复流程（详见 `docs/db-d1.md`）

---

新增监控项或更改健康检查逻辑时，请同步更新本文与 `docs/deployment/cloudflare-workers.md`。
