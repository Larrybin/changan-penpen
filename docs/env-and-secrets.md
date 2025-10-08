# 环境变量与密钥管理（Env & Secrets）

> 目标：明确每个变量的用途、存放位置、维护责任与变更流程。适用于本地开发、CI 以及 Cloudflare 运行环境。

## 1. 核心变量矩阵
| 变量 | 用途 | 本地（.dev.vars） | CI / 生产 | 责任人 |
| --- | --- | --- | --- | --- |
| `NEXTJS_ENV` | 区分环境（development/production） | ✅ | 自动注入 | 后端 |
| `NEXT_PUBLIC_APP_URL` | 站点基准 URL、SEO、健康检查 | ✅（默认 `http://localhost:3000`） | GitHub Vars（生产禁止 localhost） | 前端 / 平台 |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler 调用所需账号 | ✅ | GitHub Secret | DevOps |
| `CLOUDFLARE_API_TOKEN` | 部署、迁移、Logtail 等操作 | ✅（可空，使用 `wrangler login`） | GitHub Secret / Wrangler Secret | DevOps |
| `CLOUDFLARE_D1_TOKEN` | Drizzle CLI 访问 D1 | ✅ | GitHub Secret（CI 迁移） | 数据库 |
| `next_cf_app`（绑定） | D1 数据库 | `wrangler.jsonc` / 自动 | Wrangler 绑定 | DevOps |
| `next_cf_app_bucket`（绑定） | R2 对象存储 | 同上 | Wrangler 绑定 | DevOps |
| `AI`（绑定） | Workers AI | 可选 | Wrangler 绑定 | 平台 |
| `BETTER_AUTH_SECRET` | Session 签名密钥 | ✅ | GitHub Secret / Wrangler Secret | 后端 |
| `BETTER_AUTH_URL` | Auth 回调地址 | ✅ | GitHub Vars（生产为正式域名） | 后端 |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth 凭证 | ✅（可选） | GitHub Secret / Wrangler Secret | 后端 |
| `CREEM_API_URL` | 支付 API 基础地址 | ✅（默认 https://api.creem.dev） | GitHub Vars（生产填写正式地址） | 业务 |
| `CREEM_API_KEY` | 支付鉴权 | ✅ | GitHub Secret / Wrangler Secret | 业务 |
| `CREEM_WEBHOOK_SECRET` | 支付回调签名 | ✅ | GitHub Secret / Wrangler Secret | 业务 |
| `CREEM_SUCCESS_URL` / `CREEM_CANCEL_URL` | 支付完成/取消跳转 | ✅ | GitHub Vars | 业务 |
| `CLOUDFLARE_R2_URL` | 公共访问或内部回源 URL | ✅ | GitHub Vars / Secret | DevOps |
| `TRANSLATION_PROVIDER` | 文案翻译供应商（`gemini`/`openai`） | ✅ | GitHub Vars | 本地化 |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Gemini 翻译配置 | ✅（按需） | GitHub Secret / Vars | 本地化 |
| `OPENAI_API_KEY` / `OPENAI_TRANSLATION_MODEL` / `OPENAI_BASE_URL` | OpenAI 翻译配置 | ✅（按需） | GitHub Secret / Vars | 本地化 |
| `ADMIN_ALLOWED_EMAILS` | 管理后台白名单（逗号分隔） | ✅ | Wrangler Secret | 产品 |
| `ADMIN_ENTRY_TOKEN` | 管理后台额外口令 | ✅ | Wrangler Secret | 产品 |
| `HEALTH_REQUIRE_DB/R2/EXTERNAL` | 严格健康检查开关 | 可选 | Wrangler Vars / Secrets | 平台 |

> ✅ 表示推荐填写；空白表示默认无需配置或由脚本生成。

## 2. 变更流程
1. 更新 `.dev.vars.example`，确保示例值与注释同步。
2. 在本地 `.dev.vars` 验证新变量是否生效。
3. 若涉及 Cloudflare 绑定，修改 `wrangler.jsonc` 后执行：
   ```bash
   pnpm cf-typegen
   git add cloudflare-env.d.ts worker-configuration.d.ts
   ```
4. 在 PR 描述中列出新增/修改的变量及用途，提醒 DevOps 同步 GitHub Secrets / Vars。
5. 合并后运行 `pnpm run cf:secret <NAME>`（如需手动同步到 Cloudflare 环境）。
6. 在 `docs-maintenance.md` 记录变更，便于巡检。

## 3. 轮换策略
- 安全类密钥（Auth、API Token）至少每 90 天轮换一次；人员变动或权限调整时立即轮换。
- 轮换步骤：生成新值 → 更新 Secrets / Vars → 运行 `pnpm cf-typegen`（如绑定有变化）→ 手动或通过工作流触发部署。
- 在 `release.md` 的“运维记录”或专门 Issue 中记载轮换时间与责任人。

## 4. 常见问题
- **CI 报错 Missing secrets**：检查 Deploy workflow 日志，按提示在仓库 Settings 中补齐。
- **`wrangler dev` 读取不到变量**：确认 `.dev.vars` 已创建，或执行 `wrangler secret put`，必要时重启终端。
- **类型不匹配**：忘记运行 `pnpm cf-typegen`，导致 `cloudflare-env.d.ts` 未更新。
- **生产使用 localhost**：`NEXT_PUBLIC_APP_URL` 必须指向正式域名；部署流程会主动阻断。

## 5. 记录与审计
- 所有环境变量调整必须在 PR 中说明来源与范围。
- 建议按月核对 GitHub Secrets 与 Cloudflare Dashboard 的配置，参照 `docs-maintenance.md`。
- 严禁在仓库提交真实凭证，`.dev.vars` 已列入 `.gitignore`，请勿通过其他文件泄露。

---

新增环境或绑定时，请同步更新此表格、`docs/deployment/cloudflare-workers.md` 与 `docs/architecture-overview.md`，保持文档一致。
