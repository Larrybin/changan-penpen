# 安全与权限策略

> 定义密钥管理、权限最小化、依赖安全与分支保护策略。更新安全措施时务必同步本文件。

## 1. 权限最小化
- **Cloudflare API Token**
  - 必须启用：Workers Scripts (Edit)、D1 (Edit/Read)、R2 (Edit)
  - 单独为 CI 创建 Scoped Token，避免复用个人 Token
  - 存储于 GitHub Secret，禁止出现在日志中（必要时使用 `::add-mask::`）
- **GitHub Actions Permissions**
  - `ci.yml`: `contents: read`
  - `deploy.yml`: 继承 `ci` 并在 job 内使用 Secrets
  - `auto-fix`/`auto-merge-lite`：仅赋予必要的 `contents/pull-requests: write`
- **Docs Codeowner**
  - `docs/` 由 `.github/CODEOWNERS` 指向指定维护人，确保审阅

## 2. Action 固定到 SHA
- 所有第三方 Action 均使用 `@<commit>` 而非 `@vX`，降低供应链风险
- 每月巡检一次，检查是否存在安全公告或重大更新
- 升级 Action 流程：
  1. 确定新版本 commit
  2. 在分支中更新并跑 `gh run watch`
  3. 更新本文件记录版本变更（可在附件表）

## 3. Secrets 管理
- 参见 [`docs/env-and-secrets.md`](env-and-secrets.md) 的矩阵
- 轮换策略：90 天一次、人员变动时立即轮换
- 生产 Secrets 独立管理，设置 `SYNC_PRODUCTION_SECRETS` 控制自动同步
- 禁止在 `.dev.vars.example` 填写真实值，使用占位字符串

## 4. 依赖安全
- 使用 `pnpm audit` 定期扫描（可加入 CI）
- 启用 GitHub Dependabot / Security Alerts（后续配置）
- 每月评估高风险依赖，必要时加 `pnpm overrides`
- 大版本升级需在 `release.md` 记录兼容性与回滚方案

## 5. 分支保护与合并
- `main` 分支：
  - 需要 CI 通过（`ci`, `deploy`）才可合并
  - 禁止直接推送（仅合并 PR）
- Auto Merge Lite：
  - 仅合并白名单文件
  - 结合 `auto-fix` Rolling PR，确保自动化改动可控

## 6. 审计与日志
- Cloudflare：
  - 启用 Workers Analytics 与 Access Logs
  - 重要操作（部署、迁移）由 GitHub Actions 记录在 Logs + Artifacts
- GitHub：
  - `ops-notify` 维护 `CI/CD Failure Tracker` Issue，形成审计轨迹
  - 推荐启用 `GitHub Advanced Security`（如许可）

## 7. 安全事件响应
1. 即刻吊销受影响的 API Token/Secret
2. 通知团队，标记相关 Issue / Incident
3. 评估数据泄露范围，执行备份/恢复或额外验证
4. 更新本文件与 `release.md` 的安全事件章节

## 8. 后续建设
- 引入 SAST/依赖扫描（例如 `codeql-action`、`ossf/scorecard`）
- 对关键环境变量启用自动提醒（CI 中检测未同步的文档/配置）
- 规划权限矩阵表格（人员/角色 -> 资源）

---

若新增安全措施（如 WAF 规则、Access Policy、Sentry DSN），请在 PR 中说明并同步此文档。
