# 术语表（Glossary）

| 术语 | 说明 |
| --- | --- |
| **OpenNext** | 社区维护的 Next.js → Cloudflare/AWS 运行时适配层，本项目使用 `@opennextjs/cloudflare` 部署到 Workers |
| **Workers** | Cloudflare 的无服务器边缘计算平台，承载应用逻辑 |
| **D1** | Cloudflare 提供的分布式 SQLite 数据库，结合 Drizzle 使用 |
| **R2** | Cloudflare 对象存储服务，兼容 S3 协议 |
| **Fast Health** | `/api/health?fast=1`，仅验证环境变量和关键绑定，用于部署前快速检测 |
| **Strict Health** | `/api/health` 默认模式，额外检查 D1、外部服务；可通过 `HEALTH_REQUIRE_*` 控制 gating |
| **Auto Fix** | 自动修复工作流（格式化、自愈、AI），文件位于 `.github/workflows/auto-fix.yml` |
| **Auto Merge Lite** | 白名单自动合并机制，仅针对自愈 PR |
| **Better Auth** | 身份认证库，负责 Google OAuth 等流程 |
| **Workers AI** | Cloudflare AI 推理服务，本项目用于文本总结、翻译等 |
| **Wrangler** | Cloudflare 官方 CLI，用于部署、迁移、管理绑定 |
| **Code Owners** | GitHub 功能，指定目录的默认审阅者，文件在 `.github/CODEOWNERS` |
| **Rolling PR** | `autofix/stable` 分支维护的长期 PR，用于自动修复积累 |
| **Quality Gate** | 部署前复用 `ci.yml` 的质量检查步骤 |
| **HEALTH_REQUIRE_DB / R2 / EXTERNAL** | 控制健康检查是否将对应检查作为硬性条件的环境变量 |
| **NEXT_PUBLIC_APP_URL** | 应用基础 URL，影响 SEO、健康检查和部署配置 |
| **Creem** | 支付服务集成模块，相关 API 位于 `src/app/api/creem` |

---

新增概念、缩写或外部服务时，请在此补充说明，保持团队共识。
