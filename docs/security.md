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
- `/api/v1/health` exposes only boolean summaries unless the caller presents `HEALTH_ACCESS_TOKEN` via `X-Health-Token` or `Authorization: Bearer`; share the token exclusively with trusted monitors.

## Dependencies
- Pin Actions to commit SHAs in workflows.
- Run `pnpm audit` periodically; keep critical deps patched.

## Branch Protection
- Require PR reviews and green CI for `main`.
- Enforce status checks (lint/typecheck/build) and signed commits if your org mandates it.

## Randomness (CSPRNG)

- We avoid `Math.random()` in server code. Instead we use a cryptographically secure PRNG (CSPRNG):
  - Browser/Workers: `crypto.getRandomValues()` or `crypto.randomUUID()` when a UUID fits the need.
  - Node.js fallback: `require("node:crypto").randomBytes()`.
- Adopted in these places:
  - Backoff jitter for upstream retries: `secureRandomInt()` replaces `Math.random()`
    - `src/app/api/v1/creem/create-checkout/route.ts`
    - `src/app/api/v1/creem/customer-portal/route.ts`
  - Object key/id generation: `createRandomId()` prefers `crypto.randomUUID()`; falls back to `getRandomValues` then `randomBytes`
    - `src/lib/r2.ts`
- One‑time usage policy: generated values are used once and are not reused across requests.
- Exposure policy: values are not logged or returned unless required for functionality (e.g., object keys). When persisted, the storage is the platform’s secured service (R2) and not intended as a secret.
- Rationale: while jitter and non‑secret IDs are not cryptographic secrets, replacing `Math.random()` eliminates weak entropy sources and silences security scanners (e.g., S2245) without downsides.
