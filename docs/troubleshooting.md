# 故障排查手册

> 汇总常见错误与解决步骤。遇到新问题时，请补充本手册并在 PR 中引用。

## 1. GitHub Actions / YAML
- **错误**：`Invalid workflow file` / `mapping values are not allowed`  
  **处理**：检查缩进，统一使用空格；运行 `pnpm exec biome format` 自动修复。
- **错误**：`/bin/bash^M: bad interpreter`  
  **处理**：文件存在 CRLF，执行 `pnpm exec biome format` 或 `git config core.autocrlf false` 后重新提交。
- **错误**：未固定 Action 版本  
  **处理**：所有第三方 Action 必须使用 commit SHA，并在 `docs/security.md` 记录升级信息。

## 2. pnpm / 依赖
- `ERR_PNPM_OUTDATED_LOCKFILE`：运行 `pnpm install --no-frozen-lockfile`，确认 `pnpm-lock.yaml` 已提交最新版本。
- `UND_ERR_CONNECT` / `ETIMEDOUT`：网络不稳定，重试或使用公司代理；CI 中可切换到 `pnpm dedupe`。
- 原生依赖编译失败：确保已执行 `pnpm rebuild better-sqlite3`（D1 内存数据库测试需要）。

## 3. D1 数据库
- `database is locked`（本地）：停止其他 `wrangler dev` 实例，删除 `.wrangler/state` 后重新运行 `pnpm db:migrate:local`。
- `no such table`：确认对应环境执行过 `pnpm db:migrate:*`，并检查迁移是否遗漏提交。
- `AuthenticationError`：Cloudflare API Token 权限不足，需包含 `Account.Access:D1:Edit/Read`。
- 数据损坏或回滚：参考 `docs/db-d1.md` 使用导出文件恢复，或在生产中执行 `wrangler d1 export` 回滚备份。

## 4. Cloudflare 配置不同步
- 修改了 `wrangler.jsonc` / `.dev.vars.example` / 工作流后，CI Step Summary 提示未同步：请更新相关文档并重新运行。
- `wrangler dev` 未读取变量：确认 `.dev.vars` 存在，或使用 `wrangler secret put` 注入。
- `pnpm cf-typegen` 未执行：新增绑定后必须运行，确保 `cloudflare-env.d.ts` 与 Worker 定义一致。

## 5. 权限与认证
- 管理后台 403：检查 `.dev.vars` 中的 `ADMIN_ALLOWED_EMAILS` / `ADMIN_ENTRY_TOKEN` 是否覆盖当前账号。
- OAuth 失败：确保 `BETTER_AUTH_URL` 与实际访问域名一致（生产必须使用 HTTPS）。
- `GitHub auto merge` 无法启用：仓库未开启自动合并，请按常规流程评审并手动合并。

## 6. 前端/运行时错误
- `Request is not defined`（测试环境）：在 Vitest 中 mock Workers API 或在 `vitest.setup.ts` 添加 polyfill。
- `Invariant: attempted to call ... during render`：确认 Server Action 在客户端组件中调用方式是否正确，必要时封装成 `use server` 函数。
- `fetch failed`：检查外部服务（Creem）是否可访问，必要时降级或在健康检查中关闭强制要求。

## 7. 文档与流程
- CI 提示文档未更新：若改动配置、迁移或自动化，请同步更新相关文档（`docs/`、`README.md`）并在 PR 中说明。
- `auto-fix` PR 未通过：查看 `auto-fix-summary.md`，本地执行 `pnpm run fix:i18n` / `pnpm lint` 后重新推送。

---

若问题涉及生产，请在 Issue/PR 中引用本手册条目并记录最终解决方案，便于后续迭代与巡检。
