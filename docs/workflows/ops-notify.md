# Workflow：Ops Notify（已移除）

该工作流（`.github/workflows/ops-notify.yml`）已从仓库中移除，不再自动汇总 CI/CD 失败或维护 Tracker Issue。

推荐替代做法：
- 在 GitHub Actions Run / Checks 中查看失败步骤与日志，必要时手动 rerun；
- 需要外部告警（邮件/Slack）时，使用组织统一的告警渠道（如 ChatOps / 监控平台）配置通知；
- 在团队约定的 Issue 中记录故障排查过程与结论。
