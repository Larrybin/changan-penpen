# CI/CD 流程与策略

本文档描述仓库的持续集成与持续部署策略，包括工作流触发条件、质量门以及依赖升级（Dependabot）分组与自动合并策略。

## 工作流概览
- CI（.github/workflows/ci.yml）
  - 触发：push/pr（忽略 main 分支与纯文档变更），以及 workflow_call（被部署复用）。
  - 步骤：Biome、TypeScript、Docs/Links 检查、Vitest 覆盖率阈值校验（CI 仅用于阈值校验；SonarCloud 工作流消费 lcov（由其内的 Vitest 测试步骤生成））。
- 部署（.github/workflows/deploy.yml）
  - 触发：push 到 main、pull_request 到 main、workflow_dispatch（手动）。
  - 生产部署 Job 条件：
    - push 到 main 且非文档-only，或者 workflow_dispatch（手动触发）；并且质量门成功。
    - 仍保留“文档-only 跳过部署”的保护。
  - 需 Secrets/Vars：CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID、BETTER_AUTH_SECRET、GOOGLE_CLIENT_ID/SECRET、CLOUDFLARE_R2_URL、CREEM_API_KEY/WEBHOOK_SECRET、NEXT_PUBLIC_APP_URL；OPENAI_API_KEY（可选，按需启用 AI 功能）。
- Semgrep（.github/workflows/semgrep.yml）
  - 安全扫描（auto config），上传 SARIF 到 GitHub Code Scanning。
- SonarCloud（.github/workflows/sonarcloud.yml）
  - 消费 lcov 覆盖率（由该工作流内的 Vitest 步骤生成 `coverage/lcov.info`），在 SonarCloud 中聚合质量与技术债。

## 手动部署（workflow_dispatch）
- 在 Actions 中选择“Deploy Next.js App to Cloudflare”并 Run workflow。
- 手动触发仍受“非文档-only”与质量门约束（确保不是纯文档改动；或先合入非文档更新）。
- 生产部署前将检查必要 Secrets/Vars 是否齐全，缺失会直接终止部署。

## 文档-only 变更策略
- CI 主流程与生产部署对纯文档改动不执行构建/部署，以节省资源。
- 仍建议保留文档自检（链接、约定）以保证文档质量。

## 质量门（质量闸）
- 本地质量闸与说明详见：docs/quality-gates.md（`pnpm push` 会在推送前执行类型检查、单测与覆盖率、Semgrep、文档与链接检查、Biome 最终检查、可选 Next 构建等）。
- CI 中的部署工作流会复用 CI 质量门作为前置条件（needs: quality-gate-reusable）。

## Dependabot 分组与自动合并
- 分组（仅聚合 minor/patch）：
  - react-ecosystem：react、react-dom、@types/react、@radix-ui/*、react-hook-form、lucide-react、@tanstack/react-query
  - next-ecosystem：next、next-intl、@sentry/nextjs
  - cloudflare-workers：wrangler、@opennextjs/cloudflare
  - database：drizzle-orm、drizzle-zod、drizzle-kit、better-sqlite3
  - build-and-lint：typescript、@biomejs/biome、lint-staged、husky、tailwindcss、@tailwindcss/postcss、postcss
  - testing：vitest、@vitest/*、jsdom、@testing-library/*
  - types：@types/*
  - frontend-utils：clsx、class-variance-authority、tailwind-merge、dotenv、zod
  - auth：better-auth
- 自动合并（.github/workflows/dependabot-automerge.yml）：
  - 仅对 Dependabot 的 minor/patch PR 且检查通过时启用 auto-merge（squash）。
  - 需要在仓库设置中开启“Allow auto-merge”。
  - security 与 major 升级保留人工审查。

## 提交与文档同步
- 修改 `.github/workflows/*.yml`、`package.json`、`wrangler.jsonc`、`scripts/`、`src/app/**/route.ts` 等关键文件时，请同步更新对应的 docs（本文件、local-dev、env 与 API 索引等）。
