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
- CI（`.github/workflows/ci.yml`）：单一 `build-and-test` Job，串行执行 pnpm 安装、i18n 规范化校验、Biome/TypeScript、Docs/Links 检查、Vitest 覆盖率（生成 `coverage-summary.json` 与 HTML artifact）、覆盖率阈值校验，以及最终的 Next.js 构建。
  - 覆盖率阈值直接读取同一 Job 产出的 `coverage-summary.json`，必要时会从 `coverage-final.json` 回填，当前未触发额外的 SonarCloud 流程。

## Common commands
- `pnpm test` — run unit tests and generate coverage
- `pnpm push` — run the full local quality gate, then push (recommended)

