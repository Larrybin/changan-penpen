# Workflow: CI

Location: `.github/workflows/ci.yml`. 当前流程拆分为 lint/docs、TypeScript、供应链安全 (仅 PR) 与 Next.js 构建等独立 Job, 需要串联的步骤通过 `needs` 保持依赖, 其余 Job 可以并行执行。
流程不再包含自动化测试或覆盖率校验, SonarCloud 仅针对构建产物进行静态分析。CI 默认只针对仓库配置的 Node 版本运行, 兼容性验证迁移到独立的 `node22-compatibility` 工作流。

## Triggers
- `push` to non-`main` branches (docs-only changes ignored if configured)
- PRs to `main` are handled by the Deploy workflow, which calls this CI via `workflow_call` as a quality gate (CI itself ignores `main` for direct `push`/`pull_request`).
- Manual dispatch (`workflow_dispatch`) for reruns

## Jobs & Steps
1. `lint-docs`
   - 在默认 Node 版本下执行, Checkout 后安装 pnpm/Node 并复用 `./.github/actions/install-and-heal` 安装依赖。
   - 执行 `pnpm run fix:i18n` 并校验无 diff, 随后运行 `pnpm exec biome check .`,`pnpm run openapi:generate`/`openapi:check`,`pnpm run openapi:lint`,`pnpm run check:links`。
2. `typecheck`
   - 与 `lint-docs` 共用安装步骤, 触发 TypeScript `pnpm exec tsc --noEmit`。
3. `supply-chain` (pull_request only)
   - 使用官方 `gitleaks/gitleaks-action` 执行秘密扫描 (启用详细日志与脱敏)。
   - `pnpm dedupe --check` 确保锁文件最优。
   - `pnpm audit --prod --audit-level high` 带网络重试, 高危直接失败, 中危发出警告。
4. `build`
   - 依赖 `lint-docs`、`typecheck` 成功后执行, 共享安装步骤并复用 `.next/cache`。
   - 执行 `pnpm build` 生成产物, 并将 `.next` 关键目录打包为 `next-build.tar.gz` Artifact（供部署流程复用/加速）。

## Concurrency & Caching
- `concurrency: ci-${{ github.ref }}` 避免重复运行
- `lint-docs`,`typecheck`,`supply-chain` 并行运行, `build` 通过 `needs` 串联质量门
- `./.github/actions/setup-node-pnpm` 统一处理 pnpm store 缓存, 通过 `cache-key-suffix` 区分 Job
- 使用 `actions/cache` 复用 `.next/cache`

See also: `docs/ci-cd.md`.
