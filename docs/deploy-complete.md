# Production Deployment Notes

This document complements `docs/deployment/cloudflare-workers.md` and `docs/workflows/deploy.md` with end‑to‑end considerations.

## Pre‑deploy
- Ensure CI is green and coverage thresholds hold
- Verify `/api/health?fast=1` passes in staging
- Review DB migrations and data impacts; export D1 snapshot if necessary

## Deploy
- Push to `main` or run the Deploy workflow targeting production
- OpenNext build → `wrangler deploy`
- Health gates must pass in fast mode first, then strict

## Post‑deploy
- Check Sentry dashboards and Workers Analytics
- Verify auth and key flows (login, critical APIs)
- Communicate release notes and known issues

## Rollback
- `wrangler deploy --rollback`
- Restore D1 snapshot when schema/data changed

## Checklist
- [ ] CI passed (lint/test/build)
- [ ] Migrations reviewed
- [ ] Health checks green (fast + strict)
- [ ] Observability dashboards clean
- [ ] Docs updated if process changed

