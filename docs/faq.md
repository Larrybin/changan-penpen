# FAQ

## What do I need to run locally?
- Node 20.x, pnpm 9.x, a Cloudflare account
- Copy `.dev.vars.example` → `.dev.vars` and fill required keys
- Run `pnpm dev` (or `pnpm dev:cf` for Workers simulation)

## How do I deploy to production?
- Push to `main` or use the Deploy workflow targeting `production`
- See `docs/deployment/cloudflare-workers.md` and `docs/workflows/deploy.md`

## Why does `/api/health` fail on strict mode?
- External service or DB/R2 check failed; try `/api/health?fast=1` first
- Check credentials and bindings in `wrangler.toml` and `.dev.vars`

## Where do I find environment variables?
- `docs/env-and-secrets.md` and `.dev.vars.example`

## How do I add a new page or API?
- Page: add `src/app/<route>/page.tsx`
- API: prefer Server Actions; for REST add `src/app/api/<name>/<action>.route.ts`

