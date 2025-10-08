# 发布与回滚手册

> 记录版本管理、发布流程、变更日志与回滚策略，确保生产环境变更可追溯。

## 1. 发布节奏
- 建议按需求批次合并到 `main`，触发自动部署
- 如需人工发布，可手动运行 `Deploy` 工作流并指定 `target=production`
- 大版本（Major）需至少提前 1 天通知团队，并准备回滚方案

## 2. 发布前检查
- [ ] CI（Biome、tsc、Vitest、build）通过
 
- [ ] README / 文档更新完毕
- [ ] Secrets/Vars 最新（参考 [`docs/env-and-secrets.md`](env-and-secrets.md)）
- [ ] `docs/release.md` 更新 changelog 草稿
- [ ] 必要截图/演示准备就绪（UI 变更）

## 3. 发布流程（Production）
1. `gh workflow run deploy.yml -f target=production` 或推送到 `main`
2. 等待 `quality-gate` 完成（CI 复用）
3. 生产 job 自动执行：
   - 备份 D1
   - 迁移 & 校验关键表
   - OpenNext 构建 + Workers 部署
   - 健康检查 `/api/health?fast=1`
4. 部署成功后在 PR/Issue 中记录部署链接
5. 更新本文件的变更日志

## 4. 变更日志模板
```
## 2025-10-07
- feat: ...
- fix: ...
- docs: ...
影响：
- 数据库迁移：`20251007_add_table.sql`
- 环境变量：新增 `FOO_BAR`（生产已同步）
- 回滚命令：`wrangler deploy --env production --rollback <id>`
```

## 5. 回滚策略
- **代码回滚**：Cloudflare Dashboard → Workers → Deployments，选择上一版本；或 CLI `wrangler deploy --env production --rollback <id>`
- **数据库回滚**：
  1. 从工作流下载备份 `backup_prod_YYYYMMDD.sql`
  2. `wrangler d1 import next-cf-app --remote --file backup.sql`
  3. 记录回滚时间线、理由、影响
- **配置回滚**：使用 Cloudflare Dashboard 历史记录或重新 `wrangler secret put`

## 6. Telemetry & 验证
- 发布后验证：
  - `/api/health?fast=1`
  - 核心用户旅程（登录、创建 Todo、支付流程）
  - D1/R2 操作日志
- 可选：使用 Playwright/合成监控执行 E2E

## 7. 紧急修复（Hotfix）
- 从最新 `main` 切出 `hotfix/<issue>`，完成修复
- 走完整 CI/CD 流程，部署至生产（仍需质量门）
- 发布后在这里记录：
  ```
  ### Hotfix 2025-10-08
  - fix: ...
  - 验证：...
  - 回滚：...
  ```

## 8. 版本兼容矩阵（示例）
| 组件 | 当前版本 | 兼容性 | 备注 |
| --- | --- | --- | --- |
| Next.js | 15.4.6 | 兼容 | |
| @opennextjs/cloudflare | 1.3.0 | 兼容 | |
| Wrangler | 4.42.0 | 兼容 | Action 固定版本 |
| Drizzle | 0.44.5 | 兼容 | |

> 升级后请更新本表，并在 `release` 章节记录影响。

## 9. 文档同步
- 发布完成后：
  - 更新 `docs/00-index.md`（如有新增章节）
  - 若流程改变，修订 `docs/deployment/cloudflare-workers.md`
  - 将重要指引加入 `FAQ` / `Troubleshooting`

---

实际发布完成后，请将关键信息（版本号、日期、负责人、CI 链接）写入本文件，形成可追溯档案。
