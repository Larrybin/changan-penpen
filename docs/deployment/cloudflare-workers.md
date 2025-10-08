# Cloudflare Workers 部署手册

> 本文定义生产部署的标准流程、质量闸门与回滚策略。CI 工作流位于 `.github/workflows/deploy.yml`。

## 1. 总览
流程顺序：`Checkout → Setup PNPM → Install → Build (OpenNext) → DB Migrate → Deploy → Health Check → 通知`

- **构建**：`@opennextjs/cloudflare build` 生成 `.open-next`
- **发布**：`wrangler deploy`（生产 `--env production`）
- **健康检查**：`/api/health?fast=1`
- **日志**：Cloudflare Workers Dashboard、`wrangler tail`

## 2. 预部署检查（手动/CI）
1. 确保 `pnpm lint`、`pnpm test`（若有）通过
2. 迁移文件与 `src/db/schema.ts` 一致
3. Secrets/Variables 已在 GitHub Actions & Wrangler 中更新
4. 运行 `pnpm cf-typegen` 后提交 `cloudflare-env.d.ts`
5. 准备健康检查所需资源（R2/D1/AI）

## 3. 触发方式
-（已移除预览部署）
- **生产**：
  ```bash
  pnpm deploy:cf                # CLI
  gh workflow run deploy.yml -f target=production
  git push origin main          # 默认触发
  ```

## 4. 健康检查
- 初始只执行 fast 模式：`GET https://<domain>/api/health?fast=1`
- Fast 模式校验：
  - Cloudflare bindings 已加载
  - 必需环境变量存在
  - R2/AI 连接就绪（轻量探测）
- Strict 模式（人工/夜间任务执行）：`/api/health`，额外检查 D1 查询、外部依赖
- 建议在 `health-and-observability.md` 中维护 curl 示例：
  ```bash
  curl -fsS --retry 3 --connect-timeout 2 --max-time 5 \
    "https://<domain>/api/health?fast=1"
  ```

## 5. 迁移策略
2. 生产部署前：`pnpm db:migrate:prod`
3. 若涉及破坏性变更，需在 `release.md` 附上回滚 SQL / 备份计划

## 6. 回滚流程
1. 健康检查失败 → 工作流自动标记失败并触发 `ops-notify`
2. 手动执行 `wrangler deploy --env production --rollback <id>` 或在 Dashboard 选择历史版本
3. 回滚数据库：使用 D1 备份（详见 `docs/db-d1.md`）
4. 在 `release.md` 记录故障时间线与采取措施

## 7. 日志与监控
- 调用 `wrangler tail next-cf-app` 实时查看日志
- Cloudflare Dashboard → Workers → Deployments 查看历史
- 建议在后续迭代接入 Sentry 或 Logpush，并在 `health-and-observability.md` 中记录

## 8. 权限与安全
- GitHub Actions 需要具有以下权限的 Token：
  - `Account.Access:Workers Scripts:Edit`
  - `Account.Access:D1:Edit/Read`
  - `Account.Access:R2:Edit`
- 在 `security.md` 中维护 Token 轮换与权限矩阵
- 禁止在工作流日志中输出敏感数据，必要时使用 `::add-mask::` 隐藏

## 9. 审核清单
- [ ] PR 描述列出部署影响与对应文档
- [ ] `docs/deployment/cloudflare-workers.md` 如有流程变动需同步更新
- [ ] 附上 `gh run watch` 截图或输出
- [ ] 部署后验证核心路径（登陆、CRUD、支付回调）

---

部署链路调整时，务必同步 `docs/ci-cd.md`、`docs/workflows/deploy.md` 与 `docs-maintenance.md`，保持“文档 → 命令”一致。
