# CI/CD Overview

> Structure, permissions, quality gates, and dependencies of our pipelines. See `.github/workflows/` for sources.

## 1. Flow
```
Push/PR → CI (Biome + tsc + Vitest + build)
        → Deploy (re‑uses CI as quality gate)
        → Production Deploy (main)
          → backup → migrate → deploy → health checks
```

## 2. Workflows
| Workflow | Trigger | Steps | Permissions |
| --- | --- | --- | --- |
| `ci.yml` | PR / non‑main push / manual | pnpm install, Biome, tsc, Vitest (coverage), Next build | `contents: read` |
| `deploy.yml` | Push to `main`, manual | Re‑use CI as quality gate; OpenNext build; Wrangler deploy; D1 migrations; health checks | Inherits secrets; uses `wrangler` in job |

## 3. CI Quality Gate
- `concurrency: ci-${ref}` to avoid duplicates
- Caches: pnpm (setup‑node cache), `.next/cache`
- Steps:
  1) `pnpm run fix:i18n` + diff check
  2) `pnpm exec biome check .`
  3) `pnpm exec tsc --noEmit`
  4) `pnpm exec vitest run --coverage` (outputs json-summary)
  5) `pnpm build`
- Print `NEXT_PUBLIC_APP_URL` from GitHub Variables for diagnostics

## 4. Deploy Details
- Quality gate via `uses: ./.github/workflows/ci.yml`
- Production:
  - Backup D1; apply migrations; validate key tables
  - Inject deployment vars (e.g. `CREEM_API_URL`) as needed
  - `SYNC_PRODUCTION_SECRETS` toggles secret sync
  - Health checks: `/api/health?fast=1` must pass; strict must pass before success
- All Actions pinned to commit SHAs

## 5. Required Secrets/Vars
| Name | Purpose | Scope |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy, migrations, backups | Production |
| `CLOUDFLARE_ACCOUNT_ID` | Account | Production |
| `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Auth | Production |
| `CLOUDFLARE_R2_URL` | Static asset URL | Production |
| `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET` | Billing | Production |
| `PRODUCTION_HEALTHCHECK_URL` | Custom health endpoint | Optional |
| Vars: `NEXT_PUBLIC_APP_URL`, `CREEM_API_URL_PRODUCTION` | Build & deploy | Production |

Full matrix: see `docs/env-and-secrets.md`.

## 6. Caching
- pnpm store keyed by `pnpm-lock.yaml`
- `.next/cache` for build acceleration
- If corrupted, bump workflow cache keys or clear caches

## 7. Rollback & Notifications
- On failure: inspect GitHub Checks/Actions logs; rerun if needed
- Rollback: Cloudflare Dashboard previous version, or `wrangler deploy --env production --rollback`
- External alerts (email/Slack) are handled by team alerting; repo does not ship auto‑notify workflows

## 8. Local Simulation
- Use `act` for CI where possible (Cloudflare Actions may not work)
- Manual deployment: see `docs/deployment/cloudflare-workers.md`

## 9. Maintenance
- When workflows change, update `docs/ci-cd.md` and `docs/workflows/*.md`
- Minimize `permissions` and pin Actions to commits
- Monthly sanity check: ensure dependencies (Docker/Actions) aren’t deprecated

---

See also:
- `docs/workflows/ci.md`
- `docs/workflows/deploy.md`

