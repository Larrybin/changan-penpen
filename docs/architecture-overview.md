# Architecture Overview
> A 15‑minute tour of technical decisions, layers, and runtime flow. When you add modules or change structure, update this doc and `docs/00-index.md`.

## Stack & Runtime
- Next.js 15 App Router — heavy use of Server Components and Server Actions. Entry at `src/app`.
- Cloudflare Workers via OpenNext — built with `@opennextjs/cloudflare`, deployed by `wrangler`. Artifacts under `.open-next/`.
- Data — Cloudflare D1 (SQLite) with Drizzle ORM (`src/db`, `src/drizzle`).
- Object Storage — Cloudflare R2, helpers in `src/lib/r2.ts`.
- Auth — Better Auth (+ Google OAuth). Server‑side code in `src/modules/auth`.
- UI & State — Tailwind, shadcn/ui, React Hook Form, TanStack Query.
- AI — Workers AI / Gemini / OpenAI via `src/services` and scripts.

## Runtime Topology
```
Browser → Next.js App Router (Edge/SSR) → Server Actions / Route Handlers
          └─ Drizzle ORM → Cloudflare D1
          └─ R2 / Workers AI / external services (Creem)
          └─ shared platform libs (auth, cache, logging)
```
- Edge‑first: pages, Server Actions, and APIs run on Workers by default; switch to `runtime = "nodejs"` only when needed.
- Static assets: OpenNext emits `.open-next/assets` and serves via Worker `ASSETS` binding.
- API routes: under `src/app/**/route.ts` and module‑owned `*.route.ts`.
- Health: `/api/v1/health` supports fast/strict modes for deploy checks and alerting.

## Directory Layout (Quick Reference)
| Path | Description |
| --- | --- |
| `src/app` | App Router entry: pages, layouts, API routes. Segmented with `(segment)` e.g. `(auth)`, `(admin)` |
| `src/modules/<feature>` | Domain modules (actions/components/hooks/models/schemas/utils) consumed by pages |
| `src/components` | Shared UI (including `ui/` shadcn wrappers), SEO, navigation |
| `src/lib` | Platform helpers: CF bindings, logging, cache, HTTP, SEO, i18n |
| `src/db` | Drizzle schema and query helpers, used by services |
| `src/drizzle` | DB migrations, configured by `drizzle.config.ts` |
| `src/services` | Cross‑cutting services (`auth.service.ts`, `billing.service.ts`, etc.) |
| `scripts/` | Build/i18n/util scripts (e.g., `prebuild-cf.mjs`) |

### App Router Layers
- `layout.tsx` — global providers (i18n/theme/QueryClient) and layout chrome.
- `(segment)/layout.tsx` — area layouts (e.g., admin layout in `src/modules/admin/admin.layout.tsx`).
- `page.tsx` — page entry that composes module components.
- `api/**/route.ts` — REST‑like or action endpoints.

### Module Layers (example: `src/modules/todos`)
- `actions/` — Server Actions: validate input (Zod) and call services.
- `components/` — UI components; page‑ or module‑level reuse.
- `schemas/` — Zod schemas shared by server/client.
- `services/` — orchestrate business logic and talk to `src/db` / external APIs.
- `utils/` — module helpers.

> Convention: Pages → module components → actions/services → db/lib. Avoid hitting the DB from UI directly.

## Data Flow & Dependencies
1. Request enters — Edge runtime matches page/API route.
2. Auth & middleware — `middleware.ts` and Better Auth guard `/dashboard`, `/admin`.
3. Server Action / Route Handler — call `modules/*/services` or `src/services`.
4. DB access — `getDb()` resolves a D1 connection for the environment; migrations live in `src/drizzle`.
5. Caching & revalidation — TanStack Query + Next.js revalidate; optionally layer CF Cache.
6. External deps — R2, Creem, Workers AI through typed `CloudflareEnv` bindings and env vars.

## Cloudflare Bindings & Env
- Wrangler config — enable `nodejs_compat`, `nodejs_als`, `global_fetch_strictly_public` in `wrangler.toml` when needed.
- Bindings — `next_cf_app` (D1), `next_cf_app_bucket` (R2), `AI`, `ASSETS`.
- Types — run `pnpm cf-typegen` after adding/updating bindings to refresh `cloudflare-env.d.ts`.
- Secrets — manage with `wrangler secret`; keep `.dev.vars.example` up‑to‑date.

## Dev → Deploy
1. Local — `pnpm dev` (Node) or `pnpm dev:cf` (OpenNext + Wrangler).
2. Quality gates — `pnpm lint`, `pnpm test`, `pnpm build`; CI runs them on PRs.
3. Deploy — push to `main` or run `pnpm deploy:cf` → OpenNext build → `wrangler deploy` → `/api/v1/health` check.
4. Rollback — `wrangler deploy --rollback` and restore D1 from artifact if needed.

## Extension Guide
- New page — add `src/app/<route>/page.tsx` and reuse module components.
- New domain — create `src/modules/<feature>/{components,services,schemas}`.
- New API — prefer Server Actions; for REST add `src/app/api/v1/<name>/<action>.route.ts`.
- Cron/Workers — update `wrangler.toml`, `docs/opennext.md`, and deployment docs.

## Compatibility Notes
- OpenNext Workers do not allow Node `fs` writes; enable `nodejs_compat` only if required and supported.
- Be mindful of long CPU tasks and outbound requests on Workers; set timeouts and handle errors.
- Any change must update docs and `.dev.vars.example` to keep “docs as the runbook”.

