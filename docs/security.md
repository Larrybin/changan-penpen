# Security & Permissions

> Secrets, least privilege, dependency security, and branch protection.

## Secrets
- Never commit secrets. Use `wrangler secret` in production.
- Keep `.dev.vars.example` updated; rotate secrets after incidents.

## Permissions
- Cloudflare API Token must include only required scopes (Workers, D1, R2).
- Separate CI tokens from personal tokens. Prefer org‑scoped tokens.

## Dependencies
- Pin Actions to commit SHAs in workflows.
- Run `pnpm audit` periodically; keep critical deps patched.

## Branch Protection
- Require PR reviews and green CI for `main`.
- Enforce status checks (lint/tests/build) and signed commits if your org mandates it.
