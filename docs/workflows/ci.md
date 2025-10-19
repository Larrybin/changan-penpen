# Workflow: CI

Location: `.github/workflows/ci.yml`. 当前流程拆分为 lint/docs, TypeScript, 供应链安全 (仅 PR), 单测覆盖率与 Next.js 构建等独立 Job, 需要串联的步骤通过 `needs` 保持依赖, 其余 Job 可以并行执行.
CI 会在 `unit-tests` Job 内生成 `coverage-summary.json` 并即时校验阈值 (lines/statements ≥ 15%, branches/functions ≥ 20%); HTML 报告以 artifact 形式上传。该 artifact 会在后续的 `build.yml` 工作流中复用, 并在 SonarCloud 扫描步骤中消耗。

## Triggers
- `push` to non-`main` branches (docs-only changes ignored if configured)
- PRs to `main` are handled by the Deploy workflow, which calls this CI via `workflow_call` as a quality gate (CI itself ignores `main` for direct `push`/`pull_request`).
- Manual dispatch (`workflow_dispatch`) for reruns

## Jobs & Steps
1. `lint-docs`
   - 在 **Node 20** 与 **Node 22** 的矩阵环境中执行, Checkout 后安装 pnpm/Node 并复用 `./.github/actions/install-and-heal` 安装依赖。
   - 执行 `pnpm run fix:i18n` 并校验无 diff,随后运行 `pnpm exec biome check .`,`pnpm run check:docs`,`pnpm run check:links`。
2. `typecheck`
   - 同样覆盖 Node 20/22, 与 `lint-docs` 共用安装步骤,并行触发 TypeScript `pnpm exec tsc --noEmit`。
   - 测试文件保留在单独的 `tsconfig.test.json` 中做类型诊断 (可通过 `pnpm run typecheck:tests` 或 `vitest --typecheck` 调用), 避免影响生产构建。
3. `supply-chain` (pull_request only)
   - Checkout + Node/pnpm 安装.
   - 从 GitHub Releases 下载固定版本 (`8.18.2`) 的 gitleaks 压缩包并解压执行 `gitleaks detect --source . --no-banner --redact` 进行秘密扫描.
   - `pnpm dedupe --check` 确保锁文件最优.
   - `pnpm audit --prod --audit-level high` 报告高危生产依赖漏洞.
4. `unit-tests`
   - 在 Node 20/22 下依赖前两个 Job 成功,再次复用安装步骤.
   - 先列出 Vitest 测试用例,再以 `pnpm exec vitest run --coverage` 执行单测并生成覆盖率产物.
   - 上传 `coverage` HTML artifact,根据 `COV_*` 环境变量读取 `coverage-summary.json`(必要时从 `coverage-final.json` 回填)并校验阈值.
5. `build`
   - 依赖 `unit-tests` 成功后执行,共享安装步骤并复用 `.next/cache`。
   - 输出 `NEXT_PUBLIC_APP_URL` 供调试,执行 `pnpm build` 生成产物。
   - 下载或生成 `coverage/lcov.info` 后, 运行 SonarCloud 扫描 (GitHub Action 固定到 `eb211723266fe8e83102bac7361f0a05c3ac1d1b`) 以同步静态质量门。

## Concurrency & Caching
- `concurrency: ci-${{ github.ref }}` to avoid duplicate runs
- `lint-docs`、`typecheck` 与 `supply-chain` 并行运行, `unit-tests` / `build` 通过 `needs` 串联质量门
- 针对 Node 20/22 的矩阵任务, `actions/setup-node` 通过 `cache-dependency-path: pnpm-lock.yaml` 缓存 pnpm store, 避免不同 Node 版本间互相污染。
- Cache `.next/cache`

See also: `docs/ci-cd.md`.
