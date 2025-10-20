# Testing Status & Manual QA

This repository has removed automated tests and coverage gates.

What this means:
- No `vitest`/`jest` runners or coverage upload in CI.
- Local and CI quality rely on type safety, linting, build checks, and documented manual verification.

Quality gates (local):
- `pnpm check:all` — aggregated local gate (cf-typegen, Biome, tsc, docs/links, optional build)
- `pnpm typecheck` — strict TypeScript checks (includes `cf-typegen`)
- `pnpm lint` — Biome formatting and static checks
- Optional: `pnpm build` — verify Next.js build output

Manual QA checklist (minimum):
- Auth: sign in/out flow works (email/password or OAuth as configured)
- Admin: open Admin dashboard and save a simple setting (e.g., Site Settings)
- CRUD: create/edit/delete a Todo; verify list updates
- Marketing: landing page renders and basic navigation works
- Health: `/api/v1/health` returns 200 in strict mode; record URL in PR

PR expectations:
- Include a brief “Verification” section: steps taken, screenshots or short clips for key paths
- Link updated docs when flows or operations change

Windows note (husky hooks):
- If pre-commit or pre-push fails with a `'/d'` argument error under PowerShell, use `--no-verify` as a temporary workaround, or run the project’s custom `pnpm push` helper if available. Prefer fixing local shell integration later (see docs/troubleshooting.md).

