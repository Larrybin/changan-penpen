# Production Deployment Notes

This document complements `docs/deployment/cloudflare-workers.md` and `docs/workflows/deploy.md` with end‑to‑end considerations.

## Pre‑deploy
- Ensure CI is green and coverage thresholds hold
- Verify `/api/v1/health?fast=1` passes in staging
- 如需严格模式，手动验证 `/api/v1/health`
- Review DB migrations and data impacts; export D1 snapshot if necessary

## Deploy
- Push to `main` or run the Deploy workflow targeting production
- OpenNext build → `wrangler deploy`
- 自动健康检查：`GET /api/v1/health?fast=1`（workflow 默认调用）
- 严格模式 `/api/v1/health` 需人工触发（执行后再标记成功）

## Post‑deploy
- Review Workers Analytics 与实时日志（`wrangler tail`）
- Verify auth and key flows (login, critical APIs)
- Communicate release notes and known issues

## Rollback
- `wrangler deploy --rollback`
- Restore D1 snapshot when schema/data changed

## Checklist
- [ ] CI passed (lint/test/build)
- [ ] Migrations reviewed
- [ ] 健康检查通过（自动 fast；如执行严格模式请确认）
- [ ] Observability dashboards clean
- [ ] Docs updated if process changed

