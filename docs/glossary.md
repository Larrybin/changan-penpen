# 术语表（Glossary）
| 术语 | 说明 |
| --- | --- |
| **OpenNext** | 针对 Next.js 在 Cloudflare/AWS 上运行的构建方案。本项目使用 `@opennextjs/cloudflare` 将应用打包成 Workers。 |
| **Workers** | Cloudflare 的无服务器边缘计算平台，用于承载应用请求。 |
| **D1** | Cloudflare 提供的托管 SQLite 服务，与 Drizzle ORM 集成。 |
| **R2** | Cloudflare 对象存储服务，兼容 S3 协议。 |
| **Fast Health** | `GET /api/health?fast=1`，只验证环境变量与关键绑定，适合部署后快速验活。 |
| **Strict Health** | `GET /api/health` 默认模式，会追加 D1、外部依赖等完整检查，可通过 `HEALTH_REQUIRE_*` 变量控制。 |
| **Better Auth** | 身份认证模块，负责 Google OAuth 等登录流程。 |
| **Workers AI** | Cloudflare 的 AI 托管能力，本项目用于摘要、翻译等功能。 |
| **Wrangler** | Cloudflare 官方 CLI，负责部署、迁移、调试。 |
| **Code Owners** | GitHub 功能，用于指定目录的默认审核人，配置在 `.github/CODEOWNERS`。 |
| **Quality Gate** | 在 `ci.yml` 中定义的质量门，确保部署前通过 lint、测试等检查。 |
| **HEALTH_REQUIRE_DB / R2 / EXTERNAL** | 控制健康检查是否强制执行对应子检查的环境变量。 |
| **NEXT_PUBLIC_APP_URL** | 应用基础 URL，用于 SEO、健康检查与部署配置。 |
| **Creem** | 支付服务模块，相关 API 位于 `src/app/api/creem`。 |

---

如需新增术语、缩写或外部服务，请在此同步说明，确保团队共享语境。
