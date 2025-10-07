# 贡献指南

感谢你对项目的关注！为了保持高质量协作，请遵循以下流程与约定。

## 1. 开发流程
1. Fork 或直接在主仓库创建分支（命名建议 `feature/<topic>`、`fix/<issue-id>`）
2. 同步最新 `main`
3. 完成开发与本地验证（参考 [`docs/local-dev.md`](local-dev.md)）
4. 运行质量门：
   ```bash
   pnpm lint
   pnpm test            # 若有对应测试
   pnpm build           # 建议在关键改动后执行
   ```
5. 提交前更新文档（若涉及配置/部署/流程）
6. 推送后使用 `gh run watch --exit-status` 跟踪 CI / Deploy

## 2. 提交规范
- 使用 **Conventional Commits**（详见 [`docs/style-guide.md`](style-guide.md)）
- 每个 commit 保持逻辑完整，避免合并无意义的“wip”提交
- 更新 `pnpm-lock.yaml` 时与代码改动同一个 PR

## 3. Pull Request 清单
- [ ] 描述包含变更摘要、测试结果
- [ ] 引用相关 Issue / 需求单
- [ ] 若修改 Secrets/环境变量，说明同步方式
- [ ] 附上 `gh run watch` 结果或截图
- [ ] 文档同步更新（README、docs/子目录、迁移指南等）
- [ ] 若涉及数据库，列出执行的 `pnpm db:migrate:*` 命令

可选：在 PR 描述中附上截图/GIF（UI 变更）、Postman collection（API）。

## 4. Code Review 原则
- 关注正确性、安全性、可维护性、文档同步
- 小改动也建议留下一句说明，避免后续追溯困难
- Reviewer 通过 `Suggested Changes` 辅助格式/拼写修复
- 至少一名 Code Owner 审阅后方可合并

## 5. Issue 模板与讨论
- Bug：描述复现场景、预期结果、日志、影响范围
- Feature：说明业务背景、成功准则、验收方式
- 问题讨论可使用 GitHub Discussions；结论落地后写入对应文档

## 6. 测试与质量
- 新增功能尽量附带单元/组件测试（Vitest）
- 需要端到端测试时，请在 Issue/PR 中说明并记录在 `release.md`
- 若因外部限制无法编写测试，请注明原因与后续计划

## 7. 发布节奏
- Release 规范详见 [`docs/release.md`](release.md)
- 破坏性变更需在 PR/Release Notes 中显式提醒，并提供迁移指引

## 8. 沟通渠道
- 常规：PR 评论 / Issue / Slack（如有）
- 紧急情况：@ Code Owner 或运维负责人，必要时开紧急会议

---

首次贡献？欢迎在 Issue 中留言或提交 Draft PR，我们会协助你熟悉流程。谢谢你的支持！ 🎉
