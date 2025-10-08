# Workflow：CI

> 位置：`.github/workflows/ci.yml`。负责运行 Biome、TypeScript、Vitest 与 Next 构建，作为所有部署前的质量门。

## 触发
- `push` 到非 `main` 分支（忽略 `README.md`、`docs/**`）
- `pull_request` 目标为 `main`
- `workflow_dispatch`
- `workflow_call`（被 `deploy.yml` 复用）

## 权限 & 并发
- `permissions.contents: read`
- `concurrency: ci-${{ github.ref }}`（相同分支旧运行会被取消）

## 环境变量
- `NODE_VERSION=20`
- `PNPM_VERSION=9`
- `NEXT_PUBLIC_APP_URL`（来自 GitHub Vars，默认 `http://localhost:3000`）

## 步骤拆解
1. Checkout（固定 SHA 的 `actions/checkout`）
2. 安装 pnpm、Node（内置 pnpm 缓存）
3. 复用 composite action：`./.github/actions/install-and-heal`
4. 缓存 `.next/cache`
5. `pnpm run fix:i18n` + diff 校验（未规范化时阻塞）
6. `pnpm exec biome check .`
7. `pnpm exec tsc --noEmit`
8. `pnpm exec vitest run --coverage`（产出 json-summary）
9. 打印 `NEXT_PUBLIC_APP_URL`（诊断）
10. `pnpm build`

## 失败排查建议
- i18n 未规范化：本地运行 `pnpm run fix:i18n`
- Biome 报错：执行 `pnpm exec biome check . --write`
- tsc/Vitest 失败：关注日志中的导入路径或未 mock 的 D1/R2
- Build 失败：检查 OpenNext 兼容性或缺失的环境变量

## 与其他工作流的关系
- `deploy.yml` 首个 job 直接 `uses` 该工作流，避免重复维护。

## 维护提醒
- 升级 Node/PNPM 时同步更新文档与 `package.json` 的 engines（若使用）
- 若新增步骤（例如覆盖率上传），请更新 `docs/ci-cd.md` 与此文档
- 确保所有第三方 Action 固定为 commit SHA，定期巡检

---

需要调试或扩展 CI，可在本地修改后通过 `act -j build-and-test` 执行（部分 Cloudflare 步骤需跳过）。
