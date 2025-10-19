# Local & CI Quality Gates

## Local push self-check (`pnpm push`)
Execution order:
1. Cloudflare type generation (`pnpm cf-typegen`)
2. Biome auto-fix (`biome check . --write --unsafe`)
3. TypeScript type check (`tsc --noEmit`)
4. Unit tests with coverage (Vitest)
5. Docs consistency and link checks (`check:docs`, `check:links`)
6. Final Biome check (read-only)
7. Auto-generate commit message, rebase, push

Environment toggles:
- `SKIP_TESTS=1 pnpm push` — skip unit tests (emergency only; revert before merging)
- `SKIP_DOCS_CHECK=1 pnpm push` — skip docs checks (emergency only)
- `FORCE_NEXT_BUILD=1 pnpm push` — force Next.js build on Windows (default is skipped)

## CI checks
- CI（`.github/workflows/ci.yml`）：默认拆分为 `lint-docs`、`typecheck`、`supply-chain`（仅 PR）、`unit-tests` 与 `build`。`lint-docs` Job 负责 i18n 规范化、Biome 及文档检查；`typecheck` Job 运行 `tsc --noEmit`；`unit-tests` Job 生成 Vitest 覆盖率产物并校验阈值，随后 `build` Job 执行 Next.js 构建。
  - 覆盖率阈值直接读取同一 Job 产出的 `coverage-summary.json`，必要时会从 `coverage-final.json` 回填；当前基准线为 **lines/statements ≥ 15%**, **branches/functions ≥ 20%**，并保持文档与 `COV_*` 环境变量一致。
  - `supply-chain` Job 针对 PR 从 GitHub Releases 下载固定版本的 gitleaks 并执行 `detect`，同时运行 `pnpm dedupe --check` 与 `pnpm audit --prod --audit-level high`，在进入测试前提前暴露秘密泄漏或依赖树异常。

## Common commands
- `pnpm test` — run unit tests and generate coverage
- `pnpm push` — run the full local quality gate, then push (recommended)

