# Workflow: CI

Location: `.github/workflows/ci.yml`. 当前流程拆分为 lint/docs,TypeScript,供应链安全 (仅 PR) 与 Next.js 构建等独立 Job, 需要串联的步骤通过 `needs` 保持依赖, 其余 Job 可以并行执行.
流程不再包含自动化测试或覆盖率校验;SonarCloud 静态分析改由 `build.yml` 处理.

## Triggers
- `push` to non-`main` branches (docs-only changes ignored if configured)
- PRs to `main` are handled by the Deploy workflow, which calls this CI via `workflow_call` as a quality gate (CI itself ignores `main` for direct `push`/`pull_request`).
- Manual dispatch (`workflow_dispatch`) for reruns

## Jobs & Steps
1. `lint-docs`
   - 单一 **Node 20** 环境, 通过 `./.github/actions/setup-node-pnpm` + `install-and-heal` 复用安装逻辑.
   - 执行 `pnpm run prebuild:static-config`,`pnpm run validate:static-config -- --print`,`pnpm run fix:i18n` 并校验无 diff, 随后运行 `pnpm exec biome check .`,`pnpm run openapi:generate`,`pnpm run openapi:check`,`pnpm run openapi:lint` 与 `pnpm run check:links`.
   - **注意**:`pnpm run check:docs` 已从工作流中移除, 避免纯文档 diff 阻塞 CI.
2. `typecheck`
   - Node 20 环境执行, 共享安装步骤, 运行 `pnpm exec tsc --noEmit`.
3. `supply-chain` (pull_request only)
   - 下载固定版本 (`8.18.2`) gitleaks 进行秘密扫描, 之后运行 `pnpm dedupe --check`,两阶段 `pnpm audit`(高危报错 + Moderate 提示)以及 `npx license-checker --summary --excludePrivatePackages`.
4. `build`
   - 依赖 `lint-docs`,`typecheck`, 复用 `.next/cache`.
   - 打印 `NEXT_PUBLIC_APP_URL`, 执行 `pnpm build`.
   - 当 Cloudflare/Better Auth/Google Secrets 齐全时执行 `pnpm run build:cf -- --skipNextBuild`, 并上传 `.next` 与 `.open-next` 产物.

## Concurrency & Caching
- `concurrency: ci-${{ github.ref }}` to avoid duplicate runs
- `lint-docs`,`typecheck` 与 `supply-chain` 并行运行, `build` 通过 `needs` 串联质量门
- `setup-node-pnpm` 与 `install-and-heal` 组合负责 Node 20 + pnpm 8.15.9 的缓存和修复流程.
- Cache `.next/cache`

See also: `docs/ci-cd.md`.
