# Cloudflare 部署工作流说明

该仓库通过 `.github/workflows/deploy.yml` 实现自动化部署，目前定义了两个主要 Job：

- **Deploy Preview**：针对 Pull Request 部署到 Cloudflare Workers 的 preview 环境。
- **Deploy Production**：当提交推送到 `main` 分支时，部署到生产环境。

工作流还包含一个 `cleanup` Job，会在任一部署 Job 完成后执行收尾清理。

## 触发条件

- `pull_request`（目标分支 `main`）触发 **Deploy Preview**。
- 推送到 `main` 触发 **Deploy Production**。
- `cleanup` Job 对两个部署 Job 设置 `needs`，始终在它们结束后执行。

## 所需 Secrets 与 Variables

请在 GitHub 仓库（或组织级）配置以下 Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDFLARE_R2_URL`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`

另外使用 GitHub Variables 传递不同环境的 Creem 接口地址：

- `CREEM_API_URL_PREVIEW`
- `CREEM_API_URL_PRODUCTION`

> Preview Job 会先检查 Secrets 是否齐全；若缺失会跳过部署并在 PR 中留下说明评论。

## Deploy Preview Job（PR）

1. **Checkout & 准备运行时**：安装 pnpm、Node.js，并缓存 `.next/`、`.open-next/`。
2. **检查 Secrets**：Shell 脚本遍历所需 Secrets，缺项时写入 `GITHUB_OUTPUT` 并结束部署。
3. **安装依赖**：`pnpm install --no-frozen-lockfile`。
4. **生成 Cloudflare 类型**（Secrets 齐全时执行 `pnpm run cf-typegen`）。
5. **诊断构建**：`pnpm run build`，提前捕获 Next.js 编译问题。
6. **OpenNext 构建**：`pnpm run preview:cf` 生成 Workers 产物，并检查输出目录。
7. **数据库迁移**：通过 `cloudflare/wrangler-action@v3` 对 preview D1 执行 `d1 migrations apply`。
8. **部署代码**：Wrangler `deploy --env preview`，同时注入 `CREEM_API_URL` 等变量。
9. **同步 Secrets**：调用 `wrangler secret put`，确保 Cloudflare preview 环境具备所有敏感配置。
10. **PR 评论**：
    - Secrets 完整：评论预览地址。
    - Secrets 缺失：说明部署被跳过及缺失项。

## Deploy Production Job（main）

1. **Checkout & 准备运行时**：同上，另缓存 `.next/cache`。
2. **依赖安装**：`pnpm install --no-frozen-lockfile`。
3. **类型生成**：执行 `pnpm run cf-typegen` 与最新 `wrangler.jsonc` 同步绑定。
4. **双阶段构建**：
   - `pnpm run build`（诊断）。
   - `pnpm run build:cf`（生成 Cloudflare 产物）。
5. **数据库备份**：使用 `wrangler-action` 导出 D1 快照，文件名带时间戳。
6. **数据库迁移**：`d1 migrations apply next-cf-app`。
7. **部署代码**：`deploy --env production --var "CREEM_API_URL=${{ vars.CREEM_API_URL_PRODUCTION }}"`。
8. **同步 Secrets**：循环调用 `wrangler secret put`，保持 Cloudflare 环境变量与 GitHub Secrets 一致。
9. **等待与验证**：暂停 10 秒后执行 `wrangler-action --version` 作为轻量验证（可扩展为实际健康检查）。

## Cleanup Job

- 设置 `needs: [deploy-production, deploy-preview]`，无论前置 Job 成功或失败都会运行。
- 当前逻辑输出一条日志，可按需扩展为清理缓存或发送通知。

## 本地验证建议

- 修改 `wrangler.jsonc` 后运行 `pnpm run cf-typegen`，同步类型文件。
- 数据库 Schema 变化时执行 `pnpm run db:migrate:local` 与 `pnpm run build:cf` 确保本地通过。
- 如需模拟 preview 构建，可运行 `pnpm run preview:cf` 并验证 `.open-next/worker.js`。

如需调整部署流程，可更新 `.github/workflows/deploy.yml`，并通过 PR 检查 Preview Job 的执行效果。
