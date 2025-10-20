# Local Development & Debugging

> Daily workflows for development, debugging, database operations, and common pitfalls.

Note
- Automated tests have been removed from this repository. Ignore any stale references to `pnpm test`/`test:ci`; rely on `pnpm check:all`, `pnpm typecheck`, `pnpm lint`, and optional `pnpm build`.

## 2. Debug Tips

- Server Actions: inspect `server-actions` requests in Network tab; run functions directly in IDE
- Edge logs: `wrangler dev --inspect` with Chrome DevTools
- Env vars: `.dev.vars` for local; use `wrangler secret put` in Workers mode if missing
- Request replay: `wrangler dev --persist` to keep D1 state under `.wrangler/state`
- AI/R2: ensure `CLOUDFLARE_R2_URL`, `GEMINI_API_KEY`, etc., are set or features will degrade

## 4. Cloudflare Bindings

- After editing `wrangler.toml`, run `pnpm cf-typegen` to refresh `cloudflare-env.d.ts`
- If adding KV/Durable Objects, update `docs/opennext.md` and `docs/deployment/cloudflare-workers.md` in the PR

## 5. UI & i18n

- Place components under `src/modules/*/components` or `src/components/ui`; use Tailwind + shadcn
- i18n scripts rely on `TRANSLATION_PROVIDER`, `GEMINI_API_KEY`, `OPENAI_API_KEY`
- Run `pnpm fix:i18n` to fix encodings before `pnpm lint`

## 6. Auth

- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` for session signing and callback URL; set correct domain for external OAuth
- Admin access is controlled by `ADMIN_ALLOWED_EMAILS` and `ADMIN_ENTRY_TOKEN`; configure local accounts in `.dev.vars`

## 7. Troubleshooting (Quick)

- “local socket address …”: restart `wrangler dev` or clear `.wrangler/state`
- “fetch failed: 403”: ensure CF API token covers D1/R2/Workers
- “EAI_AGAIN”: DNS issue; fall back to `pnpm dev` (Node runtime) temporarily
- More in `docs/troubleshooting.md`

## 8. Daily Quality Gate
1. `pnpm check:all`
2. Update docs, DB, or config changes and link them in the PR. Windows: run `node scripts/lib/doc-consistency-checker.mjs`; POSIX shells: `pnpm check:docs` and `pnpm check:links`.
3. 使用 `gh run watch` 关注 CI & 部署状态

---

Keep docs living: add recurring issues or new workflows to `docs/local-dev.md` and `docs/troubleshooting.md`.

## 9. 提交前本地校验
- 确保 `pnpm check:all`、`pnpm typecheck`、`pnpm lint` 通过；必要时运行 `pnpm build` 验证构建。
- 文档一致性：Windows 直接运行 `node scripts/lib/doc-consistency-checker.mjs`；POSIX 使用 `pnpm check:docs` 与 `pnpm check:links`。
- 推送前可用 `gh run watch` 关注 CI 状态。

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
| `check:all` | `node scripts/check-all.mjs` |
| `check:docs` | `node scripts/lib/doc-consistency-checker.mjs` |
| `check:links` | `node scripts/check-links.mjs` |
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
| `openapi:check` | `pnpm exec tsx scripts/generate-openapi.ts --check` |
| `openapi:lint` | `pnpm exec spectral lint --fail-severity=warn --ruleset=spectral.yaml public/openapi.json` |
| `lint` | `pnpm exec biome check . --write --unsafe` |
| `prebuild` | `pnpm run fix:i18n && pnpm run config:headers` |
| `prebuild:cf` | `node scripts/prebuild-cf.mjs && pnpm run config:headers` |
| `start` | `next start` |
| `translate` | `pnpm exec tsc --project tsconfig.translate.json && node dist/scripts/scripts/translate-locales.js` |
| `translate:de` | `pnpm run translate -- --target=de` |
| `translate:fr` | `pnpm run translate -- --target=fr` |
| `translate:pt` | `pnpm run translate -- --target=pt` |
| `typecheck` | `pnpm run cf-typegen && pnpm exec tsc --noEmit` |
| `wrangler:dev` | `npx wrangler dev` |

<!-- DOCSYNC:SCRIPTS_TABLE_AUTO END -->
