# Workflow: CI

Location: `.github/workflows/ci.yml`. 当前流程拆分为 lint/docs,TypeScript,单测覆盖率与 Next.js 构建等独立 Job,需要串联的步骤通过 `needs` 保持依赖,其余 Job 可以并行执行.
CI 会在 `unit-tests` Job 内生成 `coverage-summary.json` 并即时校验阈值; HTML 报告以 artifact 形式上传,当前未再额外触发独立的 SonarCloud 工作流.

## Triggers
- `push` to non-`main` branches (docs-only changes ignored if configured)
- PRs to `main` are handled by the Deploy workflow, which calls this CI via `workflow_call` as a quality gate (CI itself ignores `main` for direct `push`/`pull_request`).
- Manual dispatch (`workflow_dispatch`) for reruns

## Jobs & Steps
1. `lint-docs`
   - Checkout,安装 pnpm/Node, 复用 `./.github/actions/install-and-heal` 安装依赖.
   - 执行 `pnpm run fix:i18n` 并校验无 diff,随后运行 `pnpm exec biome check .`,`pnpm run check:docs`,`pnpm run check:links`.
2. `typecheck`
   - 与 `lint-docs` 共用安装步骤,并行触发 TypeScript `pnpm exec tsc --noEmit`.
3. `unit-tests`
   - 依赖前两个 Job 成功,再次复用安装步骤.
   - 先列出 Vitest 测试用例,再以 `pnpm exec vitest run --coverage` 执行单测并生成覆盖率产物.
   - 上传 `coverage` HTML artifact,根据 `COV_*` 环境变量读取 `coverage-summary.json`(必要时从 `coverage-final.json` 回填)并校验阈值.
4. `build`
   - 依赖 `unit-tests` 成功后执行,共享安装步骤并复用 `.next/cache`.
   - 输出 `NEXT_PUBLIC_APP_URL` 供调试,执行 `pnpm build` 生成产物.

## Concurrency & Caching
- `concurrency: ci-${{ github.ref }}` to avoid duplicate runs
- `lint-docs` 与 `typecheck` 并行运行, `unit-tests` / `build` 通过 `needs` 串联质量门
- Cache pnpm store 与 `.next/cache`

See also: `docs/ci-cd.md`.
