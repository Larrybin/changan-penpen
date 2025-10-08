# 故障排查手册

> 汇总常见错误与修复步骤，遇到新问题时请补充本手册并在 PR 中引用。

## 1. GitHub Actions / YAML
- **症状**：`Invalid workflow file`、`mapping values are not allowed`
  - 检查缩进是否为空格（禁止使用 Tab）。
  - 使用 LF 换行，可运行 `pnpm exec biome format` 自动修正。
- **症状**：`/bin/bash^M: bad interpreter`
  - Windows CRLF 换行导致，执行 `pnpm exec biome format` 或 `git config core.autocrlf false`。
- **Action 未锁定 SHA**：必须使用 `owner/repo@<commit>`，并在 `docs/security.md` 记录升级。

## 2. pnpm / 依赖
- `ERR_PNPM_OUTDATED_LOCKFILE`：运行 `pnpm install --no-frozen-lockfile` 并提交更新后的 `pnpm-lock.yaml`。
- `UND_ERR_CONNECT / ETIMEDOUT`：网络波动，重试或使用公司代理；CI 可配合 `pnpm dedupe`。
- 版本冲突：检查 `pnpm overrides`（位于 `package.json`），避免无意升级破坏性依赖。

## 3. D1 数据库
- `database is locked`（本地）：停止其他 `wrangler dev` 实例，删除 `.wrangler/state` 后重新执行 `pnpm db:migrate:local`。
- `no such table`：确认是否针对目标环境运行了 `pnpm db:migrate:*`。
- 远程迁移失败 `AuthenticationError`：核对 API Token 是否具备 `Account - D1:Edit/Read` 权限。
- 数据损坏：参考 `docs/db-d1.md` 的备份/恢复流程。

## 4. Cloudflare 配置 / 文档不同步
- 修改 `wrangler.jsonc`、`workflows/*` 或 `.dev.vars.example` 后，CI 会在 Step Summary 提醒同步文档。
- 若忘记更新，请在 Review 时补齐 `docs/deployment/cloudflare-workers.md`、`docs/env-and-secrets.md` 等文件。

## 5. 权限 / 认证
- 管理端返回 403：检查 `.dev.vars` 中的 `ADMIN_ALLOWED_EMAILS` 是否包含当前账号。
- OAuth 失败：确保 `BETTER_AUTH_URL` 与实际请求域名一致（生产域名或自定义域）。
- GitHub auto merge 无法开启：仓库未启用自动合并，请通过常规 PR 审阅流程处理。

---

若新增修复脚本或排查命令，请在对应章节补充，并在 `docs/00-index.md` 中更新索引。
