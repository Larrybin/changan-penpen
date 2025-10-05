# Cloudflare 部署工作流说明

本文档概述仓库中 `.github/workflows/deploy.yml` 的运行方式，以及本地/CI 在构建 Cloudflare Workers 之前需要注意的数据库迁移流程。

## CI Job 概览
- **Deploy Preview**：针对以 `main` 为目标的 Pull Request，部署到 Cloudflare preview 环境。
- **Deploy Production**：当提交推送到 `main` 分支时，将最新代码部署到生产环境。
- **Cleanup**：依赖前述 Job，负责统一的收尾清理逻辑（始终执行 `if: always()`）。

## 触发条件
- `pull_request`（目标分支 `main`）触发 Preview 部署。
- 推送到 `main` 分支触发 Production 部署。
- Cleanup Job 对两个部署 Job 设置 `needs`，要求它们完成后无论成功与否都运行。

## 所需的 GitHub Secrets 与 Variables
请在仓库或组织层级配置以下 Secrets：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDFLARE_R2_URL`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`

另外需要 GitHub Variables 提供不同环境的 API 地址：
- `CREEM_API_URL_PREVIEW`
- `CREEM_API_URL_PRODUCTION`

> Preview Job 会先检查上述 Secrets 是否齐全；若缺失将跳过部署并在 PR 留言说明缺项。

## Deploy Preview Job（Pull Request）
1. **Checkout 及运行环境准备**：拉取代码，安装 pnpm 和 Node.js，缓存 `.next/` 与 `.open-next/` 目录。
2. **Secrets 自检**：Shell 脚本遍历必需的 Secrets。缺失时写入 `GITHUB_OUTPUT` 并中止后续部署。
3. **安装依赖**：执行 `pnpm install --no-frozen-lockfile`。
4. **Cloudflare 类型生成**：在 Secrets 齐全时运行 `pnpm run cf-typegen`，保持绑定类型与 `wrangler.jsonc` 一致。
5. **诊断构建**：执行 `pnpm run build`，提前捕获 Next.js 编译问题。
6. **OpenNext 构建**：运行 `pnpm run preview:cf` 生成 Workers 产物，并对 `.open-next/` 与 `.next/` 输出做基础校验。
7. **数据库迁移（preview 环境）**：使用 `cloudflare/wrangler-action@v3` 执行 `d1 migrations apply --env preview`。
8. **部署代码**：通过 `wrangler-action` 发布 preview Worker，并注入 `CREEM_API_URL` 等变量。
9. **同步 Secrets**：调用 `wrangler secret put`，确保 preview Worker 的机密配置与 GitHub Secrets 一致。
10. **PR 评论**：
    - Secrets 完整：输出部署成功消息及 preview 地址。
    - Secrets 缺失：说明部署已跳过并列出缺失项。

## Deploy Production Job（main 分支）
1. **Checkout 与缓存**：同 preview Job，并额外缓存 `.next/cache`。
2. **安装依赖**：执行 `pnpm install --no-frozen-lockfile`。
3. **类型生成**：运行 `pnpm run cf-typegen`。
4. **双阶段构建**：先执行 `pnpm run build`（诊断），再运行 `pnpm run build:cf` 生成 Cloudflare 产物。
5. **数据库备份**：通过 `cloudflare/wrangler-action@v3` 执行 `d1 export`，生成带时间戳的生产库快照。
6. **数据库迁移（生产环境）**：执行 `d1 migrations apply`。
7. **部署代码**：发布生产 Worker，并写入 `CREEM_API_URL` 等变量。
8. **同步 Secrets**：逐项调用 `wrangler secret put`，保持 Worker Secrets 与 GitHub Secrets 对齐。
9. **等待与验证**：暂等 10 秒后运行 `wrangler-action --version`（可扩展为真实健康检查）。

## Cleanup Job
- 设置 `needs: [deploy-production, deploy-preview]`，保证两个部署 Job 结束后始终执行。
- 当前仅打印说明日志，可按需扩展为清理缓存或发送通知。

## 预构建脚本 `scripts/prebuild-cf.mjs`
- `pnpm run prebuild:cf` 会在 Cloudflare 构建前自动执行。
- 脚本始终同步 **本地** D1 迁移。
- 若要在 CI 或其他环境执行远程/preview 迁移，必须显式设置 `CLOUDFLARE_RUN_REMOTE_MIGRATIONS=true`。
- 未设置该变量时，只会输出提示并跳过远程操作，避免意外改动生产数据库。
- 如需同步 preview 数据库，可额外设置 `CLOUDFLARE_RUN_PREVIEW_MIGRATIONS=true`，或在 Cloudflare Pages 构建 (`CF_PAGES=1`) 中运行。

## 本地验证建议
- 修改 `wrangler.jsonc` 后运行 `pnpm run cf-typegen` 同步类型声明。
- 调整数据模型时，执行 `pnpm run db:migrate:local` 与 `pnpm run build:cf` 确认迁移可用。
- 本地模拟 preview 构建可运行 `pnpm run preview:cf` 并检查 `.open-next/worker.js`。
- 新增或调整部署逻辑时，建议通过 PR 触发 preview Job 验证流程是否按预期执行。
