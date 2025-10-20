![Banner](banner.svg)

# Full-Stack Next.js + Cloudflare Template

[![CI](https://github.com/Larrybin/changan-penpen/actions/workflows/ci.yml/badge.svg)](https://github.com/Larrybin/changan-penpen/actions/workflows/ci.yml) [![Deploy](https://github.com/Larrybin/changan-penpen/actions/workflows/deploy.yml/badge.svg)](https://github.com/Larrybin/changan-penpen/actions/workflows/deploy.yml) ![Docs](https://img.shields.io/badge/docs-up_to_date-1E90FF)

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
- CI/CD suite: Biome, TypeScript checks, manual QA checklist
- Auto-merge guardrails: Dependabot auto-merge with local `pnpm check:all` gate
- Health checks: `/api/v1/health` with fast/strict modes
- Observability: Workers Analytics 与结构化日志
- i18n & AI translation: built-in locales and scripts (Gemini/OpenAI)

---

## Quick Guide

### Local Development
- `pnpm dev`: Node runtime with fast HMR
- `pnpm dev:cf`: OpenNext + Wrangler (simulated Workers)
- `pnpm lint` / `pnpm typecheck`: quality gates before commit
- Details in `docs/local-dev.md`

### Production Deploy
- Push to `main` triggers Deploy workflow by default
- Steps: build → migrate → health checks (`/api/v1/health`, 自动重试) → release
- On failure, the pipeline rolls back and notifies. See `docs/deployment/cloudflare-workers.md`.

## Configuration Management
- **Central config module**: Runtime settings are defined in `config/environments/*.json` and loaded through `src/config`. `resolveConfigSync()` selects the correct environment using `NEXTJS_ENV`/`NODE_ENV`, merges overrides, and applies numeric environment variables such as `PAGINATION_DEFAULT_PAGE_SIZE` or `CACHE_DEFAULT_TTL_SECONDS`.
- **Typed access**: `config.pagination` and `config.cache` expose pagination limits and cache TTLs to both API handlers and services (e.g., admin user listings now clamp `perPage` and share a Redis-backed cache window).
- **Static asset headers**: `pnpm run config:headers` regenerates `public/_headers` from `config.performance.static_assets.cache_headers`. This script runs automatically in `prebuild`/`prebuild:cf` so Cloudflare caching stays in sync with configuration.
- **Secrets stay external**: Sensitive bindings (Upstash tokens, etc.) continue to come from Cloudflare environment variables; only non-secret defaults live in JSON.

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
- `/api/v1/auth/[...all]` - Better Auth integration (GET, POST)

#### Core APIs
- `/api/v1/health` - Health monitoring with fast/strict modes
- `/api/v1/summarize` - Content summarization service

#### Admin APIs (22 endpoints)
- `/api/v1/admin/dashboard` - Dashboard analytics
- `/api/v1/admin/users` & `/api/v1/admin/users/[id]` - User management
- `/api/v1/admin/todos` & `/api/v1/admin/todos/[id]` - Todo administration
- `/api/v1/admin/products` & `/api/v1/admin/products/[id]` - Product catalog
- `/api/v1/admin/orders` & `/api/v1/admin/orders/[id]` - Order management
- `/api/v1/admin/tenants` & `/api/v1/admin/tenants/[id]` - Tenant management
- `/api/v1/admin/credits-history` - Credits history
- `/api/v1/admin/reports` - System reports
- `/api/v1/admin/audit-logs` - Audit logs
- `/api/v1/admin/site-settings` - Site configuration
- `/api/v1/admin/categories` - Category management
- `/api/v1/admin/content-pages` & `/api/v1/admin/content-pages/[id]` - Content pages
- `/api/v1/admin/coupons` & `/api/v1/admin/coupons/[id]` - Coupon management
- `/api/v1/admin/session` - Admin session management
- `/api/v1/admin/usage` - Usage analytics

#### Billing & Payment APIs
- `/api/v1/creem/create-checkout` - Payment checkout creation
- `/api/v1/creem/customer-portal` - Customer billing portal
- `/api/v1/webhooks/creem` - Payment webhooks (POST)

#### Credits APIs
- `/api/v1/credits/balance` - User credit balance
- `/api/v1/credits/history` - Credit transaction history

All APIs follow RESTful conventions and include proper authentication, error handling, and TypeScript safety.

---

## Docs Map
| Topic | Doc |
| --- | --- |
| Getting Started | `docs/getting-started.md` |
| Local Dev | `docs/local-dev.md` |
| Env & Secrets | `docs/env-and-secrets.md` |
| Deployment | `docs/deployment/cloudflare-workers.md` |
| CI/CD | `docs/ci-cd.md` |
| Health & Observability | `docs/health-and-observability.md` |
| Troubleshooting | `docs/troubleshooting.md` |
| Contributing | `docs/contributing.md` |
| Full Index | `docs/00-index.md` |

---

## Automation & DevOps
- `.github/workflows/ci.yml`: Biome, TypeScript
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
- Local workflow: run `pnpm check:all`, `pnpm typecheck`, `pnpm lint` before推送,确保质量门槛达标.
- 详情参见 docs/local-dev.md,docs/ci-cd.md,docs/docs-maintenance.md.

#### Common Scripts Snapshot
| Script | Command |
| --- | --- |
| `dev` | `pnpm exec next dev` |
| `dev:cf` | `cross-env-shell "npx @opennextjs/cloudflare build && wrangler dev"` |
| `build` | `pnpm exec next build` |
| `start` | `pnpm exec next start` |
| `check:all` | `node scripts/check-all.mjs` |
| `typecheck` | `pnpm run cf-typegen && pnpm exec tsc --noEmit` |
| `lint` | `pnpm exec biome check . --write --unsafe` |
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
- 建议本地先执行 `pnpm check:all`,`pnpm lint`,`pnpm typecheck`,再进行提交或推送.
- 门槛与策略详见 docs/quality-gates.md(覆盖率,fail-fast,跳过开关等).
<!-- DOCSYNC:README_QUALITY_GATES END -->
