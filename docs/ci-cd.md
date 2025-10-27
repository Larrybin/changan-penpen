### 2025-10 - pnpm 8.15.9 alignment
- Workflows now pin pnpm 8.15.9 via .github/actions/setup-node-pnpm and pass the same version in CI/Deploy/Security jobs.
- Dependabot PRs must retain the v8 lockfile format; regenerate with pnpm@8.15.9 (pnpm install --lockfile-only) before merging.
- When upgrading pnpm, update the composite action and every workflow input together, then refresh this note.

# CI/CD 流程与策略
本文档描述仓库的持续集成与持续部署策略，包括工作流触发条件、质量门以及依赖升级（Dependabot）分组与自动合并策略。

## 工作流概览
- CI（`.github/workflows/ci.yml`）
  - 触发：push / pull_request（忽略 main 的纯文档变更），以及 `workflow_call`（被部署复用）
- Jobs：
    - `lint-docs`：在 Node 20 环境中运行静态配置导出（`pnpm run prebuild:static-config`）、配置校验、`pnpm run fix:i18n`（并校验无 diff）、`pnpm exec biome check .`、OpenAPI 生成/校验/规范检查以及 `pnpm run check:links`
    - `typecheck`：Node 20 上执行 `pnpm exec tsc --noEmit`
    - `supply-chain`：PR 环境执行 gitleaks 扫描、`pnpm dedupe --check`、分级 `pnpm audit`（高危报错、Moderate 提醒）以及 `npx license-checker --summary`
    - `build`：缓存 `.next/cache` 后执行 `pnpm build`，在 Secrets 完整时追加 `pnpm run build:cf -- --skipNextBuild` 并上传产物
- 部署（`.github/workflows/deploy.yml`）
  - 触发：push 到 main、pull_request 到 main、`workflow_dispatch`（手动）
  - 生产部署 Job 条件：push 到 main 且非文档-only，或手动触发；并且质量门成功
  - Secrets/Vars：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID/SECRET`、`CLOUDFLARE_R2_URL`、`CREEM_API_KEY/WEBHOOK_SECRET`、`NEXT_PUBLIC_APP_URL`；`OPENAI_API_KEY`（可选）
- Build（`.github/workflows/build.yml`）
  - 触发：push（仅 main 分支）、`workflow_call`、`workflow_run`（CI 成功后接力）
  - Jobs：
    - `changes`：检测是否为 docs-only 变更，为后续 Job 决策（`workflow_run` 场景直接视为非文档改动）
    - `sonarcloud`：执行 SonarCloud 静态分析（无测试覆盖率输入）
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
- 本地质量闸详见：`docs/quality-gates.md`（推荐顺序：`pnpm cf-typegen`→`pnpm exec biome check . --write --unsafe`→`pnpm typecheck`；文档校验：Windows 直接运行 `node scripts/lib/doc-consistency-checker.mjs`，POSIX 可用 `pnpm check:docs`；链接校验：`pnpm check:links`）
- 部署工作流会复用 CI 质量门作为前置条件
- 关键 UI 依赖升级后，请执行 `pnpm run analyze:bundle` 并记录 `.next/analyze` 的体积变化，防止客户端包意外膨胀

## Dependabot 分组与自动合并
- 分组（仅聚合 minor/patch）：
  - react-ecosystem：react、react-dom、@types/react、@radix-ui/*、react-hook-form、lucide-react、@tanstack/react-query
  - next-ecosystem：next、next-intl
  - cloudflare-workers：wrangler、@opennextjs/cloudflare
  - database：drizzle-orm、drizzle-zod、drizzle-kit、better-sqlite3
  - build-and-lint：typescript、@biomejs/biome、lint-staged、husky、tailwindcss、@tailwindcss/postcss、postcss
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
| Performance Monitoring | workflow_dispatch, schedule, pull_request | .github/workflows/performance-monitoring.yml |
| Release | workflow_dispatch, push | .github/workflows/release.yml |
| Security Scan | workflow_dispatch, schedule | .github/workflows/security-scan.yml |
<!-- DOCSYNC:WORKFLOWS_TABLE END -->

<!-- sync: workflows updated in build.yml; table kept in sync by autogen -->

## 部署流程更新说明（2025-10-13）
- deploy.yml 已在“Deploy to Production (code)”之前新增“Build OpenNext bundle (Cloudflare)”步骤，执行 `npx @opennextjs/cloudflare build` 以生成 `.open-next/worker`，确保 Wrangler 部署的脚本包含有效的 `fetch` 处理器并避免 10068 错误。

## CI 流程更新说明（2025-10-15）
- 仓库已移除单元测试、UI 回归测试与覆盖率步骤，CI 仅保留 lint、类型检查、供应链扫描与构建。

## 部署工作流修复（2025-10-15）
- `deploy.yml` 将 `actions/github-script` 从一个无效的提交 SHA 固定，调整为稳定标签 `v7`，修复运行时报错：
  `An action could not be found at the URI ... actions/github-script/tarball/<SHA>`。
  若需继续使用 SHA 固定，请在后续安全审计中替换为官方 `v7` 对应的可信提交哈希。







