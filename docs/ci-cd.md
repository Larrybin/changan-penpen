# CI/CD 流程与策略
本文档描述仓库的持续集成与持续部署策略，包括工作流触发条件、质量门以及依赖升级（Dependabot）分组与自动合并策略。

## 工作流概览
- CI（`.github/workflows/ci.yml`）
  - 触发：push / pull_request（忽略 main 的纯文档变更），以及 `workflow_call`（被部署复用）
  - Jobs：
    - `lint-docs`：在仓库配置的默认 Node 版本下运行，执行 Biome、OpenAPI 快照校验（`pnpm openapi:check`）、Spectral 校验、链接检查，并确保 i18n 字段规范化
    - `typecheck`：TypeScript `tsc --noEmit`
    - `supply-chain`：PR 环境执行官方 `gitleaks/gitleaks-action`、`pnpm dedupe --check`、带网络重试的 `pnpm audit --prod`
    - `build`：复用 `.next/cache` 执行 `pnpm build`，并将 `.next` 关键目录打包为 `next-build` Artifact 供部署流程复用
- 部署（`.github/workflows/deploy.yml`）
  - 触发：push 到 main、pull_request 到 main、`workflow_dispatch`（手动）
  - 生产部署 Job 条件：push 到 main 且非文档-only，或手动触发；并且质量门成功
  - Jobs：
    - `package-artifacts`：复用 CI 产物（若存在），否则本地构建一次 Next.js → OpenNext，将 `.open-next` 打包为 Artifact
    - `database-prep`：独立导出 D1 备份并执行迁移/校验，与打包 Job 并行
    - `deploy-production`：下载 OpenNext Artifact、校验所需 Secrets、部署 Wrangler、可选同步 Secrets、执行动态健康检查与邮件通知
  - Secrets/Vars：集中维护于 `config/workflow-config.json`；部署流程读取 JSON 列表以校验/同步必需 Secrets
- Node 22 兼容性（`.github/workflows/node22-compatibility.yml`）
  - 触发：每周一 06:00 UTC 的定时任务 + 手动 `workflow_dispatch`
  - 单独在 Node 22 环境运行 TypeScript 检查与 Biome，作为次要运行时的回归保障
- Build（`.github/workflows/build.yml`）
  - 触发：push（仅 main 分支）、`workflow_call`、`workflow_run`（CI 成功后接力）
  - Jobs：
    - `changes`：调用共享脚本检测 docs-only 变更，为后续 Job 决策（`workflow_run` 场景直接视为非文档改动）
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
| Node 22 compatibility | workflow_dispatch, schedule | .github/workflows/node22-compatibility.yml |
<!-- DOCSYNC:WORKFLOWS_TABLE END -->

<!-- sync: workflows updated in build.yml; table kept in sync by autogen -->

## 部署流程更新说明（2026-02-22）
- 部署流程拆分为“打包应用”“数据库准备”“生产部署”三个 Job，通过 Artifact 共享 OpenNext 产物，避免重复构建。
- 健康检查去除固定 45 秒等待，改为可配置的初始延迟 + 重试逻辑；健康检查失败时通过 SMTP 发送邮件通知（无自动回滚）。
- Secrets 校验/同步改为读取 `config/workflow-config.json`，减少多处配置漂移。
- 新增定期 Node 22 兼容性工作流，日常 CI 仅使用主支持版本。

## CI 流程更新说明（2026-02-22）
- `lint-docs`/`typecheck` 统一在默认 Node 版本运行，Node 22 兼容性改由独立工作流按周巡检。
- `supply-chain` Job 切换到官方 `gitleaks` Action，并为 `pnpm audit` 增加网络重试与中危告警。
- `build` Job 在成功构建后上传 `next-build` Artifact，为部署流程提供复用入口。

## CI 流程更新说明（2025-10-15）
- 仓库已移除单元测试、UI 回归测试与覆盖率步骤，CI 仅保留 lint、类型检查、供应链扫描与构建。

## 部署工作流修复（2025-10-15）
- `deploy.yml` 将 `actions/github-script` 从一个无效的提交 SHA 固定，调整为稳定标签 `v7`，修复运行时报错：
  `An action could not be found at the URI ... actions/github-script/tarball/<SHA>`。
  若需继续使用 SHA 固定，请在后续安全审计中替换为官方 `v7` 对应的可信提交哈希。
