# CI/CD 流程与策略
本文档描述仓库的持续集成与持续部署策略，包括工作流触发条件、质量门以及依赖升级（Dependabot）分组与自动合并策略。

## 工作流概览
- CI（`.github/workflows/ci.yml`）
  - 触发：push / pull_request（忽略 main 的纯文档变更），以及 `workflow_call`（被部署复用）
  - 步骤：Biome、TypeScript、Docs/Links 检查、Vitest 覆盖率阈值校验
- 部署（`.github/workflows/deploy.yml`）
  - 触发：push 到 main、pull_request 到 main、`workflow_dispatch`（手动）
  - 生产部署 Job 条件：push 到 main 且非文档-only，或手动触发；并且质量门成功
  - Secrets/Vars：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID/SECRET`、`CLOUDFLARE_R2_URL`、`CREEM_API_KEY/WEBHOOK_SECRET`、`NEXT_PUBLIC_APP_URL`；`OPENAI_API_KEY`（可选）
- Build（`.github/workflows/build.yml`）
  - 触发：push 到 main、部分 PR 事件
  - Jobs：
    - `changes`：检测是否为 docs-only 变更，为后续 Job 决策
    - `sonarcloud`：运行 Vitest 覆盖率（生成 `coverage/lcov.info` 与 `coverage-summary.json`），当前仅保留产物供后续使用
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
- 本地质量闸详见：`docs/quality-gates.md`（`pnpm push`：类型检查、单测与覆盖率、文档与链接检查、Biome 最终检查、可选 Next 构建）
- 部署工作流会复用 CI 质量门作为前置条件

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
| Build | push, pull_request | .github/workflows/build.yml |
| CI | workflow_dispatch, push, pull_request, workflow_call | .github/workflows/ci.yml |
| Dependabot Auto‑Merge | pull_request_target | .github/workflows/dependabot-automerge.yml |
| Deploy Next.js App to Cloudflare | workflow_dispatch, push, pull_request | .github/workflows/deploy.yml |
<!-- DOCSYNC:WORKFLOWS_TABLE END -->

<!-- sync: workflows updated in build.yml; table kept in sync by autogen -->

## 部署流程更新说明（2025-10-13）
- deploy.yml 已在“Deploy to Production (code)”之前新增“Build OpenNext bundle (Cloudflare)”步骤，执行 `npx @opennextjs/cloudflare build` 以生成 `.open-next/worker`，确保 Wrangler 部署的脚本包含有效的 `fetch` 处理器并避免 10068 错误。
