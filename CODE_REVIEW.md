# Code Standards & Review Guidelines (Next.js + Cloudflare + TypeScript)

Unified standards and a structured checklist for this repository. Goals: correctness, type safety, security, performance, and maintainability — with early, automated failures in local push and CI.

## Scope & Objectives
- Stack: Next.js App Router, Cloudflare Workers (OpenNext), TypeScript + Biome, Drizzle ORM (D1), R2, next-intl, Vitest + React Testing Library
- Quality objectives:
  - Requirements met, clear boundaries, measurable failure paths
  - Precise typing and explicit error handling (no swallowed errors)
  - Security (input validation, XSS/SQL injection prevention, secrets handling, compliant logging)
  - Performance and resource control (edge-friendly, timeouts, streaming/caching)
  - Docs/migrations/config stay in sync with code changes

## Review Workflow (practical tips)
- Small scoped commits: group by feature/fix; keep diffs focused
- Patch staging: use `git add --patch` and review with `git diff --staged`
 - Pre-push self-check: prefer `pnpm push` (typecheck, tests + coverage, docs & links, final Biome, optional Next build, auto commit message, rebase then push).
 - CI quality gate: PRs run SonarCloud to surface vulnerabilities, smells, and technical debt; PRs must include screenshots/notes and any migration changes

## Code Style & Naming
- TypeScript-first; components: PascalCase; variables/functions: camelCase; domain-driven modules under `src/modules/<feature>`
- Biome formatting (4 spaces, double quotes); run `pnpm lint` or `pnpm exec biome check .` before committing
- File naming: pages `*.page.tsx`, layouts `*.layout.tsx`, routes `*.route.ts`, services `*.service.ts`

## Architecture & Boundaries
- App Router: split SSR/CSR appropriately; avoid Node-only deps on the Edge; Server Actions do minimal I/O and orchestration
- Data flow: schema (zod) → actions/services → components; avoid heavy I/O in components
- Observability: Sentry captures errors (user vs system); avoid sensitive logs (mask/hash)

## Types & Errors
- Strict TS; no `any` escaping public boundaries; precise types for public APIs
- Input validation: all external inputs (API, forms, URLSearchParams, headers) validated with zod
- Error style:
  - Do not leak raw library errors; convert to controlled errors (with codes and user-facing messages)
  - API/routes return consistent error shapes and proper HTTP statuses
  - Timeouts and retries are explicit (fetch + AbortController)

## Security Baseline
- XSS: escape outputs; for document/text uploads, force `Content-Disposition: attachment`; never inject untrusted HTML
- SQL injection: use ORM (Drizzle) parameter binding; avoid string concatenation
- CSRF/CORS: minimal allowlists; mutating requests require CSRF or auth
- Secrets: local `.dev.vars`; production via Wrangler `secret`; never hardcode secrets
 - Dependency hygiene: regular audits and updates (`pnpm outdated`, Renovate/Dependabot); CI quality scanning via SonarCloud

## API / Database / Transactions
- API calls: test failure/exception paths; define timeouts, retries, idempotency (e.g., idempotency keys for payments/webhooks)
- D1 transactions: group writes into transactions; roll back on failure; retry/compensate as needed
- Compatibility: migrations and app code stay compatible during rollout; plan forward/backward strategies

## Performance & Resources
- Edge constraints: avoid Node built-ins; use Web Platform APIs; no blocking I/O
- Caching: proper `Cache-Control`, ETag; SWR/React Query configs; avoid repeated full refreshes
- Build: tree-shaking, code splitting; Next/Image with correct sizes

## i18n (next-intl)
- Semantic, stable keys; cover default/missing strings; consistent server/client loading; correct RTL/LTR, plurals, dates

## Testing (Vitest + RTL)
- Cover success/failure/boundary paths; mock external I/O (D1/R2/fetch)
- Coverage: start modest and raise gradually; ensure core modules (lib, services, route handlers) have tests

## Documentation & Traceability
- Update `docs/` and migrations for any DB/config/deploy change and link them in PRs; `pnpm check:docs` and `pnpm check:links` must pass
- Docs language: English only. Changed docs containing non‑English (CJK) characters will fail the push helper

---

## Structured Review Checklist
- Requirements
  - [ ] Requirements and acceptance criteria are clear; boundaries covered
  - [ ] UI/UX aligns with product; fallbacks/alerts on key paths
- Code style
  - [ ] Biome formatting/naming conventions met
  - [ ] Folder structure aligns with domain; file granularity reasonable
- Types & errors
  - [ ] TS types precise; no `any` leaks
  - [ ] zod input validation complete; error semantics and statuses consistent
  - [ ] Timeouts/retries/cancellation ready (fetch + Abort)
- API/DB
  - [ ] ORM bindings prevent injection; transactions/rollback defined
  - [ ] API failure paths, retries, and idempotency are testable
- SSR/CSR boundaries
  - [ ] Server Actions/I/O are non‑blocking; Node‑only deps not on Edge
  - [ ] Caching/streaming/data concurrency is reasonable
- i18n
  - [ ] Critical copy localized; dates/numbers/plurals correct
- Security
  - [ ] XSS/SQL injection/CSRF/CORS checks pass
  - [ ] Sentry/logging avoid sensitive data
  - [ ] Secrets via Wrangler/env bindings; no hardcoding
- Tests
  - [ ] Critical paths and failure cases covered; Vitest passes
  - [ ] Coverage artifact available (lcov consumed by Sonar)
- Cloudflare
  - [ ] Wrangler bindings/types correct (`pnpm cf-typegen`)
  - [ ] D1/R2 bindings consistent locally/remotely
- Docs
  - [ ] `docs/`, migrations, and `.jsonc`/env changes are updated

---

## Push & CI Quality Gates
- Local: `pnpm push` blocks on TypeScript, Vitest, Docs/Links, final Biome, and optional Next build
- CI:
 - SonarCloud: aggregates coverage/quality (consumes vitest `lcov`)

## Dependencies & Vulnerability Management
- Review `pnpm outdated` regularly; update by impact; canary/gradual rollout when needed
- Enable Renovate/Dependabot; run full CI before merging

## Commit Messages
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:` …)
- Short subject; body lists scope, behavior changes, risks and rollback

### Actions Version Pinning Policy (GitHub Actions)
- Pin third‑party Actions to specific commit SHAs (not `vX` tags) to reduce supply‑chain risk
 - Scope: checkout, setup-node, pnpm/action-setup, cache, upload-artifact, SonarCloud, Cloudflare Wrangler, Dependabot helpers, etc.
- Upgrade process:
  - Periodically (monthly/after incidents) resolve the latest commit for upstream tags and update pins in a branch
  - Open PR, run full CI (SonarCloud), merge once green
  - Keep `docs/ci-cd.md` and `docs/workflows/*` in sync
- Example: `uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955`
