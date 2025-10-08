# 环境变量与密钥管理（Env & Secrets）
> 目标：明确每个变量存放位置、维护责任与变更流程，适用于本地和生产环境。

## 1. 变量速查（本地 / 生产）

| 变量 | 作用 | 本地（`dev.vars`） | 生产（GitHub / Cloudflare） | 维护人 |
| --- | --- | --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号标识 | 手动填写 | GitHub Secret | DevOps |
| `CLOUDFLARE_API_TOKEN` | Wrangler 部署 Token | 可留空（本地使用 CLI 登录） | GitHub Secret / Wrangler Secret | DevOps |
| `CLOUDFLARE_D1_TOKEN` | Drizzle 迁移 Token | 手动填写 | GitHub Secret | 数据库负责人 |
| `BETTER_AUTH_SECRET` | 会话签名密钥 | 生成随机值 | GitHub Secret / Wrangler Secret | 后端 |
| `BETTER_AUTH_URL` | Auth 回调地址 | `http://localhost:3000` | 正式域名（GitHub Variable） | 后端 |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google OAuth | 视需求填写 | GitHub Secret / Wrangler Secret | 后端 |
| `CREEM_API_URL` | 支付 API 地址 | 视需求填写 | GitHub Variable | 业务负责人 |
| `CREEM_API_KEY` | Creem 授权 | 视需求填写 | GitHub Secret / Wrangler Secret | 业务负责人 |
| `CREEM_WEBHOOK_SECRET` | Webhook 校验 | 视需求填写 | GitHub Secret / Wrangler Secret | 业务负责人 |
| `CREEM_SUCCESS_URL` / `CANCEL_URL` | 回调地址 | 视需求填写 | GitHub Variable | 产品 |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN，用于上报错误与性能数据 | 视需求填写 | GitHub Secret / Wrangler Secret | 观察性负责人 |
| `SENTRY_TRACES_SAMPLE_RATE` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Tracing 采样率 | 默认 0.1 / 0.05 | GitHub Variable | 观察性负责人 |
| `SENTRY_PROFILES_SAMPLE_RATE` | Profiler 采样率 | 默认 0 | GitHub Variable | 观察性负责人 |
| `CLOUDFLARE_R2_URL` | 对象存储访问 URL | 视需求填写 | GitHub Variable | DevOps |
| `TRANSLATION_PROVIDER` | 翻译服务提供商 | 可留空（默认 gemini） | 可留空 | 翻译维护人 |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | 翻译/AI Key | 视需求填写 | 视需求配置（auto-fix/翻译等） | AI 维护人 |
| `ADMIN_ALLOWED_EMAILS` / `ADMIN_ENTRY_TOKEN` | 管理端白名单 | 视需求填写 | `wrangler secret put` | 产品/合规 |

> ✅ 表示必须配置。GitHub Secret 建议通过工作流写入；GitHub Variable 会在工作流中注入 `env`。

## 2. 变更流程
1. 更新 `.dev.vars.example`，确保示例值与注释保持同步。
2. 修改 `.dev.vars` 并在本地验证。
3. 如需新增 Cloudflare binding，请更新 `wrangler.jsonc` 后执行：
   ```bash
   pnpm cf-typegen
   git add cloudflare-env.d.ts worker-configuration.d.ts
   ```
4. 在 PR 中提醒 DevOps 同步 GitHub Secrets / Variables，并在合并后运行：
   ```bash
   pnpm run cf:secret <NAME>    # 交互式写入 Wrangler Secret
   ```
5. 将变更记录到 `docs-maintenance.md` 的“变更日志”章节。

## 3. 轮换策略
- 周期：至少每 90 天轮换一次关键密钥（Auth、API Token）。
- 触发：人员离职、权限调整或资源升级时立即轮换。
- 操作：先在 Cloudflare/第三方生成新密钥 → 更新 GitHub Secret → 执行 `pnpm cf-typegen`（如 binding 发生变化）→ 触发 `Deploy`。
- 记录：在 PR 描述及 `release.md` 的“运维纪要”中注明轮换情况。

## 4. 常见问题
- **CI 提示缺少变量**：检查 GitHub Actions 日志 `Required secret missing`，补齐后重新运行工作流。
- **`wrangler dev` 读不到变量**：确认 `.dev.vars` 已填写或通过 `wrangler secret put` 写入。
- **忘记执行 `cf-typegen`**：若新增 binding 但未运行生成命令，TypeScript 会缺少类型导致构建失败。

## 5. 审计与记录
- 所有环境变量变更必须在 PR 描述中说明来源、用途与影响范围。
- 建议使用 `docs-maintenance.md` 的检查清单，每月对 GitHub Secrets 与 Cloudflare Dashboard 配置进行核对。
- 禁止将真实密钥写入仓库。`.dev.vars.example` 已加入 `.gitignore`，请勿通过其他文件泄露。

---

若需新增环境或密钥，请扩展此矩阵，并在 `docs/00-index.md` 中同步索引链接。
