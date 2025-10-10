![Banner](banner.svg)

# Full-Stack Next.js + Cloudflare Template

[![CI](https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/ci.yml/badge.svg)](https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/ci.yml) [![Deploy](https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/deploy.yml) ![Docs](https://img.shields.io/badge/docs-up_to_date-1E90FF)

Production-ready template for building full-stack applications on Next.js 15 + Cloudflare Workers. It includes D1, R2, Workers AI, authentication, CI/CD, automated health checks, and an opinionated architecture so teams can scale from MVP to enterprise with edge-first performance.

---

## TL;DR (5-minute quickstart)
- `pnpm install`
- `cp .dev.vars.example .dev.vars` and fill Cloudflare/Auth secrets
- `pnpm dev`
- Open `http://localhost:3000`

For production: trigger the GitHub Actions "Deploy" workflow or run `pnpm deploy:cf`. Use `gh run watch` to track CI.

---

## Highlights
- Edge-native: OpenNext build, deploy to Cloudflare Workers (100+ PoPs)
- Data & storage: Cloudflare D1 + R2 via Drizzle ORM
- CI/CD suite: Biome, TypeScript checks, Vitest tests
- Auto-fix & auto-merge: workflows for safe rolling PRs
- Health checks: `/api/health` with fast/strict modes
- Observability: Workers Analytics, optional Sentry, structured logs
- i18n & AI translation: built-in locales and scripts (Gemini/OpenAI)

---

## Quick Guide

### Local Development
- `pnpm dev`: Node runtime with fast HMR
- `pnpm dev:cf`: OpenNext + Wrangler (simulated Workers)
- `pnpm lint` / `pnpm test`: quality gates before commit
- Details in `docs/local-dev.md`

### Production Deploy
- Push to `main` triggers Deploy workflow by default
- Steps: build → migrate → health checks (`/api/health?fast=1`) → release
- On failure, the pipeline rolls back and notifies. See `docs/deployment/cloudflare-workers.md`.

---

## Architecture Overview
- App Router: `src/app`, segmented with `(segment)` for auth/admin areas
- Domain modules: `src/modules/<feature>` with actions/components/services/schemas
- Data access: `src/db` + `src/drizzle` for schema and migrations
- Shared platform: `src/lib` for Cloudflare bindings, logging, cache, SEO, etc.
- More in `docs/architecture-overview.md`

---

## Docs Map
| Topic | Doc |
| --- | --- |
| Getting Started | `docs/getting-started.md` |
| Local Dev | `docs/local-dev.md` |
| Env & Secrets | `docs/env-and-secrets.md` |
| Testing | `docs/testing.md` |
| Deployment | `docs/deployment/cloudflare-workers.md` |
| CI/CD | `docs/ci-cd.md` |
| Health & Observability | `docs/health-and-observability.md` |
| Troubleshooting | `docs/troubleshooting.md` |
| Contributing | `docs/contributing.md` |
| Full Index | `docs/00-index.md` |

---

## Testing
- Run: `pnpm test` (one-off) or `pnpm test -- --watch`
- Stack: Vitest 3 + jsdom + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- Config: `vitest.config.ts`, `vitest.setup.ts` (with `globals: true` and `@ -> src` alias)
- Example tests: see `src/modules/**/__tests__/`
- CI: `.github/workflows/ci.yml` includes a "Test (Vitest)" step

---

## Automation & DevOps
- `.github/workflows/ci.yml`: Biome, TypeScript, Vitest
- `.github/workflows/deploy.yml`: production deploy incl. D1 migrations and health checks

- `pnpm push`: auto-fix + typegen + typecheck + docs/link checks + final lint + rebase & push. Generates a fully automated commit message (subject + multi-line bullets) from the staged diff in the style of production commits (e.g., harden webhooks/fetch parsing, add CF env fallbacks, enforce R2 attachment, clean headers()/cookies()).

See `docs/ci-cd.md` and `docs/workflows/*.md` for details. Semgrep runs only in CI; local pushes skip Semgrep by design.

---

## Contributing
- TypeScript-first, PascalCase components, Biome formatting
- Contribution flow, PR template, and test requirements: `docs/contributing.md`
- If you change Cloudflare bindings or workflows, update related docs and note it in the PR description

---

## License

MIT © 2025 Muhammad Arifin
