# Workflow：Auto Merge Lite

> 位置：`.github/workflows/auto-merge-lite.yml`。用于安全地自动合并白名单自愈 PR，暂不依赖 GitHub Auto-merge 功能。

## 触发
- `pull_request`（opened/synchronize/reopened/labeled/ready_for_review）目标 `main`
- `workflow_dispatch`（可指定 `pr_number` 手动执行）

## 权限与并发
- `permissions`: `contents: write`, `pull-requests: write`
- `concurrency: auto-merge-lite-${{ github.ref }}`，避免重复评估

## 判定逻辑
1. 仅处理以下 PR：
   - 分支名以 `autofix/` 开头，或
   - 带有 `auto-merge` 标签
2. 校验文件清单：仅允许 `pnpm-lock.yaml`、`auto-fix-summary.md`
3. 检查 `combined status`（CI / Deploy）为 success
4. 确认可合并（无冲突）
5. 使用 `merge_method: squash` 自动合并并删除分支（仅限同仓库分支）

## 使用建议
- `auto-fix` 工作流会在白名单变更时自动打上 `auto-merge` 标签
- 若希望手动触发某 PR，可使用：
  ```bash
  gh workflow run auto-merge-lite.yml -f pr_number=123
  ```
- 不满足白名单或检查失败时会直接退出（通过日志查看原因）

## 扩展/限制
- 如需支持更多文件（例如 `cloudflare-env.d.ts`），请同步更新脚本中的 `whitelist`
- 不支持强制合并带冲突的 PR
- 若仓库启用了 GitHub 原生 auto-merge，可考虑后续整合

---

修改白名单、合并策略或触发条件时，请更新本文档与 `docs/ci-cd.md`，确保 Reviewer 了解自动合并范围。
