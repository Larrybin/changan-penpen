# 常见问题（FAQ）

## Q1. 本地运行需要哪些前置条件？
- Node.js 20.x、pnpm 9.x、Cloudflare 账号；
- `cp .dev.vars.example .dev.vars` 并填入必要密钥；
- `pnpm dev`（或 `pnpm dev:cf`）；
- 详见 `docs/getting-started.md`。

## Q2. 生产部署失败并提示缺少 Secrets？
- 在仓库 Settings → Secrets and variables → Actions 补齐：
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `BETTER_AUTH_SECRET`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CLOUDFLARE_R2_URL`,
  `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`；
- 重新运行 `Deploy` 工作流，并用 `gh run watch` 查看结果。

## Q3. 如何添加新的环境变量？
1. 更新 `.dev.vars.example`；
2. 本地 `.dev.vars` 测试；
3. 更新 `wrangler.jsonc` + `pnpm cf-typegen`；
4. 在 GitHub 同步 Secrets/Vars；
5. 更新文档 `docs/env-and-secrets.md`。

## Q4. 数据库迁移如何执行？
- 本地：`pnpm db:migrate:local`；
- 生产：`pnpm db:migrate:prod`；
- 详情参阅 `docs/db-d1.md`。

## Q5. 为什么 `pnpm lint` 会修改文件？
- Biome 会自动格式化；如果不希望自动写入，可单独运行 `pnpm exec biome check .`；
- PR 前必须提交格式化后的文件。

## Q6. 是否启用了自动修复或自动合并？
- 未启用。请通过 PR 审阅并由维护者手动合并。

## Q7. 如何查看部署日志？
- `wrangler tail next-cf-app --env production`；
- Cloudflare Dashboard → Workers → Deployments；
- 在 GitHub Actions Run / Checks 中查看构建与部署日志。

## Q8. 更新依赖需要注意什么？
- 运行 `pnpm install` 或 `pnpm up` 后提交 `pnpm-lock.yaml`；
- 在 PR 中说明影响范围，并更新 `docs/security.md` 的版本矩阵（如涉及关键依赖）；
- 如果升级 OpenNext / Wrangler，请同步 `docs/opennext.md`、`docs/deployment/cloudflare-workers.md`。

## Q9. 如何处理健康检查失败？
- 调用 `/api/health` 查看 `checks` 详情；
- 根据响应修复缺失的 env/binding 或外部服务；
- 参考 `docs/health-and-observability.md` 获取排查清单。

## Q10. 想要添加新模块/页面，需要哪些步骤？
- 在 `src/modules/<feature>` 中创建子目录；
- 更新 `docs/architecture-overview.md`、`docs/api-index.md`；
- 根据需要添加路由文档、测试、迁移。

---

没有找到答案？请在 Issue 中提问或更新本页面，保持知识库鲜活。
