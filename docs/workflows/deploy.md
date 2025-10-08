# Workflow：Deploy Next.js App to Cloudflare（Production）

> 位置：`.github/workflows/deploy.yml`。适用于生产分支的自动化部署，负责数据库迁移、静态资源构建与健康检查。

## 触发
- 推送到 `main`
- `workflow_dispatch`（手动触发）

## 并发与复用
- `concurrency: deploy-${{ github.ref }}` 防止同一分支的部署并行执行。
- 首个 Job `quality-gate-reusable` 直接 `uses: ./.github/workflows/ci.yml`，完整复用 CI 质量门。

## 生产部署 Job（`deploy-production`）
1. 备份 D1：`wrangler d1 export` 并上传 Artifact（保留 14 天）。
2. 执行构建与关键检查。
3. `wrangler deploy --env production`（注入 `CREEM_API_URL`、`NEXT_PUBLIC_APP_URL` 等变量）。
4. 可选同步 Secrets：由 `vars.SYNC_PRODUCTION_SECRETS` 控制。
5. 等待 45s 后执行健康检查：`curl /api/health?fast=1`。

## Secrets / Vars
- 详见 `docs/env-and-secrets.md`。
- 额外变量：
  - `PRODUCTION_HEALTHCHECK_URL`（可选，自定义健康检查 URL）。
  - `SYNC_PRODUCTION_SECRETS`（Var，字符串 `'true'` 时开启 secret sync）。
  - `CREEM_API_URL_PRODUCTION`（Var，生产专用）。

## 权限
- 默认使用 `GITHUB_TOKEN` + Cloudflare API Token（需 `Workers`, `D1`, `R2` 权限）。
- 上传 Artifact：`actions/upload-artifact`。
- 所有 Action 必须锁定到具体 commit SHA 以保证可重复性。

## 常见失败项
| 场景 | 指标 | 修复 |
| --- | --- | --- |
| Secret 缺失 | Step 输出 `Missing secrets` | 补全 GitHub Secrets |
| Migrations 失败 | `wrangler` 命令返回非 0 | 检查 SQL / Token 权限 |
| 健康检查失败 | `curl` 返回非 200 | 查看部署日志或直接访问 `/api/health` JSON |
| 构建失败 | `pnpm build:cf` 报错 | 先在本地运行 `pnpm build:cf` 复现 |

## 回滚
- 部署失败 → workflow 终止 → 触发 Issue 通知。
- 可在 Cloudflare Dashboard → Workers → Deployments 选择历史版本回滚。
- 数据库使用备份文件 `backup_prod_<timestamp>.sql` 进行恢复。

## 拓展建议
- 可以加入 Canary 步骤（按标签部署部分流量）。
- 若需要多环境，新增 `env.<name>` 节点并配合 CLI flags。
- 如启用 Playwright/E2E，可在生产部署后追加验证 Job。

---

调整部署流程时，请同步更新本文件与 `docs/deployment/cloudflare-workers.md`，保证文档与实际操作一致。
