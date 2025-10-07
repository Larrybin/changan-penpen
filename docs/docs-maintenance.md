# 文档维护手册

> 确保文档与代码同步更新，支持自动校验与月度巡检。`docs/` 目录的 Code Owner 见 `.github/CODEOWNERS`。

## 1. 目录入口
- 主入口：[`docs/00-index.md`](00-index.md)
- README 中列出关键文档链接，保持与索引一致
- 新增文档时请更新：
  1. `docs/00-index.md`
  2. `README.md` 的 “文档地图”
  3. 如涉及特定主题（部署、安全），更新对应章节

## 2. 自动化校验

### markdown-link-check
- 配置建议：在 `.github/workflows/ci.yml` 中新增 Job 或在本地运行
- 忽略列表：在 `.mlcignore`（待创建）中记录外部临时链接
- 运行命令：
  ```bash
  npx markdown-link-check README.md
  ```

### cspell / codespell
- 可选：用于拼写、专有名词校验
- 推荐配置文件：`cspell.config.yaml`
- 运行命令：
  ```bash
  npx cspell "docs/**/*.md"
  ```
- 词典更新：将团队常用名词加入 `cspell-dictionary.txt`

> 若引入上述工具，请在 `package.json` 添加脚本并更新本文件。

## 3. 徽章维护
- README 徽章：
  - CI: `https://github.com/ifindev/fullstack-next-cloudflare/actions/workflows/ci.yml/badge.svg`
  - Deploy: 同上（`deploy.yml`）
  - Docs: 使用静态 `shields.io`，若后续新增 docs workflow 可替换
- 变更 Actions 名称时，务必同步更新徽章链接

## 4. Code Owners 与审阅
- `docs/` 的 PR 默认请求 `@ifindev` 审阅
- 若文档涉及其他团队（Ops、安全），在 PR 中手动 @ 对应负责人成对审阅
- 对重大流程（部署、安全）修改，至少 2 人 Review

## 5. 月度巡检 Checklist
1. README 链接、状态徽章是否正常
2. `docs/` 中的命令是否仍然有效（随机抽查 3 个）
3. Cloudflare 配置 / 工作流与文档是否一致
4. `docs/db-d1.md` 的备份策略是否执行
5. 记录结果于仓库 Discussions 或 Tracker Issue

## 6. PR 规范
- PR 描述包含：
  - 变更概述
  - 影响范围（Docs/Workflows/Env）
  - `gh run watch` 结果
- 若文档关联代码改动，务必在 PR 中引用相关 commit/文件，方便回溯

## 7. 版本记录
- 重大变更（部署流程、依赖升级、breaking change）统一记录在 `docs/release.md`（待补）
- 每次 release 结束后，执行以下动作：
  1. 更新 `release.md`
  2. 如有文档缺口，创建 Follow-up Issue
  3. 在 `docs-maintenance.md` 添加“版本更新速记”（可选）

---

如需引入新工具（如 Docusaurus、Docsify），请在本文件新增“发布/托管”章节，并评估所需构建脚本与自动化。
