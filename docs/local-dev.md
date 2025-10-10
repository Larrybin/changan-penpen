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
| `pnpm build` | Next.js production build | Uses Node runtime |
| `pnpm deploy:cf` | OpenNext build + `wrangler deploy` | Cloudflare Workers deploy |
| `pnpm cf-typegen` | Regenerate CF bindings/types | Run after editing `wrangler.jsonc` |
| `pnpm typecheck` | CF typegen + `tsc --noEmit` | Ensures types are in sync |
| `pnpm check:all` | Biome check + typecheck (+ docs checks) | Add docs checks below |
| `pnpm translate` | Batch translate content | Requires AI keys in `.dev.vars` |
| `pnpm db:generate` | Generate migration | Uses drizzle-kit |
| `pnpm db:generate:named` | Generate named migration | e.g. `add_users_table` |
| `pnpm db:migrate:local` | Apply migrations (local) | D1 (SQLite) via Wrangler |
| `pnpm db:migrate:prod` | Apply migrations (remote) | Requires Wrangler auth |
| `pnpm db:inspect:local` | Inspect local DB tables | SQL `SELECT name FROM sqlite_master...` |
| `pnpm db:inspect:prod` | Inspect remote DB tables | Requires Wrangler auth |
| `pnpm db:studio` | Drizzle Studio (default) | UI explorer |
| `pnpm db:studio:local` | Drizzle Studio (local config) | `drizzle.local.config.ts` |
| `pnpm db:reset:local` | Reset local DB | Drops tables then migrates |

## 2. Debug Tips
- Server Actions: inspect `server-actions` requests in Network tab; run functions directly in IDE
- Edge logs: `wrangler dev --inspect` with Chrome DevTools
- Env vars: `.dev.vars` for local; use `wrangler secret put` in Workers mode if missing
- Request replay: `wrangler dev --persist` to keep D1 state under `.wrangler/state`
- AI/R2: ensure `CLOUDFLARE_R2_URL`, `GEMINI_API_KEY`, etc., are set or features will degrade
- Shell encoding: prefer PowerShell 7 and set UTF-8 in profile to avoid garbled output:
  - `[Console]::InputEncoding  = [System.Text.Encoding]::UTF8`
  - `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`
  - `$OutputEncoding = [System.Text.UTF8Encoding]::new($false)`

## 3. Database (D1)
- Generate migration: `pnpm db:generate:named "add_users_table"`
- Apply:
  ```bash
  pnpm db:migrate:local    # local SQLite
  pnpm db:migrate:prod     # production (wrangler login + token)
  ```
- Inspect: `pnpm db:inspect:local`
- Reset local: `pnpm db:reset:local`
- Studio: `pnpm db:studio:local` (drizzle-kit)

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
- `local socket address…` — restart `wrangler dev` or clear `.wrangler/state`
- `fetch failed: 403` — ensure CF API token covers D1/R2/Workers
- `EAI_AGAIN` — DNS issue; fall back to `pnpm dev` (Node runtime) temporarily
- More in `docs/troubleshooting.md`

## 8. Daily Quality Gate
1. `pnpm lint`
2. `pnpm test` (if tests exist)
3. Update docs when changing DB/config/process and link them in PR
4. Track CI & Deploy with `gh run watch`

---

Keep docs living: add recurring issues or new workflows to `docs/local-dev.md` and `docs/troubleshooting.md`.

## 9. Push Helper
- Command: `pnpm push` — runs auto-fix, typegen, typecheck, docs checks (`check:docs`, `check:links`), final lint, then rebase & push.
- Commit message: fully automated (subject + multi-line bullets) generated from the staged diff, in the style of: `fix: …, add CF env fallbacks, …, and clean headers()/cookies() usage` with per-area bullets (checkout/webhooks/sitemap/R2/headers-cookies/tests/types).
- Optional dependency for AST-enhanced messages: `@babel/parser` (dev). If not installed, the script falls back to path/regex rules automatically.
- Install (optional): `pnpm add -D @babel/parser`
- Note: `scripts/push-fix2.mjs` is a local helper and is ignored by Git. It is not shipped with the repository, and CI/CD does not depend on it.
- Env toggles:
  - `SKIP_DOCS_CHECK=1 pnpm push` — skip docs checks in emergencies (re-run without skip before merging).
  - `SHOW_API_SUGGEST=1 pnpm push` — print current page/API suggestions to help update `docs/api-index.md`.
  - `FORCE_NEXT_BUILD=1 pnpm push` — force Next.js build on Windows.
  - `PUSH_LOG_DIR=/path` `PUSH_LOG_FILE=/path/file.log` — save a full push log to a custom location.
  - `PUSH_COMMIT_MSG="feat: ..." pnpm push` — override the auto-commit message when the script commits auto-fixes.
  - `PUSH_COMMIT_MSG_FILE=commit.txt pnpm push` — provide a file as the commit message (optional; normally not needed).
  - `PUSH_COMMIT_EDITOR=1 pnpm push` — open editor with optional template `.github/COMMIT_TEMPLATE.txt` (optional; normally not needed).
- Security scan (Semgrep): local push no longer runs Semgrep; it runs only in GitHub Actions. For an on-demand local scan, run `pnpm dlx semgrep --config p/ci`.

<!-- DOCSYNC:SCRIPTS_TABLE_AUTO START -->
### Common Scripts (auto)
| Script | Command |
| --- | --- |
| `biome:apply` | `pnpm exec biome check . --write --unsafe` |
| `biome:check` | `pnpm exec biome check .` |
| `build` | `next build` |
| `build:cf` | `npx @opennextjs/cloudflare build` |
| `cf-typegen` | `pnpm exec wrangler types && pnpm exec wrangler types --env-interface CloudflareEnv ./cloudflare-env.d.ts` |
| `cf:secret` | `npx wrangler secret put` |
| `check:all` | `pnpm run biome:check && pnpm run typecheck && pnpm run check:docs && pnpm run check:links` |
| `check:docs` | `node scripts/check-docs.mjs` |
| `check:links` | `node scripts/check-links.mjs` |
| `check:security` | `pnpm run scan:semgrep` |
| `db:generate` | `drizzle-kit generate` |
| `db:generate:named` | `drizzle-kit generate --name` |
| `db:inspect:local` | `wrangler d1 execute next-cf-app --local --command="SELECT name FROM sqlite_master WHERE type='table';"` |
| `db:inspect:prod` | `wrangler d1 execute next-cf-app --remote --command="SELECT name FROM sqlite_master WHERE type='table';"` |
| `db:migrate:local` | `wrangler d1 migrations apply next-cf-app --local` |
| `db:migrate:prod` | `wrangler d1 migrations apply next-cf-app --remote` |
| `db:reset:local` | `wrangler d1 execute next-cf-app --local --command="DROP TABLE IF EXISTS todos;" && pnpm run db:migrate:local` |
| `db:studio` | `drizzle-kit studio` |
| `db:studio:local` | `drizzle-kit studio --config=drizzle.local.config.ts` |
| `deploy` | `npx @opennextjs/cloudflare deploy` |
| `deploy:cf` | `npx @opennextjs/cloudflare deploy` |
| `dev` | `next dev` |
| `dev:cf` | `npx @opennextjs/cloudflare build && wrangler dev` |
| `dev:remote` | `npx @opennextjs/cloudflare build && wrangler dev --remote` |
| `fix:i18n` | `node scripts/fix-i18n-encoding.mjs` |
| `lint` | `npx biome format --write` |
| `prebuild` | `pnpm run fix:i18n` |
| `prebuild:cf` | `node scripts/prebuild-cf.mjs` |
| `push` | `node -e "const fs=require('fs');const p='scripts/push-fix2.mjs';if(!fs.existsSync(p)){const t='scripts/push-fix2.template.mjs';if(fs.existsSync(t)){fs.cpSync(t,p);console.log('[push] restored local helper from template');}else{console.error('[push] missing local helper and template');process.exit(1);}}" && node scripts/push-fix2.mjs` |
| `push:rollback` | `node scripts/push-rollback.mjs` |
| `scan:semgrep` | `@semgrep/semgrep --config auto --error --timeout 300 --exclude .next --exclude coverage --exclude node_modules --exclude stubs` |
| `start` | `next start` |
| `suggest:api-index` | `node scripts/suggest-api-index.mjs` |
| `test` | `vitest run` |
| `test:ci` | `vitest run --reporter=dot` |
| `translate` | `pnpm exec tsc --project tsconfig.translate.json && node dist/scripts/scripts/translate-locales.js` |
| `translate:de` | `pnpm run translate -- --target=de` |
| `translate:fr` | `pnpm run translate -- --target=fr` |
| `translate:pt` | `pnpm run translate -- --target=pt` |
| `typecheck` | `pnpm run cf-typegen && pnpm exec tsc --noEmit` |
| `wrangler:dev` | `npx wrangler dev` |
<!-- DOCSYNC:SCRIPTS_TABLE_AUTO END -->
