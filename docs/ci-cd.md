# CI/CD 总览

> 本文描述 CI/CD 流水线的结构、权限、质量闸门与依赖。详情见 `.github/workflows/`。

## 1. 流程概览
```
Push/PR → CI (Biome + tsc + Vitest + build)
         → Deploy（复用 CI 作为质量门）
         → Production Deploy（main）
         → 备份 → 迁移 → 部署 → 健康检查
```

## 2. 工作流一览
| Workflow | 触发 | 主要动作 | 权限 |
| --- | --- | --- | --- |
| `ci.yml` | PR / Push（非 main）、手动、可被复用 | pnpm install、Biome、tsc、Vitest（覆盖率）、Next build | `contents: read` |
| `deploy.yml` | Push main、手动 | 复用 CI 作为质量门；OpenNext 构建；Wrangler 生产部署；D1 迁移；健康检查 | 继承 secrets；job 内使用 `wrangler` |

## 3. CI 质量门
- `concurrency: ci-${ref}` 避免重复运行；
- 缓存：pnpm（`actions/setup-node` cache）、`.next/cache`；
- 步骤：
  1) `pnpm run fix:i18n` + diff 校验；
  2) `pnpm exec biome check .`；
  3) `pnpm exec tsc --noEmit`；
  4) `pnpm exec vitest run --coverage`（产出 json-summary，失败时带诊断输出）；
  5) `pnpm build`；
- 打印 `NEXT_PUBLIC_APP_URL` 用于诊断（来自 GitHub Variables）。

## 4. Deploy 细节
- `quality-gate-reusable`：通过 `uses: ./.github/workflows/ci.yml` 复用 CI 作为前置；
- 生产：
  - 备份 D1、应用迁移并校验关键表；
  - `deploy --env production` 时注入 `VAR`（如 `CREEM_API_URL`）；
  - `SYNC_PRODUCTION_SECRETS` 控制是否同步 Secrets；
  - 健康检查调用 `/api/health?fast=1`，失败即标红；
- 所有步骤使用固定 SHA 的 Action 版本，详见工作流文件。

## 5. Secrets / Vars 需求
| 名称 | 用途 | 作用域 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Wrangler 部署、迁移、备份 | Production |
| `CLOUDFLARE_ACCOUNT_ID` | 账号 | Production |
| `BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` | 认证 | Production |
| `CLOUDFLARE_R2_URL` | 静态资源 URL | Production |
| `CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET` | 支付 | Production |
| `PRODUCTION_HEALTHCHECK_URL` | 自定义健康检查 | 可选 |
| Vars: `NEXT_PUBLIC_APP_URL`、`CREEM_API_URL_PRODUCTION` | 构建 & deploy | Production |

> 完整矩阵见 `docs/env-and-secrets.md`。

## 6. 缓存策略
- pnpm store：自动根据 `pnpm-lock.yaml`；
- `.next/cache`：构建加速；
- 若缓存损坏，可在 PR 中清理 key（修改 workflow key 或手动清缓存）。

## 7. 回滚与通知
- 工作流失败：在 GitHub Checks/Actions 日志中查看失败原因，必要时手动 rerun；
- 回滚生产：Cloudflare Dashboard 选择上一版本，或 `wrangler deploy --env production --rollback`；
- 如需外部告警（邮件/Slack），请在团队的告警系统中配置；仓库不再内置自动通知工作流。

## 8. 本地模拟
- 使用 `act` 运行 CI（部分 Cloudflare Action 不支持，可注释）；
- 手动执行部署脚本：参见 `docs/deployment/cloudflare-workers.md`。

## 9. 维护指南
- 修改工作流后请同步更新 `docs/ci-cd.md` 与对应 `docs/workflows/*.md`；
- 新增工作流时，确保 `permissions` 最小化、Action 固定 commit SHA；
- 每月检查一次工作流状态，确认依赖（Docker / Action 版本）未弃用。

---

更多细节请参考：
- `docs/workflows/ci.md`
- `docs/workflows/deploy.md`
