# Workflow: CI

Location: `.github/workflows/ci.yml`. Runs Biome, TypeScript, documentation/link checks, Vitest (with coverage summary), and a Next.js build as the quality gate before any deployment.
CI 直接在同一 Job 中生成 `coverage-summary.json` 并校验阈值，产物会以 artifact 形式上传，当前未再额外触发独立的 SonarCloud 工作流。

## Triggers
- `push` to non-`main` branches (docs-only changes ignored if configured)
- PRs to `main` are handled by the Deploy workflow, which calls this CI via `workflow_call` as a quality gate (CI itself ignores `main` for direct `push`/`pull_request`).
- Manual dispatch (`workflow_dispatch`) for reruns

## Steps
1. Checkout repository, set up pnpm/Node, restore caches (`pnpm/action-setup`, `actions/setup-node`, `.next/cache`).
2. 安装依赖并执行 `pnpm run fix:i18n`（可选），随后校验 i18n 目录无 diff。
3. `pnpm exec biome check .`、`pnpm run check:docs`、`pnpm run check:links` 完成本地代码与文档一致性检查。
4. 运行 `pnpm exec vitest run --coverage`，生成 HTML 报告与 `coverage-summary.json`（必要时 fallback 到 `coverage-final.json`）。
5. 上传 coverage artifact，并根据环境阈值（行/语句/分支/函数）校验 `coverage-summary.json`。
6. 输出诊断信息（如 `NEXT_PUBLIC_APP_URL`），执行 `pnpm build`（可透传 Sentry 相关 Secrets/Vars）。

## Concurrency & Caching
- `concurrency: ci-${{ github.ref }}` to avoid duplicate runs
- Cache pnpm store and `.next/cache`

See also: `docs/ci-cd.md`.
