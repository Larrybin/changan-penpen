# Workflow：Ops Notify (Failure/Recovery)

> 位置：`.github/workflows/ops-notify.yml`。统一处理 CI/CD 失败的通知、追踪与恢复闭环。

## 触发
- `workflow_run`：监听 `CI`、`Deploy Next.js App to Cloudflare` 完成事件
- `workflow_dispatch`：可手动触发重放通知

## 权限
- `actions: read`（读取失败日志）
- `contents: read`
- `issues: write`、`pull-requests: write`（发布评论、维护 Tracker Issue）

## Job 说明
### failure
1. 收集失败的 job/step，构建 Markdown 摘要（包含 rerun/logs 链接、head commit）
2. 若有关联 PR → 在 PR 评论中贴出摘要
3. 更新/创建标题为 `CI/CD Failure Tracker` 的 Issue（label: `ci-failure`）
4. 摘要附带自动 remediation 链路：`auto-fix`（deterministic + AI）

### recovery
1. 当 workflow 成功时，找到 `CI/CD Failure Tracker` Issue
2. 添加成功评论并关闭 Issue

## 使用建议
- Reviewer 查看失败提醒时，可直接点击 `rerun` 链接
- 若频繁失败，可在 Issue 中追加排查记录，形成问题库
- 可扩展到 Slack/Webhook：在 failure job 后追加步骤即可

## 常见问题
- 未找到 Tracker：首次失败会自动创建
- 未评论 PR：确认触发事件是否来自 PR（push 到 main 不会关联 PR）
- 权限不足：确保 `GITHUB_TOKEN` 默认权限未收紧（需要 issues:write）

---

若要把通知同步到外部系统（Slack、Linear 等），请在本文件记录新增的集成方式与必要 Secrets。
