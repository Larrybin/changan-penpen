# Extending the Platform

> Guidance for adding new domain modules and preparing deployments across different runtime targets.

## Before You Start
- Read through [`architecture-overview.md`](architecture-overview.md) to understand module boundaries and shared utilities.
- Confirm there is a product or operations issue linked to the work. Every major change should be traceable in Linear/Jira.
- Sync with the owning team listed in [`docs-maintenance.md`](docs-maintenance.md) when altering shared flows (auth, layout, analytics).

## Adding a New Domain Module
1. **Create the module skeleton** under `src/modules/<feature>/` with `actions`, `components`, `hooks`, `models`, `schemas`, and `utils` folders as needed. Keep exports barrelled through `index.ts` for the module.
2. **Define contracts**:
    - Schemas using Zod live under `schemas/`.
    - Models wrap API responses or database entities and live under `models/`.
    - Use `src/lib/trpc` for RPC calls and `src/db` for Drizzle access. Avoid direct fetches from components.
3. **Implement UI**:
    - Compose UI with primitives from `src/components/ui` to keep styling consistent.
    - New routes belong in `src/app/(features)/<feature>/` and should include loading and error states.
4. **Wire up server actions** via `src/modules/<feature>/actions`. Follow patterns in `ServerAction-StateSync-Guide.md` for validation and optimistic updates.
5. **Document behaviour** by updating feature guides or creating new ones under `docs/`.

## Integrating With Existing Systems
- **Authentication**: Reuse helpers from `src/lib/auth`. Avoid duplicating session logic.
- **Event tracking**: Emit events through `src/lib/analytics` to keep dashboards consistent.
- **Background jobs**: Prefer durable background actions in Workers. Add new queues to `workflow/` docs.
- **Permissions**: Extend `src/modules/authz` policies and add tests covering least-privilege cases.

## Cross-Platform Deployment Checklist
| Target | Required Steps |
| --- | --- |
| **Cloudflare Workers** | Update bindings in `wrangler.toml`, run `pnpm deploy:cf`, and verify with `pnpm run check:links` & `pnpm run check:docs`. |
| **Vercel (preview)** | Ensure `next.config.ts` feature flags are compatible, configure environment variables in the Vercel dashboard, and run `pnpm build`. |
| **Edge Preview** | Use `pnpm dev:cf` locally, capture metrics in Workers Analytics, and document known limitations in `troubleshooting.md`. |

## Quality Gates
- Ensure `pnpm lint` and `pnpm typecheck` pass before opening a PR.
- Update `docs/00-index.md` and any related runbooks to keep navigation accurate.

## Rollout & Post-Deployment
1. Prepare a rollback strategy (feature flag or revert plan) and include it in the PR description.
2. Notify stakeholders in the release channel once the deployment completes.
3. Schedule a post-release review to capture learnings in `quality-gates.md` or module-specific docs.

---

Maintaining consistent module boundaries and deployment steps ensures the platform stays operable across every environment we support.
