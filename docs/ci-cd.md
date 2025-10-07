# CI/CD 总览

> 本文描述整个 CI/CD 流水线的结构、权限、质量闸门与依赖。详情见 `.github/workflows/`。

## 1. 流程概览
```
Push/PR → CI (lint + tsc + vitest + build)
           ↘ 成功 → Deploy（质量门复用 CI）
                          ↘ Preview Deploy（PR）
                          ↘ Production Deploy（main）
                               ↘ 备份 → 迁移 → 部署 → 健康检查
失败 → Auto Fix（格式、自愈、AI） → Auto Merge Lite（白名单）
成功/失败 → Ops Notify（Tracker Issue）
```

## 2. 工作流一览
| Workflow | 触发 | 主要动作 | 权限 |
| --- | --- | --- | --- |
| `ci.yml` | PR / Push（非 main）、手动、可被调用 | pnpm install → Biome → tsc → Vitest → Next build | `contents: read` |
| `deploy.yml` | Push main、PR to main、手动 | 复用 CI → 构建 OpenNext → Wrangler 预览/生产部署 → D1 迁移 → 健康检查 | inherits secrets; 按 job 使用 `wrangler` |
| `auto-fix.yml` | CI / Deploy 失败时、手动 | 依赖恢复、自愈格式、AI 修复、Rolling PR | `contents: write`、`pull-requests: write` |
| `ops-notify.yml` | CI / Deploy 结束、手动 | 失败时汇总日志、更新 Tracker Issue；成功时关闭 | `issues: write` |
| `auto-merge-lite.yml` | PR 事件、手动 | 白名单文件（锁、summary）自动合并 | `contents/pull-requests: write` |

## 3. CI 质量门
- 采用 `concurrency: ci-${ref}`，避免重复运行
- 缓存：
  - pnpm (`actions/setup-node` cache)
  - `.next/cache`（构建加速）
- 步骤：
  1. `pnpm run fix:i18n` + diff 校验（高频失败项自动提示）
  2. `pnpm exec biome check .`
  3. `pnpm exec tsc --noEmit`
  4. `pnpm test`
  5. `pnpm build`
- 输出 `NEXT_PUBLIC_APP_URL` 用于诊断（来自 GitHub Variables）

## 4. Deploy 细节
- `quality-gate-reusable`：通过 `uses: ./.github/workflows/ci.yml` 复用 CI 作为前置。
- **Preview**：
  - 缺少 Secrets 自动跳过并输出提示
  - `pnpm preview:cf` + `wrangler d1 migrations apply --env preview`
  - 生成访问链接写入 Step Summary（后续可增加评论机器人）
- **Production**：
  - 备份 D1 → 迁移 → 校验关键表
  - `deploy --env production` 时注入 `VAR`（如 `CREEM_API_URL`）
  - `SYNC_PRODUCTION_SECRETS` 控制是否同步 Secrets
  - 健康检查调用 `/api/health?fast=1`，失败即标红
- 所有步骤使用固定 SHA 的 Action 版本，详见工作流文件。

## 5. Secrets / Vars 需求
| 名称 | 用途 | 作用域 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Wrangler 部署、迁移、备份 | Preview + Production |
| `CLOUDFLARE_ACCOUNT_ID` | 账号 | Preview + Production |
| `BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` | 认证 | Preview + Production |
| `CLOUDFLARE_R2_URL` | 静态资源 URL | Preview + Production |
| `CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET` | 支付 | Preview + Production |
| `OPENAI_API_KEY` | Auto fix AI | 可选（auto-fix.yml） |
| `PRODUCTION_HEALTHCHECK_URL` | 自定义健康检查 | 可选 |
| Vars: `NEXT_PUBLIC_APP_URL`、`CREEM_API_URL[_PRODUCTION]` | 构建 & deploy | 各环境 |

> 完整矩阵见 [`docs/env-and-secrets.md`](env-and-secrets.md)。

## 6. 缓存策略
- pnpm store：自动根据 `pnpm-lock.yaml`。
- `.next/cache` + `.open-next`：部署和 preview 共用版本哈希。
- 若缓存损坏，可在 PR 中清空 key（修改 workflow key 或手动清缓存）。

## 7. 回滚与通知
- 工作流失败 → `auto-fix` 与 `ops-notify` 自动触发，Rolling PR/Tracker Issue 协助排错。
- 需要回滚生产：在 Cloudflare Dashboard 选择上一版本，或 `wrangler deploy --env production --rollback`.
- 失败/成功都会在 Tracker Issue 留痕，方便审计。

## 8. 本地模拟
- 使用 `act` 运行 CI（部分 Cloudflare Action 不支持，需注释）。
- 手动执行部署脚本：参考 [`docs/deployment/cloudflare-workers.md`](deployment/cloudflare-workers.md)。
- 若要调试 auto-fix，需提供 `GITHUB_TOKEN` 并配置 `OPENAI_API_KEY`。

## 9. 维护指南
- 修改工作流后请同步更新 `docs/ci-cd.md` 与对应 `docs/workflows/*.md`。
- 新增工作流时，确保 `permissions` 最小化、Action 固定到 commit SHA。
- 每月检查一次工作流状态，确认依赖的 Docker / Action 版本未弃用。

---

更多细节请参考下列拆解文档：
- [`docs/workflows/ci.md`](workflows/ci.md)
- [`docs/workflows/deploy.md`](workflows/deploy.md)
- [`docs/workflows/auto-fix.md`](workflows/auto-fix.md)
- [`docs/workflows/ops-notify.md`](workflows/ops-notify.md)
- [`docs/workflows/auto-merge-lite.md`](workflows/auto-merge-lite.md)
