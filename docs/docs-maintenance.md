# Docs Maintenance Guide

> Keep docs accurate and discoverable. Treat docs as the runbook.

## Ownership & Entry Points
- Primary index: `docs/00-index.md`
- Each feature may reference module docs or READMEs
- Code owners: `.github/CODEOWNERS`

## When to Update
- New workflows, modules, or env changes
- CI/CD and deployment changes
- Security/secrets rotation

## Validation
- Lint links and headings during CI (if checker is configured)
- Ensure UTF-8 and normalized LF line endings
- Preview Markdown rendering in IDE
- Local pre-push gate: 任意 `git push` 默认先执行 `pnpm check:all`，失败会阻止推送:
  - Biome 写入修复 + 最终 `pnpm exec biome check .`
  - `pnpm run cf-typegen`（仅绑定文件变更时）
  - `pnpm exec tsc --noEmit`
  - Next.js 构建（Windows 可通过 `SKIP_NEXT_BUILD=1` 跳过）
  - 可选 Vitest（设置 `CHECK_ENABLE_TESTS=1`）
  - 文档一致性 `pnpm run check:docs` 与链接校验 `pnpm run check:links`
  - 可使用 `ALLOW_DIRECT_PUSH=1` / `HUSKY_BYPASS=1` / `SKIP_PRE_PUSH_CHECK_ALL=1` 进行一次性绕过
- 如需自动提交与备份 tag，可继续使用 `pnpm push`；回滚命令不变:
  - 查看备份:`pnpm run push:rollback -- --list`
  - 打印回滚指令:`pnpm run push:rollback`
  - 直接本地回滚(危险):`ROLLBACK_APPLY=1 pnpm run push:rollback`

## Monthly Review (suggested)
- [ ] Check outdated content or broken links
- [ ] Verify workflows and env matrices match reality
- [ ] Review security and incident playbooks

## Useful Search Tips
- Prefer PowerShell 7 + UTF-8 in profile to avoid garbled output
- Grep examples (ripgrep):
  - `rg -n -F ".github/workflows/" README.md` - list workflow references in README
  - `rg -n "\\.route\\.ts$|/api/.*/route\\.ts$|/page\\.tsx$" src` - scan routes/pages
  - `rg -n -F "wrangler.toml" docs` - find env docs cross‑references
- API index suggestions: `pnpm run suggest:api-index` 打印页面/API 路由候选,便于维护 `docs/api-index.md`.

## Controls (Env Flags)
- `DOCS_SYNC=0` 跳过文档增量自修复.
- `DOCS_SYNC_SCOPE=all` 全量扫描 `docs/` 与 `README.md`.
- `DOCS_SYNC_DRY=1` 只打印变更,不写回文件(结果写入 `logs/docs-sync-changed.json`).
- `DOCS_AUTOGEN=0` 关闭锚点块自动生成.
- `DOCS_AUTOGEN_SCOPE=all` 全量重建锚点块(默认仅在源文件变更时重建).
- `DOCS_AUTOGEN_DRY=1` 仅分析,不落盘(结果写入 `logs/docs-autogen-changed.json`).
- `DOCS_AUTOGEN_THRESHOLD=<n>` 自动生成触达文件数上限(默认 30).
 - `ALLOW_FORCE_PUSH=1` 若本地已将最近一次提交推送到远端,amend 会导致非快速前进;开启此项可在推送失败时自动使用 `--force-with-lease`,否则将中止并提示手动处理.
- `DISABLE_BACKUP_TAG=1` 禁用 pre-push 备份 tag 创建.
- `AUTOFIX_THRESHOLD=<n>` 自动修复变更文件上限,默认 50.
