# Cloudflare D1 Guide

> How we define schema, run migrations, initialize data, back up, and troubleshoot.

## 1) Basics
- ORM: Drizzle (TypeScript‑first). Schema under `src/db/schema.ts`.
- Access helper: `src/db/index.ts` exposes `getDb()` which resolves the correct D1 binding per environment.
- Migrations live in `src/drizzle/` and are configured by `drizzle.config.ts`.

## 2) Migrations
Common scripts (see `package.json`, adjust if your project differs):
```bash
# generate a named migration
pnpm db:generate:named "add_users_table"

# apply locally (SQLite)
pnpm db:migrate:local

# apply to production (requires wrangler auth)
pnpm db:migrate:prod
```

Tips:
- Commit generated SQL under `src/drizzle`.
- Keep migrations idempotent and forward‑only; add a follow‑up migration for rollbacks if needed.

## 3) Init & Seed
- Provide minimal seed scripts under `scripts/` if your feature needs bootstrap data.
- Keep seeds deterministic and environment‑aware.

## 4) Backups & Restore
- CI should export D1 before production migrations if you expect risk.
- Restore flow: deploy rollback + re‑import your exported SQLite snapshot.

## 5) Troubleshooting
- Connection errors: verify D1 binding name in `wrangler.toml` and Cloudflare dashboard.
- Missing tables after deploy: ensure migrations ran; check CI job logs.
- Local dev out of sync: reset and re‑apply migrations (`pnpm db:reset:local` then migrate).

## 6) Recent Updates
- 2025-10-15：新增 `credit_transactions` 表，用于记录积分来源/消耗并保留剩余额度。
- `user` 表新增 `current_credits`、`last_credit_refresh_at` 字段，作为积分余额与月度刷新时间。
- 兼容性：`customers.credits` 与 `credits_history` 仍保留作为现有购买记录来源，后续可根据需要迁移。
