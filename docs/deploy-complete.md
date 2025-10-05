# Cloudflare 部署工作流说明

该仓库使用 `.github/workflows/deploy.yml` 进行自动化部署，目前工作流包含两个主要 Job：

- **Deploy Preview**：针对 Pull Request，部署到 Cloudflare Workers 的 preview 环境。
- **Deploy Production**：针对推送到 `main` 分支的提交，部署到生产环境。

此外还存在一个 `cleanup` Job，会在前两个 Job 完成后执行收尾操作。

## 触发条件

- `pull_request` 事件（目标分支 `main`）触发 **Deploy Preview**。
- 推送到 `main` 分支触发 **Deploy Production**。
- `cleanup` Job 在任意部署 Job 结束后运行，用于释放缓存。

## 所需的 GitHub Secrets 与 Variables

工作流会读取以下 Secrets，请确保在仓库或组织层级配置：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDFLARE_R2_URL`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`

此外，工作流使用 GitHub Variables 传递 API 端点：

- `CREEM_API_URL_PREVIEW`
- `CREEM_API_URL_PRODUCTION`

> 预览 Job 会先检查上述 Secrets 是否齐全；若缺少，将跳过实际部署，但依然输出提示评论。

## Deploy Preview Job（Pull Request）

1. **Checkout & 环境准备**：拉取代码，安装 pnpm、Node.js，并缓存 `.next` / `.open-next` 目录。
2. **Secrets 检查**：脚本遍历所需 Secrets，缺失时把结果写入 `GITHUB_OUTPUT` 并在 PR 中提示。
3. **安装依赖**：执行 `pnpm install --no-frozen-lockfile`。
4. **生成 Cloudflare 类型（可选）**：仅在 Secrets 完整时运行 `pnpm run cf-typegen`，确保绑定类型与 `wrangler.jsonc` 一致。
5. **诊断构建**：执行 `pnpm run build`，用于尽早发现 Next.js 编译问题。
6. **OpenNext 构建（仅在 Secrets 可用时）**：运行 `pnpm run preview:cf` 生成 Workers 产物，并检查 `.open-next/`、`.next/` 输出。
7. **数据库迁移**：通过 `cloudflare/wrangler-action@v3` 对 preview 环境执行 `d1 migrations apply next-cf-app --env preview`。
8. **部署**：使用 Wrangler 将代码部署到 preview 环境，并注入 `CREEM_API_URL` 等变量。
9. **同步 Secrets**：调用 `wrangler secret put` 将敏感配置写入 preview 环境。
10. **PR 评论**：
    - Secrets 完整：评论部署成功并附上 preview URL。
    - Secrets 缺失：在 PR 留言说明部署被跳过。

## Deploy Production Job（main 分支）

1. **Checkout & 环境准备**：拉取代码，安装 pnpm/Node.js，并缓存 `.next/cache`。
2. **安装依赖**：执行 `pnpm install --no-frozen-lockfile`。
3. **生成 Cloudflare 类型**：在最新的 `wrangler.jsonc` 基础上运行 `pnpm run cf-typegen`。
4. **双阶段构建**：
    - `pnpm run build`（诊断构建，确保 Next.js 编译通过）。
    - `pnpm run build:cf`（生成部署到 Workers 的产物）。
5. **数据库备份**：生成时间戳文件名后，利用 Wrangler 导出 D1 数据库快照。
6. **数据库迁移**：对生产环境执行 `d1 migrations apply next-cf-app`。
7. **部署到生产**：调用 `cloudflare/wrangler-action@v3` 执行 `deploy --env production --var "CREEM_API_URL=..."`。
8. **同步生产 Secrets**：对每个敏感值运行 `wrangler secret put`，保证 Cloudflare 环境变量与 GitHub Secrets 一致。
9. **等待与校验**：休眠 10 秒后，通过 `wrangler-action --version` 进行轻量验证（可按需扩展为实际的健康检查脚本）。

## Cleanup Job

- 始终在前述 Job 完成后运行，即使部署失败也会执行。
- 当前行为是输出一条日志，可在此扩展缓存清理或通知逻辑。

## 本地验证建议

- 变更 `wrangler.jsonc` 后运行 `pnpm run cf-typegen`，保持类型同步。
- 变更数据库 Schema 后执行 `pnpm run db:migrate:local` 和 `pnpm run build:cf` 确认本地通过。
- 若需要模拟 preview 构建，可运行 `pnpm run preview:cf` 并检查 `.open-next/worker.js` 是否生成。

如需调整工作流逻辑，可直接编辑 `.github/workflows/deploy.yml`，并在 PR 上观察 preview Job 的执行情况。
