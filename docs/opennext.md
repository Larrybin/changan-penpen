# OpenNext on Cloudflare

> Notes, limitations, and best practices when running Next.js on Cloudflare Workers with OpenNext.

## Overview
- Use `@opennextjs/cloudflare` to build App Router projects.
- Artifacts under `.open-next/` (assets, server functions).
- Deploy with `wrangler`; enable `nodejs_compat` only if required.

## Limitations
- No write access to Node `fs` at runtime on Workers.
- Long CPU tasks and very large responses are discouraged; design for streaming or background jobs.
- Some Node APIs require `nodejs_compat` and may still be restricted.

## Best Practices
- Edge‑first: keep handlers fast; offload heavy work.
- Static assets served via `ASSETS` binding; version and cache responsibly.
- Centralize platform helpers in `src/lib` (auth, cache, logging).

## Debugging
- `wrangler dev --inspect` for edge debugging.
- Tail logs with `wrangler tail`.
- Add `/api/v1/health` fast/strict checks during rollout.

