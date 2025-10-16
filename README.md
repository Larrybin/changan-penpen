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
- Auto-merge guardrails: Dependabot auto-merge with local `pnpm check:all` gate
- Health checks: `/api/health` with fast/strict modes
- Observability: Workers Analytics 与结构化日志
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

### API Architecture
The application includes 31+ API endpoints organized into 4 main categories:

#### Authentication APIs
- `/api/auth/[...all]` - Better Auth integration (GET, POST)

#### Core APIs
- `/api/health` - Health monitoring with fast/strict modes
- `/api/summarize` - Content summarization service

#### Admin APIs (22 endpoints)
- `/api/admin/dashboard` - Dashboard analytics
- `/api/admin/users` & `/api/admin/users/[id]` - User management
- `/api/admin/todos` & `/api/admin/todos/[id]` - Todo administration
- `/api/admin/products` & `/api/admin/products/[id]` - Product catalog
- `/api/admin/orders` & `/api/admin/orders/[id]` - Order management
- `/api/admin/tenants` & `/api/admin/tenants/[id]` - Tenant management
- `/api/admin/credits-history` - Credits history
- `/api/admin/reports` - System reports
- `/api/admin/audit-logs` - Audit logs
- `/api/admin/site-settings` - Site configuration
- `/api/admin/categories` - Category management
- `/api/admin/content-pages` & `/api/admin/content-pages/[id]` - Content pages
- `/api/admin/coupons` & `/api/admin/coupons/[id]` - Coupon management
- `/api/admin/session` - Admin session management
- `/api/admin/usage` - Usage analytics

#### Billing & Payment APIs
- `/api/creem/create-checkout` - Payment checkout creation
- `/api/creem/customer-portal` - Customer billing portal
- `/api/webhooks/creem` - Payment webhooks (POST)

#### Credits APIs
- `/api/credits/balance` - User credit balance
- `/api/credits/history` - Credit transaction history

All APIs follow RESTful conventions and include proper authentication, error handling, and TypeScript safety.

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

See `docs/ci-cd.md` and `docs/workflows/*.md` for details.

### Supply Chain Notes
- Dependencies bumped to address supply‑chain advisories:
  - `next` → 15.5.4 (fixes reported SSRF issue in older 15.4.x)
  - `better-auth` → ^1.3.27 (addresses authorization advisory)
  - `pnpm.overrides.esbuild` → ^0.25.10 (patches origin validation advisory in older 0.18.x transitives)
  - Re-run `pnpm install` locally if needed; CI will pick up changes automatically.

---

## Contributing
- TypeScript-first, PascalCase components, Biome formatting
- Contribution flow, PR template, and test requirements: `docs/contributing.md`
- If you change Cloudflare bindings or workflows, update related docs and note it in the PR description

---

## License

MIT © 2025 Muhammad Arifin

<!-- DOCSYNC:README_AUTOMATION START -->
### Automation & DevOps (auto)
- Local workflow: run `pnpm check:all`, `pnpm typecheck`, `pnpm lint`, `pnpm test` before推送，确保质量门槛达标。
- 详情参见 docs/local-dev.md、docs/ci-cd.md、docs/docs-maintenance.md。

#### Common Scripts Snapshot
| Script | Command |
| --- | --- |
| `dev` | `next dev` |
| `dev:cf` | `npx @opennextjs/cloudflare build && wrangler dev` |
| `build` | `next build` |
| `start` | `next start` |
| `check:all` | `node scripts/check-all.mjs` |
| `typecheck` | `pnpm run cf-typegen && pnpm exec tsc --noEmit` |
| `lint` | `npx biome format --write` |
| `test` | `vitest run` |
| `deploy:cf` | `npx @opennextjs/cloudflare deploy` |

#### Workflows (top)
| Workflow | Triggers | File |
| --- | --- | --- |
| Build |  | .github/workflows/build.yml |
| CI |  | .github/workflows/ci.yml |
| Dependabot Auto‑Merge |  | .github/workflows/dependabot-automerge.yml |
| Deploy Next.js App to Cloudflare |  | .github/workflows/deploy.yml |
| Build (SonarCloud + coverage) |  | .github/workflows/build.yml |

<!-- DOCSYNC:README_AUTOMATION END -->

<!-- DOCSYNC:README_STRUCTURE START -->
### Project Structure (auto)
- `src/app`: Next.js App Router (pages/api routes, layouts)
- `src/modules`: Domain modules (actions/components/hooks/models/schemas/utils)
- `src/components`: Reusable UI components
- `src/components/ui`: Design system primitives
- `src/db`: Data access
- `src/drizzle`: D1 migrations
- `src/lib`: Shared helpers
- `public`: Static assets
- `docs`: Project documentation
- Modules: admin, auth, creem, dashboard, marketing, todos
<!-- DOCSYNC:README_STRUCTURE END -->

<!-- DOCSYNC:README_QUALITY_GATES START -->
### Quality Gates (auto)
- 建议本地先执行 `pnpm check:all`、`pnpm lint`、`pnpm typecheck`、`pnpm test`，再进行提交或推送。
- 门槛与策略详见 docs/quality-gates.md（覆盖率、fail-fast、跳过开关等）。
<!-- DOCSYNC:README_QUALITY_GATES END -->
