# Deploying on Cloudflare Workers (OpenNext)

This project targets Cloudflare Workers using OpenNext.

## Prerequisites
- `pnpm` installed
- Cloudflare account and `wrangler` CLI authenticated: `pnpm dlx wrangler login`
- Bindings and secrets configured in `wrangler.jsonc` and Cloudflare dashboard

## Typical Flows

### Local (Workers)
- `pnpm dev:cf` — build via OpenNext and run Workers locally with Wrangler
- `pnpm cf-typegen` — regenerate typed bindings after adding/changing env

### Build
- `pnpm build` — standard Next.js production build (Node runtime)
- `pnpm build:cf` (if present) — OpenNext build targeting Workers

### Deploy
- `pnpm deploy:cf` — OpenNext build + `wrangler deploy`
- Health gate: CI and rollout should hit `/api/health?fast=1` first, then strict mode without `fast`

### Rollback
- `wrangler deploy --rollback`
- Restore D1 backup if schema/data changed (see `docs/db-d1.md`)

## Bindings & Secrets
- D1: `next_cf_app`
- R2: `next_cf_app_bucket`
- Workers AI: `AI`
- ASSETS bucket for static assets
- Secrets: `BETTER_AUTH_SECRET`, `CREEM_API_KEY`, `OPENAI_API_KEY`/`GEMINI_API_KEY`, etc.

Run `pnpm cf-typegen` after any change to bindings to refresh `cloudflare-env.d.ts`.

## Notes
- Enable `nodejs_compat` in `wrangler.jsonc` only when Node APIs are required
- Large/long‑running tasks should be offloaded; add timeouts for outbound calls
- Keep `.dev.vars.example` and this doc in sync with deployments

