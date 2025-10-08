# Cloudflare Workers 部署手册

> 定义生产部署的标准流程、前置检查、回滚策略以及 CI 工作流入口（`.github/workflows/deploy.yml`）。

## 1. 总览
流程顺序：Checkout → Setup PNPM → Install → Build (OpenNext) → DB Migrate → Deploy → Health Check → 通知。

- **构建**：`@opennextjs/cloudflare build` 生成 `.open-next`。
- **部署**：`wrangler deploy`（使用 `--env production`）。
- **健康检查**：`/api/health?fast=1`。
- **日志**：Cloudflare Workers Dashboard 或 `wrangler tail`。

## 2. 部署前检查（手动/CI）
1. 确认 `pnpm lint`、`pnpm test`（如存在）通过。
2. 变更包含在 `src/db/schema.ts` 中的迁移已准备好。
3. 所需 Secrets/Variables 已同步到 GitHub Actions 与 Wrangler。
4. 运行 `pnpm cf-typegen`，提交更新后的 `cloudflare-env.d.ts`。
5. 准备健康检查所需的资源（R2 / D1 / AI）。

## 3. 触发方式
- 默认自动：推送到 `main`。
- 手动触发：
  ```bash
  pnpm deploy:cf                # CLI
  gh workflow run deploy.yml -f target=production
  git push origin main          # 触发默认流程
  ```

## 4. 健康检查
- 首次仅执行 fast 模式：`GET https://<domain>/api/health?fast=1`。
- Fast 模式确认：
  - Cloudflare bindings 已加载；
  - 必需环境变量存在；
  - R2 / AI 等依赖可访问（做轻量请求）。
- Strict 模式（运维/定时任务执行）：`GET https://<domain>/api/health`，会追加 D1 与外部依赖检查。
- 更多 curl 示例见 `health-and-observability.md`：
  ```bash
  curl -fsS --retry 3 --connect-timeout 2 --max-time 5 \
    "https://<domain>/api/health?fast=1"
  ```

## 5. 迁移策略
1. 生产部署前运行 `pnpm db:migrate:prod`。
2. 如引入破坏性变更，请在 `release.md` 中记录回滚 SQL 或应急方案。

## 6. 回滚流程
1. 健康检查失败 → workflow 自动标记失败并生成 Issue。
2. 手动执行 `wrangler deploy --env production --rollback <id>` 或在 Dashboard 选择历史版本。
3. 数据库回滚：使用 D1 备份（详见 `docs/db-d1.md`）。
4. 在 `release.md` 记录恢复步骤与影响时间线。

## 7. 日志与监控
- 使用 `wrangler tail next-cf-app` 查看实时日志。
- 在 Cloudflare Dashboard → Workers → Deployments 查看历史部署。
- 推荐与 Sentry / Logpush 集成，并在 `health-and-observability.md` 中登记。

## 8. 权限与安全
- GitHub Actions 需要具备以下 Token 权限：
  - `Account.Access:Workers Scripts:Edit`
  - `Account.Access:D1:Edit/Read`
  - `Account.Access:R2:Edit`
- 参见 `security.md` 了解 Token 轮换与最小权限原则。
- 避免在日志中输出敏感信息，必要时使用 `::add-mask::`。

## 9. Checklist
- [ ] PR 描述列出部署影响与对应文档。
- [ ] 如有流程变化，同步更新 `docs/deployment/cloudflare-workers.md`。
- [ ] 附上 `gh run watch` 链接或截图。
- [ ] 部署完成后验证关键路径（登录、CRUD、支付回调）。

## 10. Edge rate limiting (English update)
- **Namespace setup**: Create a Cloudflare Rate Limiting namespace (e.g. `wrangler ratelimit create creem-checkout --limit 10 --period 60`) and note the generated ID.
- **Binding**: Update `wrangler.jsonc` so both the default worker and the `production` environment attach the namespace as `RATE_LIMITER`. Deploying without the binding leaves rate limiting disabled.
- **Verification**: After deployment, hit `/api/creem/create-checkout` repeatedly with the same user session until a 429 appears, confirming the edge policy works. Use `wrangler tail` to capture the `[rate-limit]` log line for auditing.
- **Rollback**: Removing the binding or setting a larger quota in the Cloudflare Dashboard takes effect immediately. Document any temporary overrides in the release checklist.

---

如调整部署路径或健康检查策略，请同步 `docs/ci-cd.md`、`docs/workflows/deploy.md` 与 `docs-maintenance.md`，保持“文档 = 运行手册”。
