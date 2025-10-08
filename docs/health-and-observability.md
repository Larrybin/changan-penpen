# 健康检查与可观测性

> 定义 `/api/health` 的用法、日志/监控渠道与告警流程。新增检查项或监控工具时，请同步更新本文件。

## 1. 健康检查接口
- 路径：`/api/health`（`runtime = "nodejs"` 以避免 OpenNext Edge 限制）。
- 模式：
  - **Fast**：`?fast=1` 或 `?mode=fast`。检查环境变量、R2 绑定、`NEXT_PUBLIC_APP_URL` 解析；默认用于部署流水线。
  - **Strict**：默认模式，额外执行 D1 查询与外部依赖探活（Creem）。可通过环境变量 `HEALTH_REQUIRE_DB/R2/EXTERNAL` 控制是否阻断。
- 响应示例：
  ```json
  {
    "ok": true,
    "time": "2025-10-07T12:34:56.789Z",
    "durationMs": 42,
    "checks": {
      "db": { "ok": true },
      "r2": { "ok": true },
      "env": { "ok": true },
      "appUrl": { "ok": true },
      "external": { "ok": true }
    }
  }
  ```
- 失败时返回 503，并在 `checks.*.error` 中包含详细信息。

## 2. curl 模板
```bash
# Fast（部署/心跳）
curl -fsS --retry 3 --retry-all-errors --retry-delay 5 \
  --connect-timeout 5 --max-time 20 \
  "https://<domain>/api/health?fast=1"

# Strict（巡检/排障）
curl -fsS --retry 2 --retry-delay 3 \
  "https://<domain>/api/health"
```

## 3. 监控建议
| 指标 | 说明 | 获取方式 |
| --- | --- | --- |
| `durationMs` | 健康检查耗时 | CI、定时任务、第三方监控 |
| R2 可用性 | `checks.r2.ok` | Cloudflare R2 Analytics / `/api/health` | 
| D1 连接/查询 | `checks.db` 结果 + Wrangler 日志 | `wrangler d1 insights`、Dashboard |
| 外部服务 | `checks.external` | 根据 `CREEM_API_URL` 状态决定是否连通 | 
| Workers 错误率 | HTTP 状态、异常 | Cloudflare Workers Analytics |

## 4. 日志策略
- **实时调试**：`wrangler tail next-cf-app --env production`。
- **结构化日志**：优先 `console.log(JSON.stringify({ level, message, ... }))`，便于后续接入 Logpush / SIEM。
- **持久化**：如需长期存储，结合 Cloudflare Logpush → R2 或外部系统（S3/Splunk）。
- **Sentry（可选）**：若接入 `@sentry/nextjs`，请在 `docs/security.md` 与 `docs/env-and-secrets.md` 中记录 DSN 与权限。

## 5. 告警策略
- **即时告警**：Fast 健康检查失败 → 触发 GitHub workflow 失败通知 + 外部渠道（邮件 / Slack）。
- **异常趋势**：基于 Workers Analytics 设置阈值（错误率、CPU 时间、子请求）。
- **巡检计划**：参考 `docs-maintenance.md` 提供的月度 Checklist，定期手动执行 Strict 模式与关键用户旅程。

## 6. 故障排查 Runbook
1. 查看 Deploy Workflow 或 `外部告警` Issue，确认异常时间与请求 ID。
2. `wrangler tail` 获取现场日志。
3. 核查核心资源：
   ```bash
   wrangler d1 execute next-cf-app --remote --env production \
     --command "SELECT COUNT(*) FROM todos;"
   wrangler r2 object list next-cf-app-bucket --limit 1
   ```
4. 若 `checks.external` 失败，验证 `CREEM_API_URL` 与凭证。
5. 如需回滚，参考 `docs/deployment/cloudflare-workers.md`。

## 7. 定期任务建议
- 每日：自动或手动执行 `/api/health?fast=1` 并记录返回值。
- 每周：检查 Workers Analytics、D1 Insights 以及 R2 统计。
- 每月：演练数据库备份恢复、验证 `HEALTH_REQUIRE_*` 配置与文档更新。

---

新增监控或日志方案时，请同步更新本文件、`docs/deployment/cloudflare-workers.md` 与 `docs/troubleshooting.md`，确保 Runbook 完整。
