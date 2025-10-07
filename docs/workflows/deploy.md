# Workflow：Deploy Next.js App to Cloudflare

> 位置：`.github/workflows/deploy.yml`。负责 PR 预览与主干生产部署，内置质量门、数据库迁移、备份与健康检查。

## 触发
- `push` 到 `main`
- `pull_request` → `main`
- `workflow_dispatch`（手动，可指定 `target` 在 inputs 中）

## 并发与复用
- `concurrency: deploy-${{ github.ref }}` 避免并行部署
- 首个 Job `quality-gate-reusable` 直接 `uses: ./.github/workflows/ci.yml`，完全复用 CI

## 预览部署（`deploy-preview`）
1. 检查必需 Secrets，缺失时跳过部署并给出提示
2. 缓存 `.open-next` + `.next/cache`
3. `pnpm run build`（诊断）→ `pnpm preview:cf`
4. `wrangler d1 migrations apply next-cf-app --env preview`
5. `wrangler deploy --env preview`（通过 `preview:cf` 完成）
6. 输出 `.open-next` 目录诊断信息
7. 可扩展自定义评论（未来可加入 PR 注释）

## 生产部署（`deploy-production`）
1. 备份 D1：`wrangler d1 export` 并上传 Artifact（保留 14 天）
2. 应用迁移 + 校验关键表
3. `wrangler deploy --env production`（传入 `CREEM_API_URL`、`NEXT_PUBLIC_APP_URL`）
4. 可选同步 Secrets：由 `vars.SYNC_PRODUCTION_SECRETS` 控制
5. 等待 45s 后执行健康检查 `curl /api/health?fast=1`

## Secrets / Vars
- 参见 [`docs/env-and-secrets.md`](../env-and-secrets.md) 中的矩阵
- 额外变量：
  - `PRODUCTION_HEALTHCHECK_URL`（可选，覆盖默认 URL）
  - `SYNC_PRODUCTION_SECRETS`（var，字符串 `'true'` 时启用 secret sync）
  - `CREEM_API_URL_PRODUCTION`（var，生产专用）

## 权限
- 默认使用 `GITHUB_TOKEN` + Cloudflare API Token（需 `Workers`, `D1`, `R2` 权限）
- 上传 Artifact：`actions/upload-artifact`
- 所有 Action 均锁定 commit SHA，保证重复构建一致性

## 常见失败点
| 步骤 | 指标 | 修复 |
| --- | --- | --- |
| Secret 检查 | Step 输出 `Missing secrets` | 补齐 GitHub Secrets |
| Migrations | `wrangler` 命令非 0 | 检查 SQL 或 Token 权限 |
| 健康检查 | `curl` 返回非 200 | 查看部署日志/`/api/health` JSON |
| Build | `pnpm build`/`preview:cf` 失败 | 先跑本地 `pnpm build:cf` |

## 回滚
- 部署失败后 workflow 终止 → 触发 `ops-notify`
- 可在 Cloudflare Dashboard → Workers → Deployments 选择历史版本回滚
- 数据库使用备份文件 `backup_prod_<timestamp>.sql`

## 扩展建议
- 可加入 Canary 步骤（按标签部署部分流量）
- 需要多环境时扩展 `env.<name>` 节点与 CLI flags
- 若开启 Playwright/合成监控，在生产部署后追加 job

---

修改部署流程时，请同步更新 `docs/deployment/cloudflare-workers.md` 与本文件，确保文档与工作流一致。
