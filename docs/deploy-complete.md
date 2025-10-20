# Production Deployment Notes

This document complements `docs/deployment/cloudflare-workers.md` and `docs/workflows/deploy.md` with end‑to‑end considerations.

## Pre‑deploy
- Ensure CI is green and coverage thresholds hold
- Verify strict health check `/api/v1/health` passes in staging (fast mode 可选)
- Review DB migrations and data impacts; export D1 snapshot if necessary

## Deploy
- Push to `main` or run the Deploy workflow targeting production
- OpenNext build → `wrangler deploy`
- 自动健康检查：部署流程会循环重试 `GET /api/v1/health`（严格模式）直至返回 200，并在 Step Summary 中记录 URL/次数；可通过仓库变量 `DEPLOY_HEALTH_RETRIES`、`DEPLOY_HEALTH_RETRY_DELAY`、`DEPLOY_HEALTH_TIMEOUT` 调整参数。
- 部署审计摘要会自动附上最新 `CHANGELOG` 条目，方便值班人员快速查看本次发布的用户可见改动。

## Post‑deploy
- Review Workers Analytics 与实时日志（`wrangler tail`）
- Verify auth and key flows (login, critical APIs)
- Communicate release notes and known issues（Step Summary 中的发布说明可直接引用）

## Rollback
- `wrangler deploy --rollback`
- Restore D1 snapshot when schema/data changed

## Checklist
- [ ] CI passed (lint/typecheck/build)
- [ ] Migrations reviewed
- [ ] 健康检查通过（自动严格模式；若手动跑 fast=1 亦请确认）
- [ ] Observability dashboards clean
- [ ] Docs updated if process changed

