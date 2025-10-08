# Workflow：Deploy Next.js App to Cloudflare（Production）

> 位置：`.github/workflows/deploy.yml`。负责主干生产部署，内置质量门、数据库迁移、备份与健康检查。

## 触发
- `push` 到 `main`
- `workflow_dispatch`（手动）

## 并发与复用
- `concurrency: deploy-${{ github.ref }}` 避免并行部署；
- 首个 Job `quality-gate-reusable` 直接 `uses: ./.github/workflows/ci.yml`，完全复用 CI。

## 生产部署（`deploy-production`）
1. 备份 D1：`wrangler d1 export` 并上传 Artifact（保留 14 天）；
2. 应用迁移 + 校验关键表；
3. `wrangler deploy --env production`（传入 `CREEM_API_URL`、`NEXT_PUBLIC_APP_URL` 等）；
4. 可选同步 Secrets：由 `vars.SYNC_PRODUCTION_SECRETS` 控制；
5. 等待 45s 后执行健康检查：`curl /api/health?fast=1`。

## Secrets / Vars
- 参见 `docs/env-and-secrets.md` 中的矩阵；
- 额外变量：
  - `PRODUCTION_HEALTHCHECK_URL`（可选，覆盖默认 URL）；
  - `SYNC_PRODUCTION_SECRETS`（var，字符串 `'true'` 时启用 secret sync）；
  - `CREEM_API_URL_PRODUCTION`（var，生产专用）。

## 权限
- 默认使用 `GITHUB_TOKEN` + Cloudflare API Token（需 `Workers`, `D1`, `R2` 权限）；
- 上传 Artifact：`actions/upload-artifact`；
- 所有 Action 均锁定 commit SHA，保证重复构建一致。

## 常见失败项
| 步骤 | 指标 | 修复 |
| --- | --- | --- |
| Secret 检查 | Step 输出 `Missing secrets` | 补齐 GitHub Secrets |
| Migrations | `wrangler` 命令非 0 | 检查 SQL / Token 权限 |
| 健康检查 | `curl` 返回非 200 | 查看部署日志/`/api/health` JSON |
| Build | `pnpm build:cf` 失败 | 先在本地跑通 `pnpm build:cf` |

## 回滚
- 部署失败 → workflow 终止 → 触发 `ops-notify`；
- 可在 Cloudflare Dashboard → Workers → Deployments 选择历史版本回滚；
- 数据库使用备份文件 `backup_prod_<timestamp>.sql`。

## 扩展建议
- 可加入 Canary 步骤（按标签部署部分流量）；
- 需要多环境时扩展 `env.<name>` 节点与 CLI flags；
- 若开启 Playwright/合成监控，在生产部署后追加 job。

---

修改部署流程时，请同步更新 `docs/deployment/cloudflare-workers.md` 与本文件，确保文档与工作流一致。
