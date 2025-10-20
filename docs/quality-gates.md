# Local & CI Quality Gates

## Local self-check (manual)
Recommended order:
1. Cloudflare type generation (`pnpm cf-typegen`)
2. Biome auto-fix (`pnpm exec biome check . --write --unsafe`)
3. TypeScript type check (`pnpm exec tsc --noEmit`)
4. Docs consistency and link checks (Windows: `node scripts/lib/doc-consistency-checker.mjs`; POSIX shells: `pnpm check:docs`; links: `pnpm check:links`)
5. Final Biome check (read-only) (`pnpm exec biome check .`)

Tips:
- On Windows PowerShell, prefer running the doc checker directly via Node as shown above.

## CI checks
- CI（`.github/workflows/ci.yml`）：默认拆分为 `lint-docs`、`typecheck`、`supply-chain`（仅 PR）与 `build`。`lint-docs` Job 负责 i18n 规范化、Biome 及文档检查；`typecheck` Job 运行 `tsc --noEmit`；`supply-chain` Job 运行 gitleaks、`pnpm dedupe --check` 与 `pnpm audit --prod --audit-level high`；`build` Job 执行 Next.js 构建并触发 SonarCloud 扫描。
  - `lint-docs`、`typecheck` 在 Node 20 与 Node 22 的矩阵环境中运行，pnpm 缓存会依据 Node 版本隔离，提前暴露跨版本兼容性问题。
  - `build.yml` 直接执行 SonarCloud 静态质量分析（无测试覆盖率输入）。

## Common commands
- `pnpm check:all` — run an aggregated local gate (docs/link checks still recommended separately)
