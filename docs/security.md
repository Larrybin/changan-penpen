# Security & Permissions

> Secrets, least privilege, dependency security, and branch protection.

## Secrets
- Never commit secrets. Use `wrangler secret` in production.
- Keep `.dev.vars.example` updated; rotate secrets after incidents.

## Permissions
- Cloudflare API Token must include only required scopes (Workers, D1, R2).
- Separate CI tokens from personal tokens. Prefer org‑scoped tokens.

## Session Cookies
- Admin entry tokens are issued with `HttpOnly` + `SameSite=Lax` and default `Secure`.
- Use the `ADMIN_FORCE_SECURE_COOKIES=true` toggle to keep cookies secure even in non‑HTTPS tunnels.
- Cookie security falls back to HTTPS detection via `X-Forwarded-Proto` / `CF-Visitor`.

## Operational Endpoints
- `/api/health` exposes only boolean summaries unless the caller presents `HEALTH_ACCESS_TOKEN` via `X-Health-Token` or `Authorization: Bearer`; share the token exclusively with trusted monitors.

## Dependencies
- Pin Actions to commit SHAs in workflows.
- Run `pnpm audit` periodically; keep critical deps patched.

## Branch Protection
- Require PR reviews and green CI for `main`.
- Enforce status checks (lint/tests/build) and signed commits if your org mandates it.

