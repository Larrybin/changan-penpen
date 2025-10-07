# 故障排查手册

> 收集常见错误与修复步骤，遇到新问题时请补充本手册并在 PR 中引用。

## 1. GitHub Actions / YAML
- **症状**：`Invalid workflow file`、`mapping values are not allowed`
  - 检查缩进是否为空格（禁用 Tab）
  - 使用 LF 换行（可运行 `pnpm exec biome format` 自动修正）
- **症状**：`/bin/bash^M: bad interpreter`
  - Windows CRLF 换行导致，执行 `pnpm exec biome format` 或 `git config core.autocrlf false`
- **Action 未固定 SHA**：必须使用 `owner/repo@<commit>`，否则安全检查不通过（记录在 `docs/security.md`）

## 2. pnpm / 依赖
- `ERR_PNPM_OUTDATED_LOCKFILE`：运行 `pnpm install --no-frozen-lockfile`，提交更新后的 `pnpm-lock.yaml`
- `UND_ERR_CONNECT / ETIMEDOUT`：网络抖动，重试或使用公司代理；CI 中 `auto-fix` 会尝试 `pnpm dedupe`
- 版本冲突：检查 `pnpm overrides`（在 `package.json`），避免私下升级 breaking 依赖

## 3. D1 数据库
- `database is locked`（本地）：停止其他 `wrangler dev` 实例，删除 `.wrangler/state`，重新 `pnpm db:migrate:local`
- `no such table`：确认是否执行了对应环境的 `pnpm db:migrate:*`
- 远程迁移失败 `AuthenticationError`：检查 API Token 是否含 `Account - D1:Edit/Read`
- 数据损坏：使用 `docs/db-d1.md` 的备份恢复流程

## 4. Cloudflare 文档 → 工作流不同步
- 修改 `wrangler.jsonc`、`workflows/*` 或 `.dev.vars.example` 后，CI 会在 Step Summary 提示同步文档
- 如果忘记更新，Review 时请补齐 `docs/deployment/cloudflare-workers.md`、`docs/env-and-secrets.md` 等

## 5. 权限/认证
- 管理后台返回 403：检查 `.dev.vars` 中 `ADMIN_ALLOWED_EMAILS` 是否包含当前账号
- OAuth 失败：确认 `BETTER_AUTH_URL` 与实际请求域名一致（预览环境需要 `workers.dev` 域）
- GitHub auto merge 无法启用：仓库未开启自动合并，`auto-merge-lite` 会作为替代

## 6. 健康检查失败
- `/api/health` 返回 503：
  - 先查看 `checks` 字段哪个为 `ok=false`
  - 若缺少 env/binding → 检查 `wrangler secret put` 是否同步
  - R2 错误：`wrangler r2 object list ...` 验证权限
  - 外部服务（Creem）失败：检查 `CREEM_API_URL`、`CREEM_API_KEY`
- `curl` 超时：确认 Cloudflare 部署是否完成（等待 1~2 分钟），必要时 `wrangler tail`

## 7. 文档生成/格式
- `markdown-link-check` 报错：链接缺失或需要 ignore，请在 `docs-maintenance.md` 中登记例外
- `cspell` 拼写：更新词典或在文中标注 `<spell-ignore>`

## 8. Debug 工具
- `wrangler tail` 查看实时日志
- `gh run watch --exit-status` 跟踪 CI/Deploy（推荐在每次提交后执行）
- `pnpm dev:cf --inspect` + Chrome DevTools 调试边缘逻辑

## 9. 提交前 Checklist
- [ ] `pnpm lint`、`pnpm test`（如适用）通过
- [ ] 文档同步更新（尤其是环境、工作流、部署）
- [ ] 若修改 Secrets/Vars，PR 描述中说明并协调运维
- [ ] `gh run watch` 输出成功结果或注明失败原因

---

持续补充此文档，可有效降低“已知坑重复踩”的风险。遇到新问题时，优先记录触发场景、报错日志、解决步骤。
