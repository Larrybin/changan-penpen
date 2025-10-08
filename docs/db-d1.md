# Cloudflare D1 指南（数据库）

> 本文覆盖 D1 的连接方式、迁移流程、初始化/备份策略与常见故障排查。搭配 `src/drizzle` 目录使用。

## 1. 基础知识
- **ORM**：Drizzle（TypeScript-first），Schema 定义在 `src/db/schema.ts`
- **连接入口**：`src/db/index.ts` 暴露 `db`，根据 Workers 绑定自动选择正确实例
- **迁移文件**：位于 `src/drizzle`，通过 `drizzle-kit` 生成

## 2. 迁移命令

```bash
# 生成迁移（自动命名）
pnpm db:generate

# 生成迁移（指定名称）
pnpm db:generate:named "add_users_table"

# 应用迁移
pnpm db:migrate:local      # 本地 SQLite
pnpm db:migrate:prod       # Cloudflare production（--remote）
```

> `db:migrate:*` 命令本质调用 `wrangler d1 migrations apply`。确保 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_D1_TOKEN` 已配置。

## 3. 数据初始化（Seed）策略
当前仓库未提供内置种子脚本，推荐做法：
1. 在 `src/db/seeds/` 新建 `seed.ts`，使用 Drizzle API 插入初始数据。
2. 本地运行：`pnpm tsx src/db/seeds/seed.ts` 或在 `package.json` 添加脚本。
3. 生产环境如需初始化，可在部署前通过 `wrangler d1 execute` 或 CI 步骤执行（确保幂等）。

## 4. 备份与恢复
- **定期备份**：
  ```bash
  # 生产环境
  wrangler d1 export next-cf-app --remote --output prod-backup-$(date +%Y%m%d).sqlite
  ```
- **恢复**：
  ```bash
  wrangler d1 import next-cf-app --remote --file prod-backup.sqlite
  ```
- 建议在 `release.md` 中记录备份存储位置与保留策略（如 R2/外部仓库）。

## 5. 诊断命令
```bash
# 列出表
pnpm db:inspect:local
pnpm db:inspect:prod

# 执行 SQL
wrangler d1 execute next-cf-app --local --command "SELECT COUNT(*) FROM todos;"

# 查看最近迁移记录
wrangler d1 migrations list next-cf-app --remote
```

结合 `pnpm db:studio:local`（drizzle-kit studio）可视化分析结构。

## 6. 常见故障
| 症状 | 原因 | 修复 |
| --- | --- | --- |
| `database is locked` | 本地 SQLite 被占用 | 停止其他 `wrangler dev` 实例或删除 `.wrangler/state` |
| `no such table: <name>` | 漏跑迁移 / 环境错误 | 先 `pnpm db:migrate:*`，确认是否指向 production |
| `AuthenticationError` | API Token 权限不足 | 为 Token 增加 `Account - D1:Edit`、`Account - D1:Read` |
| CI 中迁移失败 | 未运行 `pnpm cf-typegen` 导致类型不一致 | 重新生成类型文件并提交 |

## 7. 多环境约定
- `wrangler.jsonc` 中的 binding 名称统一为 `next_cf_app`，生产环境使用 `env.production` 切换资源 ID。
- 在 Server 代码中无需硬编码环境，直接通过 binding 访问。

## 8. 代码评审 Check-list
1. 迁移文件是否与 `schema.ts` 匹配？
2. 是否更新了 `docs/db-d1.md` 或 `docs/env-and-secrets.md`？
3. 是否在 PR 中标注需要的迁移命令？
4. 是否提供回滚方案（如需要）？

---

更新数据库流程时，请同步 `docs/00-index.md` 与 `release.md`，保持运维与文档一致。
