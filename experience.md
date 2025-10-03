### 记录犯过的错

缺少应用密钥：CI 报 “Value for secret BETTER_AUTH_SECRET not found…” 因为 GitHub Actions 不读取本地 .dev.vars，需要在仓库/Environment 的 Secrets 配置同名项（.dev.vars 仅本地用）。参考 .github/workflows/deploy.yml:76、.github/workflows/deploy.yml:163 与 .github/workflows/deploy.yml:82、.github/workflows/deploy.yml:169。

Cloudflare 鉴权失败：API 10001 通常是 CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID 未配置或权限不足。参考 .github/workflows/deploy.yml:65、.github/workflows/deploy.yml:66。

R2 桶不存在：API 10085 表示绑定到的桶未创建。绑定在 wrangler.jsonc:28（next-cf-app-bucket）和 wrangler.jsonc:30（next-cf-app-dev-bucket），代码使用 env.next_cf_app_bucket（src/lib/r2.ts:27、src/lib/r2.ts:66）。

D1 数据库不存在/ID 不匹配：API 10021 说明 wrangler.jsonc 的 database_id 不对应你账号中的真实 D1 库（wrangler.jsonc:20 绑定名、wrangler.jsonc:22 database_id；代码使用 env.next_cf_app：src/db/index.ts:7）。

Vectorize 索引不存在：API 10159 因配置了未创建的向量索引。项目未用到 Vectorize，仅存在绑定导致强校验失败，已移除该绑定避免报错。