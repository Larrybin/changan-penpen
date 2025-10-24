# Deploy Workflow

> Reference for CI/CD deployment to Cloudflare Workers via OpenNext.

## Triggers
- Push to `main`
- Pull requests targeting `main`
- Manual dispatch with commit SHA or tag

## Steps (high level)
1. `changes` Job 判定 docs-only, `quality-gate-reusable` 复用 `ci.yml`
2. `package-artifacts`
   - Checkout → `./.github/actions/load-workflow-config`
   - 若可下载同一 commit 的 `next-build` Artifact, 则解压复用；否则本地运行 `pnpm build`
   - `pnpm run cf-typegen` + `pnpm run build:cf` 产出 `.open-next`
   - 打包为 `open-next-bundle` Artifact 供后续 Job 下载
3. `database-prep`
   - 导出 D1 备份、上传 Artifact (14 天保留)
   - 执行 `d1 migrations apply/list` 与核心表校验
4. `deploy-production`
   - 再次 Checkout + 安装依赖 (确保 `pnpm exec wrangler` 可用)
   - 加载 `config/workflow-config.json`，根据 JSON 校验/同步 Secrets
   - 下载 `open-next-bundle`，解压后调用 `wrangler deploy --env production`
   - 动态健康检查（支持 `vars.DEPLOY_HEALTH_INITIAL_DELAY` 调整起始等待、`vars.DEPLOY_HEALTH_RETRIES` 等控制重试）
   - 健康检查失败时若配置了 SMTP 与收件人（`secrets.DEPLOY_ALERT_SMTP_*` + `vars.DEPLOY_ALERT_RECIPIENTS`）会发送邮件通知；无自动回滚
   - 输出部署审计摘要并写入环境注释

## Rollback
- `wrangler deploy --rollback`
- Restore D1 backups if schema changed（部署前已自动上传最新备份）

## Environment & Configuration
- Secrets 名称集中维护在 `config/workflow-config.json` → `productionSecrets` 数组，部署流程按清单校验与同步
- `config/workflow-config.json` 同时定义默认 Node/pnpm 版本，供所有工作流统一引用
- Production 仍依赖 Cloudflare Secrets；推荐使用 `pnpm cf-typegen` 同步类型定义

