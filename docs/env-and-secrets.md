# Environment & Secrets

> Source of truth for environment variables, bindings, and secret management.

## Local
- Copy `.dev.vars.example` → `.dev.vars` (not committed)
- `pnpm dev` reads `.env.local` if present; Workers flows use `.dev.vars`

## Cloudflare Bindings
- Define bindings in `wrangler.jsonc`
  - D1: `next_cf_app`
  - R2: `next_cf_app_bucket`
  - AI: `AI`
  - Static assets: `ASSETS`

Run `pnpm cf-typegen` after adding/updating bindings to refresh `cloudflare-env.d.ts`.

## Common Variables
- `NEXT_PUBLIC_APP_URL` — public base URL for links and SEO
- `BETTER_AUTH_SECRET` — server secret for sessions
- `CREEM_API_URL` / `CREEM_API_KEY` — external billing service
- `OPENAI_API_KEY` / `GEMINI_API_KEY` — AI providers
- Health toggles: `HEALTH_REQUIRE_DB`, `HEALTH_REQUIRE_R2`, `HEALTH_REQUIRE_EXTERNAL` ("true"/"false")
- Health auth: `HEALTH_ACCESS_TOKEN` — enables detailed health output behind `X-Health-Token` or `Authorization: Bearer`
- Admin cookies: `ADMIN_FORCE_SECURE_COOKIES` — force secure cookies even when proto headers are missing

## Rotation Policy
- Use `wrangler secret put <NAME>` for production secrets
- Rotate on schedule and after incident
- Update `.dev.vars.example` and docs when variables change

## Tips
- Keep minimal variables in CI; prefer Workers secrets
- Avoid leaking secrets into logs or client env (`NEXT_PUBLIC_*` is public)
- Validate configuration via `/api/health` strict mode before rollout

