# CI/CD 流程与策略
本文档描述仓库的持续集成与持续部署策略，包括工作流触发条件、质量门以及依赖升级（Dependabot）分组与自动合并策略。

## 工作流概览
- CI（`.github/workflows/ci.yml`）
  - 触发：push / pull_request（忽略 main 的纯文档变更），以及 `workflow_call`（被部署复用）
- Jobs：
    - `lint-docs`：Biome、OpenAPI 快照校验（`pnpm openapi:check`）、Spectral 校验、链接检查，同时确保 i18n 字段规范化
    - `typecheck`：TypeScript `tsc --noEmit`
    - `unit-tests`：Vitest 测试与覆盖率生成/阈值校验，上传 HTML 报告 artifact
    - `dependencies-ui-regression`：仅当 PR 带有 `dependencies` 标签时运行，执行 `pnpm run test:ui-regression`（Radix/Tailwind 可访问性与交互冒烟，覆盖 Select/Dialog/Toast 以及整合流程 e2e 用例；仍需人工复核键盘循环、表单校验、Toast 叠层等交互）
    - `build`：复用 `.next/cache` 执行 `pnpm build`
- 部署（`.github/workflows/deploy.yml`）
  - 触发：push 到 main、pull_request 到 main、`workflow_dispatch`（手动）
  - 生产部署 Job 条件：push 到 main 且非文档-only，或手动触发；并且质量门成功
  - Secrets/Vars：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID/SECRET`、`CLOUDFLARE_R2_URL`、`CREEM_API_KEY/WEBHOOK_SECRET`、`NEXT_PUBLIC_APP_URL`；`OPENAI_API_KEY`（可选）
- Build（`.github/workflows/build.yml`）
  - 触发：push（仅 main 分支）、`workflow_call`、`workflow_run`（CI 成功后接力）
  - Jobs：
    - `changes`：检测是否为 docs-only 变更，为后续 Job 决策（`workflow_run` 场景直接视为非文档改动）
    - `sonarcloud`：复用 CI 上传的覆盖率工件（`coverage/lcov.info` / `coverage-summary.json`），必要时在 push/main 或直接调用时回退执行一次 Vitest 覆盖率
    - `docs-only`：当仅有文档改动时快速跳过重型步骤
- Dependabot Auto‑Merge（`.github/workflows/dependabot-automerge.yml`）
  - 仅对 Dependabot 的 minor/patch PR 且检查通过时开启 auto‑merge（squash）

## 手动部署（workflow_dispatch）
- 在 Actions 中选择“Deploy Next.js App to Cloudflare”并 Run workflow
- 手动触发仍受“非文档-only”与质量门约束；生产部署前会校验必需 Secrets/Vars

## 文档-only 变更策略
- CI 主流程与生产部署对纯文档改动不执行构建/部署，以节省资源
- 仍建议保留文档自检（链接、约定）以保证文档质量

## 质量门（质量闸）
- 本地质量闸详见：`docs/quality-gates.md`（推荐顺序：`pnpm cf-typegen`→`pnpm exec biome check . --write --unsafe`→`pnpm typecheck`→`pnpm run typecheck:tests`→`pnpm test --coverage`；文档校验：Windows 直接运行 `node scripts/lib/doc-consistency-checker.mjs`，POSIX 可用 `pnpm check:docs`；链接校验：`pnpm check:links`）
- 部署工作流会复用 CI 质量门作为前置条件
- 关键 UI 依赖升级后，请执行 `pnpm run analyze:bundle` 并记录 `.next/analyze` 的体积变化，防止客户端包意外膨胀

## Dependabot 分组与自动合并
- 分组（仅聚合 minor/patch）：
  - react-ecosystem：react、react-dom、@types/react、@radix-ui/*、react-hook-form、lucide-react、@tanstack/react-query
  - next-ecosystem：next、next-intl
  - cloudflare-workers：wrangler、@opennextjs/cloudflare
  - database：drizzle-orm、drizzle-zod、drizzle-kit、better-sqlite3
  - build-and-lint：typescript、@biomejs/biome、lint-staged、husky、tailwindcss、@tailwindcss/postcss、postcss
  - testing：vitest、@vitest/*、jsdom、@testing-library/*
  - types：@types/*
  - frontend-utils：clsx、class-variance-authority、tailwind-merge、dotenv、zod
  - auth：better-auth
- 自动合并（`.github/workflows/dependabot-automerge.yml`）：
  - 仅对 Dependabot 的 minor/patch PR 且检查通过时开启 auto‑merge（需要仓库设置启用 “Allow auto‑merge”）

## 提交与文档同步
- 修改 `.github/workflows/*.yml`、`package.json`、`wrangler.toml`、`scripts/`、`src/app/**/route.ts` 等关键文件时，请同步更新对应 docs（本文件、local‑dev、env 与 API 索引等）


<!-- DOCSYNC:WORKFLOWS_TABLE START -->
### Workflows Overview (auto)
| Workflow | Triggers | File |
| --- | --- | --- |
| Build | push (main), workflow_call, workflow_run | .github/workflows/build.yml |
| CI | workflow_dispatch, push, pull_request, workflow_call | .github/workflows/ci.yml |
| Dependabot Auto‑Merge | pull_request_target | .github/workflows/dependabot-automerge.yml |
| Deploy Next.js App to Cloudflare | workflow_dispatch, push, pull_request | .github/workflows/deploy.yml |
<!-- DOCSYNC:WORKFLOWS_TABLE END -->

<!-- sync: workflows updated in build.yml; table kept in sync by autogen -->

## 部署流程更新说明（2025-10-13）
- deploy.yml 已在“Deploy to Production (code)”之前新增“Build OpenNext bundle (Cloudflare)”步骤，执行 `npx @opennextjs/cloudflare build` 以生成 `.open-next/worker`，确保 Wrangler 部署的脚本包含有效的 `fetch` 处理器并避免 10068 错误。

## CI 测试流程更新说明（2025-10-15）
- `ci.yml` 中“List test cases (Vitest)”改为仅使用 `pnpm exec vitest list --reporter=verbose`，不再使用 `--dry-run` 兜底调用（Vitest 3 已不支持 `--dry-run/--dryRun`）。
- 目的：避免在新版本 Vitest 下出现 `Unknown option --dryRun` 失败，同时保持快速列举用例能力；正式测试仍在“Test (Vitest with coverage)”步骤执行。
- 另新增 `dependencies-ui-regression` Job（仅限带 `dependencies` 标签的 PR），执行 `pnpm run test:ui-regression` 覆盖 Radix/Tailwind 可访问性与交互冒烟用例，确保依赖升级不会破坏核心 UI。
- “Test (Vitest with coverage)” 统一使用 `pnpm test --coverage -- --coverage.reporter=...`，与本地 `pnpm test --coverage` 行为保持一致，同时上传 `coverage/` artifact。
- 覆盖率阈值环境变量（`COV_LINES` 等）已提升至 `lines:6 / statements:6 / functions:15 / branches:20`，后续可根据新增测试继续逐步上调。

## 部署工作流修复（2025-10-15）
- `deploy.yml` 将 `actions/github-script` 从一个无效的提交 SHA 固定，调整为稳定标签 `v7`，修复运行时报错：
  `An action could not be found at the URI ... actions/github-script/tarball/<SHA>`。
  若需继续使用 SHA 固定，请在后续安全审计中替换为官方 `v7` 对应的可信提交哈希。
