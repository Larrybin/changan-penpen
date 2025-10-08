# 本地开发与调试指南（Local Development）

> 面向日常研发与维护人员，涵盖常用命令、调试技巧、数据库操作与常见陷阱。

## 1. 常用脚本

| 命令 | 作用 | 备注 |
| --- | --- | --- |
| `pnpm dev` | Next.js 本地开发（Node runtime） | 热更新最快 |
| `pnpm dev:cf` | OpenNext 构建 + `wrangler dev` | 模拟 Workers 行为，首轮构建较慢 |
| `pnpm dev:remote` | 远程边缘运行 | 需 `wrangler login`，调试真实区域 |
| `pnpm lint` | Biome 格式化 + Lint | 提交前必跑 |
| `pnpm test` | Vitest 单测（当前覆盖有限） | 计划在 M2-M3 后逐步补齐 |
| `pnpm translate` | 批量翻译文案 | 依赖 `.dev.vars` 中的 AI Key |

## 2. 调试技巧
- **Server Actions**：可在浏览器 Network 面板中查看 `server-actions` 请求，也可在 IDE 中直接运行对应函数。
- **Edge 日志**：使用 `wrangler dev --inspect` 配合 Chrome DevTools Debugger。
- **环境变量**：本地读取 `.dev.vars`；Workers 模式下若缺失变量，可使用 `wrangler secret put` 注入。
- **请求重放**：使用 `pnpm dev:cf` + `wrangler dev --persist` 可以持久保存 D1 数据到 `.wrangler/state`。
- **AI / R2 调试**：确保 `.dev.vars` 中配置了 `CLOUDFLARE_R2_URL`、`GEMINI_API_KEY` 等参数，否则相关功能以降级模式运行。

## 3. 数据库（D1）
- 生成迁移：`pnpm db:generate:named "add_users_table"`
- 应用迁移：
  ```bash
  pnpm db:migrate:local    # 使用本地 SQLite
  pnpm db:migrate:prod     # 连接 production（需 Wrangler 登录 + Token）
  ```
- 查看结构：`pnpm db:inspect:local`
- 重置本地：`pnpm db:reset:local`
- 图形化：`pnpm db:studio:local`（基于 `drizzle-kit`）

## 4. Cloudflare 绑定
- 调整 `wrangler.jsonc` 后务必执行 `pnpm cf-typegen`，确保 `cloudflare-env.d.ts` 同步更新。
 
- 若需要新增 KV/Durable Object 等资源，请在 PR 中同步更新 `docs/opennext.md` 与 `docs/deployment/cloudflare-workers.md`。

## 5. UI 与国际化
- 组件统一放在 `src/modules/*/components` 或 `src/components/ui`，使用 Tailwind + shadcn。
- 国际化脚本依赖 `TRANSLATION_PROVIDER`、`GEMINI_API_KEY` 或 `OPENAI_API_KEY`。
- 运行 `pnpm fix:i18n` 可清理编码问题，通常在 `pnpm lint` 前执行。

## 6. 身份认证
- `BETTER_AUTH_SECRET` 与 `BETTER_AUTH_URL` 控制会话签名与回调地址，调试外部 OAuth 时需配置准确域名。
- 管理后台访问由 `ADMIN_ALLOWED_EMAILS` 和 `ADMIN_ENTRY_TOKEN` 控制，可在 `.dev.vars` 内设置本地账号。

## 7. 常见问题与排查
- `error: local socket address...` → 重启 `wrangler dev` 或清除 `.wrangler/state`。
- `fetch failed: 403` → 检查 Cloudflare API Token 权限是否包含 D1/R2/Workers。
- `EAI_AGAIN` → 本地网络 DNS 问题，可切换到 `pnpm dev`（Node runtime）临时开发。
- 更多见 `docs/troubleshooting.md`。

## 8. 质量闸门清单（Daily）
1. 运行 `pnpm lint`
2. 运行 `pnpm test`（若新增测试）
3. 若改动数据库/配置/文档，顺手更新对应文档并在 PR 中引用
4. 使用 `gh run watch` 跟踪 CI 与 Deploy 结果

---

保持“文档即代码”：新增常规流程或遇到稳定复现的问题，记得更新 `docs/local-dev.md` 与 `docs/troubleshooting.md`。
