# Workflow：Auto Fix (deterministic + AI)

> 位置：`.github/workflows/auto-fix.yml`。当 CI 或 Deploy 失败时，尝试自动修复常见问题并创建 Rolling PR。

## 触发
- `workflow_run`：当 `CI` 或 `Deploy Next.js App to Cloudflare` 完成且结果非 success
- `workflow_dispatch`

## 权限与并发
- `permissions`: `contents: write`, `pull-requests: write`, `actions: read`
- `concurrency: autofix-${{ github.ref }}`，防止重复修复同一分支

## 流程拆解
1. **安装与自愈**：`pnpm install --frozen-lockfile`，失败时自动 fallback 到 `--no-frozen-lockfile` 或 `pnpm dedupe`
2. **格式化**：运行 `pnpm exec biome format --write` 与 `check --write`
3. **静态检查**：`pnpm exec tsc --noEmit`
4. **变更检测**：若有文件修改，提交至 `autofix/stable`（滚动分支）
5. **Rolling PR**：使用 `peter-evans/create-pull-request` 创建/更新 PR，并上传 `auto-fix-summary.md`
6. **白名单自动合并准备**：若仅改动 `pnpm-lock.yaml` 或 `auto-fix-summary.md`，自动添加 `auto-merge` 标签
7. **AI 修复（可选）**：若配置 `OPENAI_API_KEY`，运行 `scripts/ai-auto-fix.mjs` 生成补丁并以 Draft PR 形式提交

## 输出与通知
- `auto-fix-summary.md`：记录修复操作、日志尾部
- 上传 artifact 便于追踪
- 结合 `ops-notify.yml`，在 Tracker Issue 中链接 summary

## 限制与建议
- 不会自动推送到 feature 分支，仅维护 `autofix/stable`
- AI 修复为 draft，需人工审阅后合并
- 如需扩展白名单文件，请同步更新 `auto-merge-lite.yml` 与文档

## 常见使用场景
- Biome 格式化遗漏
- `pnpm-lock.yaml` 需更新
- 轻量 TypeScript 问题（AI 能尝试修复）

---

当新增自愈策略（例如 `pnpm lint`、测试自动修补）时，请更新本文和 `docs/ci-cd.md`，确保团队了解自动化行为。
