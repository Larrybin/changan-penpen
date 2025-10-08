# Troubleshooting

## Common Issues

### Build fails on Workers target
- Ensure `wrangler.jsonc` has required bindings and `nodejs_compat` only if needed
- Clear `.open-next` and rebuild: `rm -rf .open-next && pnpm deploy:cf`

### Health check returns 503
- Run `/api/health?fast=1` to isolate external dependencies
- Check D1 connectivity (see `docs/db-d1.md`) and R2 permissions
- Verify external endpoint (`CREEM_API_URL`) and API key

### OAuth/sign‑in issues
- Confirm `NEXT_PUBLIC_APP_URL` matches deployment URL
- Rotate `BETTER_AUTH_SECRET` if sessions are invalid

### Large responses or timeouts
- Offload heavy work; paginate large lists
- Add timeouts and retries to outbound requests

### Encoding/locale glitches
- Ensure docs are UTF‑8 and run `pnpm lint` to normalize line endings

## Diagnostics
- `pnpm dev:cf` — local Workers environment
- `wrangler tail` — live logs
- `/api/health` — fast vs strict
- `drizzle-kit status` — migration status

## Escalation
- Roll back: `wrangler deploy --rollback`
- Restore D1 from backup artifact if schema changed
- Post‑incident: rotate secrets and update runbooks

