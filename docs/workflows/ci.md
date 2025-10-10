# Workflow: CI

Location: `.github/workflows/ci.yml`. Runs Biome, TypeScript, Vitest, and Next build as the quality gate before any deployment. CI 仅用于覆盖率阈值校验(基于 coverage-summary.json);SonarCloud 工作流消费 lcov(由其内的 Vitest 测试步骤生成).

## Triggers
- `push` to non-`main` branches (docs-only changes ignored if configured)
- PRs to `main` are handled by the Deploy workflow, which calls this CI via `workflow_call` as a quality gate (CI itself ignores `main` for direct `push`/`pull_request`).
- Manual dispatch (`workflow_dispatch`) for reruns

## Steps
1. Setup Node and pnpm cache
2. `pnpm install --frozen-lockfile`
3. `pnpm run fix:i18n` (optional), `pnpm lint`, `pnpm test --coverage`, `pnpm build`
4. Coverage thresholds check via coverage-summary(lcov 由 SonarCloud 工作流负责)

## Concurrency & Caching
- `concurrency: ci-${{ github.ref }}` to avoid duplicate runs
- Cache pnpm store and `.next/cache`

See also: `docs/ci-cd.md`.

