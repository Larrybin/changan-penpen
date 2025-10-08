# Cloudflare 部署说明（Production）

本文档概述 `.github/workflows/deploy.yml` 的生产部署流程，以及在部署到 Cloudflare Workers 之前需要注意的数据库迁移等细节。

## CI Job 概览
- Deploy Production：当提交推送到 `main` 分支时，运行构建与部署代码到生产环境。

## 触发规则
- push 到 `main` 分支会触发生产部署；
- 部署 Job 在前置 CI（质量门）通过后执行。

## 必需的 GitHub Secrets / Variables
仓库层级需要配置以下 Secrets：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDFLARE_R2_URL`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`

常用 GitHub Variables（非敏感）：
- `NEXT_PUBLIC_APP_URL`
- `CREEM_API_URL_PRODUCTION`

## 生产部署 Job（main 分支）
1. Checkout 与缓存：拉取仓库，缓存 `.next/cache`；
2. 安装依赖：复用复合 Action（自愈安装）；
3. 生成 Cloudflare 类型：`pnpm run cf-typegen`；
4. 双阶段构建：先 `pnpm run build` 再 `pnpm run build:cf` 产出 OpenNext 工件；
5. 数据库备份：`cloudflare/wrangler-action` 执行 `d1 export` 生成备份；
6. 数据库迁移：`d1 migrations apply --env production --remote`；
7. 代码部署：`wrangler deploy --env production`，注入必要 VARS；
8. 同步 Secrets（可选）：`SYNC_PRODUCTION_SECRETS=true` 时写入 Worker Secrets；
9. 健康检查：`/api/health?fast=1`；
10. 版本验证：`wrangler --version`。

## 预处理脚本 `scripts/prebuild-cf.mjs`
- `pnpm run prebuild:cf` 会在 Cloudflare 构建前自动执行；
- 该脚本默认：
  - 同步本地 D1 迁移（`--local`）；
  - 如显式开启 `CLOUDFLARE_RUN_REMOTE_MIGRATIONS=true` 且有凭据，则同步远程生产 D1 迁移（`--remote`）。

## 自检
- 修改 `wrangler.jsonc` 后运行 `pnpm run cf-typegen` 保持类型一致；
- 本地变更时先验证 `pnpm run db:migrate:local` 与 `pnpm run build:cf`；
- 如需进一步诊断，调用 `wrangler tail` 观察日志。

