# Local Development & Debugging

> Daily workflows for development, debugging, database operations, and common pitfalls.

## 1. Common Scripts
| Command | Purpose | Notes |
| --- | --- | --- |
| `pnpm dev` | Next.js dev (Node runtime) | Fast HMR |
| `pnpm dev:cf` | OpenNext build + `wrangler dev` | Simulates Workers; first build is slower |
| `pnpm dev:remote` | Remote region | Requires `wrangler login` |
| `pnpm lint` | Biome format + lint | Run before commit |
| `pnpm test` | Vitest unit tests | Coverage to be expanded |
| `pnpm translate` | Batch translate content | Requires AI keys in `.dev.vars` |

## 2. Debug Tips
- Server Actions: inspect `server-actions` requests in Network tab; run functions directly in IDE
- Edge logs: `wrangler dev --inspect` with Chrome DevTools
- Env vars: `.dev.vars` for local; use `wrangler secret put` for Workers mode if missing
- Request replay: `wrangler dev --persist` to keep D1 state under `.wrangler/state`
- AI/R2: ensure `CLOUDFLARE_R2_URL`, `GEMINI_API_KEY`, etc., are set or features will degrade

## 3. Database (D1)
- Generate migration: `pnpm db:generate:named "add_users_table"`
- Apply:
  ```bash
  pnpm db:migrate:local    # local SQLite
  pnpm db:migrate:prod     # production (wrangler login + token)
  ```
- Inspect: `pnpm db:inspect:local`
- Reset local: `pnpm db:reset:local`
- Studio: `pnpm db:studio:local` (drizzle‑kit)

## 4. Cloudflare Bindings
- After editing `wrangler.jsonc`, run `pnpm cf-typegen` to refresh `cloudflare-env.d.ts`
- If adding KV/Durable Objects, update `docs/opennext.md` and `docs/deployment/cloudflare-workers.md` in the PR

## 5. UI & i18n
- Place components under `src/modules/*/components` or `src/components/ui`; use Tailwind + shadcn
- i18n scripts rely on `TRANSLATION_PROVIDER`, `GEMINI_API_KEY`, `OPENAI_API_KEY`
- Run `pnpm fix:i18n` to fix encodings before `pnpm lint`

## 6. Auth
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` — session signing and callback URL; set correct domain for external OAuth
- Admin access is controlled by `ADMIN_ALLOWED_EMAILS` and `ADMIN_ENTRY_TOKEN`; configure local accounts in `.dev.vars`

## 7. Troubleshooting (Quick)
- `local socket address…` → restart `wrangler dev` or clear `.wrangler/state`
- `fetch failed: 403` → ensure CF API token covers D1/R2/Workers
- `EAI_AGAIN` → DNS issue; fall back to `pnpm dev` (Node runtime) temporarily
- More in `docs/troubleshooting.md`

## 8. Daily Quality Gate
1. `pnpm lint`
2. `pnpm test` (if tests exist)
3. Update docs when changing DB/config/process and link them in PR
4. Track CI & Deploy with `gh run watch`

---

Keep docs living: add recurring issues or new workflows to `docs/local-dev.md` and `docs/troubleshooting.md`.

