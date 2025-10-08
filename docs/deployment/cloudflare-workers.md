# Cloudflare Workers 部署手册

> 说明生产环境的部署流程、健康检查、数据库策略与回滚方法。对应工作流位于 `.github/workflows/deploy.yml`。

## 1. 流程总览
部署顺序：Checkout → 安装依赖 → `pnpm run build`（诊断）→ `pnpm run build:cf` → 备份 D1 → 应用迁移 → `wrangler deploy` → 同步 Secrets（可选）→ `/api/health?fast=1`。

- **构建**：`@opennextjs/cloudflare build` 生成 `.open-next` Worker 产物。
- **部署**：`wrangler deploy --env production`，附带 `--var` 注入运行时变量。
- **健康检查**：`curl /api/health?fast=1`，确保绑定与环境变量生效。
- **日志**：通过 `wrangler tail` 或 Cloudflare Dashboard 追踪。

## 2. 部署前检查
1. `pnpm lint`、`pnpm test` 本地通过（CI 亦会执行）。
2. 若改动数据库，确认迁移已生成并在本地执行过 `pnpm db:migrate:local`。
3. Secrets / Variables 已在 GitHub Actions 与 Cloudflare 中更新。
4. 变更绑定后执行 `pnpm cf-typegen`，提交 `cloudflare-env.d.ts`。
5. 检查 `NEXT_PUBLIC_APP_URL` 是否指向真实域名（生产禁止 localhost）。
6. `docs/deployment/cloudflare-workers.md`、`docs/env-and-secrets.md` 是否已同步更新流程与矩阵。

## 3. 触发方式
- 推送到 `main`（忽略纯文档变更）。
- GitHub 手动运行 `Deploy Next.js App to Cloudflare`，选择 `production` 目标。
- 本地调试：`pnpm deploy:cf`（需要 Cloudflare 登录与必要 Secrets）。

## 4. 健康检查策略
- 默认 `fast` 模式校验：环境变量、R2 绑定、`NEXT_PUBLIC_APP_URL` 解析。
- 严格模式 `/api/health` 额外验证 D1 查询、外部服务（Creem），并根据环境变量 `HEALTH_REQUIRE_DB/R2/EXTERNAL` 决定是否阻断。
- 推荐命令：
  ```bash
  curl -fsS --retry 3 --retry-all-errors --retry-delay 5 \
    --connect-timeout 5 --max-time 20 \
    "https://<domain>/api/health?fast=1"
  ```
- 若健康检查失败，部署会返回非 0，需查看 Worker 日志或 Secrets 配置。

## 5. 数据库策略
1. 部署前自动执行 `wrangler d1 export`，生成 `backup_prod_<timestamp>.sql` 并上传为 artifact（保留 14 天）。
2. 迁移步骤：
   ```bash
   wrangler d1 migrations apply next-cf-app --env production --remote
   wrangler d1 migrations list next-cf-app --env production --remote
   wrangler d1 execute next-cf-app --env production --remote \
     --command "SELECT name FROM sqlite_master WHERE type='table' AND name='site_settings';"
   ```
3. 新增迁移后务必在 PR 描述附上执行说明，并确保本地 / 远程均验证通过。

## 6. 回滚流程
1. 立即停止自动化：关闭正在运行的 Deploy workflow 或阻止进一步推送。
2. 使用 `wrangler deploy --env production --rollback <deployment-id>` 回滚代码。
3. 如需恢复数据库，下载最近的 `backup_prod_*.sql`，执行 `wrangler d1 execute ... --file` 进行恢复或手动导入。
4. 在 `release.md` 与相关 Issue 中记录事故、恢复步骤与后续改进。

## 7. 日志与可观测性
- `wrangler tail next-cf-app --env production`：实时 Worker 日志。
- Cloudflare Dashboard → Workers → Deployments：查看历史版本与流量图。
- D1 Insights / Logs：检查慢查询或失败。
- 若启用 Sentry/Logpush，请在 `docs/health-and-observability.md` 中同步说明。

## 8. 权限与 Secrets
- 必须的 GitHub Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`CLOUDFLARE_R2_URL`、`CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET`、`OPENAI_API_KEY`（若启用 AI）。
- 可选 Vars：`NEXT_PUBLIC_APP_URL`、`CREEM_API_URL_PRODUCTION`、`PRODUCTION_HEALTHCHECK_URL`、`SYNC_PRODUCTION_SECRETS`、`TRANSLATION_PROVIDER`、`OPENAI_BASE_URL`。
- `SYNC_PRODUCTION_SECRETS='true'` 时，会调用 `wrangler secret put` 同步 Secrets 到 Workers，请确保本地/生产口令一致。

## 9. 审阅清单
- [ ] PR 描述列出部署影响、数据库迁移与文档更新。
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` 结果已附上。
- [ ] 新增或修改的 Secrets / Vars 已在 PR 中标记，并在 GitHub 设置完成配置。
- [ ] 必要的健康检查步骤（登录、CRUD、支付回调等）已在 `docs/health-and-observability.md` 更新。
- [ ] 部署后执行 `curl /api/health?fast=1` 并将结果附在评论或 Issue 中。

---

部署策略如有调整，请在合并前更新本文与 `docs/workflows/deploy.md`，保持 Runbook 与自动化流程一致。
