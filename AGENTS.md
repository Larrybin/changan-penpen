Use Chinese to talk with me.
Use UTF8.

# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/`. Next.js App Router under `src/app` with `*.page.tsx`, `*.layout.tsx`, and `*.route.ts` files. 
- Domain features in `src/modules/<feature>/{actions,components,hooks,models,schemas,utils}`; reusable UI in `src/components` and `src/components/ui`.
- Data access in `src/db`; migrations in `src/drizzle`; shared helpers in `src/lib`; static assets in `public/`; docs in `docs/`.

## Build, Test, and Development Commands
- `pnpm dev` — Run Next.js dev server (localhost:3000).
- `pnpm dev:cf` — Build via OpenNext Cloudflare and run Workers with Wrangler locally.
- `pnpm build` / `pnpm start` — Production build and serve.
- `pnpm deploy:cf` — Deploy to Cloudflare Workers (configured by `wrangler.toml`).
- `pnpm db:migrate:local` — Apply D1 migrations from `src/drizzle` to local.
- `pnpm lint` — Format and lint with Biome.
- `pnpm cf-typegen` — Regenerate Cloudflare env bindings/types.

## Coding Style & Naming Conventions
- TypeScript-first. Components: PascalCase; variables/functions: camelCase; modules are domain-driven.
- Formatting: Biome with 4-space indent and double quotes. Run `pnpm lint` before committing.
- File patterns: pages `*.page.tsx`, layouts `*.layout.tsx`, routes `*.route.ts`, services `*.service.ts`.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest; colocate as `*.test.ts` next to the unit. Keep tests deterministic; mock D1/R2 and external network calls.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- PRs must: describe the change, link issues, include screenshots/GIFs for UI, note DB/env changes. Ensure `pnpm lint` and `pnpm build` pass and include migrations in `src/drizzle` for schema updates.

## Security & Configuration Tips
- Local env: copy `.dev.vars.example` to `.dev.vars`. Never commit secrets.
- Manage secrets with Wrangler: `pnpm run cf:secret BETTER_AUTH_SECRET`.
- After adding bindings/secrets, run `pnpm cf-typegen` and keep `wrangler.toml` in sync.

