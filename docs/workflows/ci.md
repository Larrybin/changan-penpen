# Workflow: CI

Location: `.github/workflows/ci.yml`. Runs Biome, TypeScript, Vitest, and Next build as the quality gate before any deployment.

## Triggers
- `push` to non‑`main` branches (excluding README/docs‑only changes if configured)
- `pull_request` targeting `main`
- Manual dispatch (for reruns)

## Steps
1. Setup Node and pnpm cache
2. `pnpm install --frozen-lockfile`
3. `pnpm run fix:i18n` (optional), `pnpm lint`, `pnpm test --coverage`, `pnpm build`
4. Upload coverage summary if needed

## Concurrency & Caching
- `concurrency: ci-${{ github.ref }}` to avoid duplicate runs
- Cache pnpm store and `.next/cache`

See also: `docs/ci-cd.md`.
