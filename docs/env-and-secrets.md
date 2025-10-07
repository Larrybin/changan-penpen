# 环境变量与密钥管理（Env & Secrets）

> 目标：清晰知道每个变量存放在哪、谁负责维护、变更后需要做什么。适用于本地、预览、生产三套环境。

## 1. 变量矩阵

| 变量 | 作用 | 本地（.dev.vars） | 预览（GitHub / Cloudflare） | 生产（GitHub / Cloudflare） | 维护人 |
| --- | --- | --- | --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号标识 | ✅ 手动填写 | ✅ GitHub Secret | ✅ GitHub Secret | DevOps |
| `CLOUDFLARE_API_TOKEN` | Wrangler 部署 Token | 可留空（使用 CLI 登录） | ✅ GitHub Secret → Wrangler Secret | ✅ GitHub Secret → Wrangler Secret | DevOps |
| `CLOUDFLARE_D1_TOKEN` | Drizzle 迁移 Token | ✅ 手动填写 | ✅ GitHub Secret | ✅ GitHub Secret | 数据库负责人 |
| `BETTER_AUTH_SECRET` | 会话签名密钥 | ✅ 生成随机值 | ✅ GitHub Secret → Wrangler Secret | ✅ GitHub Secret → Wrangler Secret | 后端 |
| `BETTER_AUTH_URL` | Auth 回调地址 | `http://localhost:3000` | `https://<preview>.workers.dev` (vars) | 正式域名 (vars) | 后端 |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google OAuth | ✅ | ✅ GitHub Secret → Wrangler Secret | ✅ GitHub Secret → Wrangler Secret | 后端 |
| `CREEM_API_URL` | 支付 API 地址 | ✅ | ✅ GitHub Variable | ✅ GitHub Variable | 业务负责人 |
| `CREEM_API_KEY` | Creem 授权 | ✅ | ✅ GitHub Secret → Wrangler Secret | ✅ GitHub Secret → Wrangler Secret | 业务负责人 |
| `CREEM_WEBHOOK_SECRET` | Webhook 校验 | ✅ | ✅ GitHub Secret → Wrangler Secret | ✅ GitHub Secret → Wrangler Secret | 业务负责人 |
| `CREEM_SUCCESS_URL` / `CANCEL_URL` | 回调地址 | ✅ | ✅ GitHub Variable | ✅ GitHub Variable | 产品 |
| `CLOUDFLARE_R2_URL` | 对象存储访问 URL | ✅ | ✅ GitHub Variable | ✅ GitHub Variable | DevOps |
| `TRANSLATION_PROVIDER` | 翻译供应商 | ✅ | 可选（默认 gemini） | 可选 | 翻译维护人 |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | 翻译/AI Key | ✅ | 可配置 GitHub Secret（如需自动化） | ✅（如需自动修复） | AI 维护人 |
| `ADMIN_ALLOWED_EMAILS` / `ADMIN_ENTRY_TOKEN` | 管理端白名单 | ✅ | ✅ `wrangler secret put` | ✅ `wrangler secret put` | 产品/运维 |

> ✅ 代表必须配置。GitHub Secret 会通过工作流写入 `wrangler secret put`，而 GitHub Variable 会在工作流中作为 `env` 注入。

## 2. 变更流程
1. 调整 `.dev.vars.example` → 确保示例值与注释同步。
2. 更新 `.dev.vars` 本地测试。
3. 若新增 Cloudflare binding，修改 `wrangler.jsonc` 并运行：
   ```bash
   pnpm cf-typegen
   git add cloudflare-env.d.ts worker-configuration.d.ts
   ```
4. 在 PR 中提醒 DevOps 同步 GitHub Secrets / Variables，并在合并后运行：
   ```bash
   pnpm run cf:secret <NAME>    # 交互式写入 Wrangler Secret
   ```
5. 记录在 `docs-maintenance.md` 的“变更日志”段落。

## 3. 轮换策略
- **周期**：至少每 90 天轮换一次敏感密钥（Auth、API Token）。
- **触发**：人员离职、权限变更、资源升级时必须轮换。
- **执行**：先在 Cloudflare / 第三方生成新密钥 → 更新 GitHub Secret → 运行 `pnpm cf-typegen`（如有 binding 变化）→ 触发 `Deploy`（preview + production）。
- **留痕**：在 PR 描述中附上轮换记录，并在 `release.md` 的“运维记录”添加条目。

## 4. 常见问题
- **CI 提示缺少变量**：检查 GitHub Actions 日志中 `Required secret missing`，补齐后重新运行工作流。
- **`wrangler dev` 找不到变量**：确认是否写入 `.dev.vars` 或通过 `wrangler secret put`；如果是在 preview 环境，需加上 `--env preview`。
- **`cf-typegen` 未更新**：若新增绑定但未运行 `pnpm cf-typegen`，TypeScript 无法感知新字段，导致编译失败。

## 5. 审计与记录
- 所有环境变量改动需在 PR 描述中说明来源、用途、影响范围。
- 建议使用 `docs-maintenance.md` 中的 Checklist 每月核对 GitHub Secrets 与实际 Cloudflare Dashboard 配置。
- 敏感信息禁止写入仓库；`.dev.vars` 已列入 `.gitignore`，请勿通过其他文件泄露。

---

如需新增环境，请扩展本矩阵，并在 `docs/00-index.md` 中同步链接。
