# Getting Started (5 Minutes)

> For first‑time contributors: run locally in minutes and understand how production deploys are triggered.

## 1. Requirements
- Node.js 20.x
- pnpm 9.x
- Cloudflare account (for production deploys)
- GitHub CLI (optional)

Verify:
```bash
node -v
pnpm -v
```

## 2. Clone & Install
```bash
git clone https://github.com/ifindev/fullstack-next-cloudflare.git
cd fullstack-next-cloudflare
pnpm install
```

## 3. Environment
```bash
cp .dev.vars.example .dev.vars
```

Fill at least:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_TOKEN`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (if using Google login)
- `CREEM_API_KEY` and `CREEM_WEBHOOK_SECRET` (if billing callbacks)

If you add D1/R2/AI bindings in `wrangler.toml`, run `pnpm cf-typegen`.

## 4. Run Locally
```bash
pnpm dev
```
Open `http://localhost:3000` and verify the homepage, auth, and Todos demo.

### 4.1 Workers Runtime (Edge)
```bash
pnpm dev:cf      # OpenNext build + wrangler dev (local)
pnpm dev:remote  # remote region (requires wrangler login)
```

## 5. Production Deploy Overview
- Push to `main` or manually dispatch the Deploy workflow with `production`
- CI + 自动健康检查（fast: `/api/v1/health?fast=1`）必须通过；严格模式 `/api/v1/health` 需人工触发并确认
- Details: `docs/deployment/cloudflare-workers.md`

## 6. What’s Next
- Read `docs/local-dev.md` for debugging tips
- Env & secrets matrix: `docs/env-and-secrets.md`
- Architecture: `docs/architecture-overview.md`
- Before committing: `pnpm lint` and `pnpm test` (test plan in `docs/testing.md`)

---

If you hit start‑up or env issues, see `docs/troubleshooting.md`. Include logs (e.g., `gh run watch`) in PRs for reviewers.

