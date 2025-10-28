# Environment & Secrets

> Source of truth for environment variables, bindings, and secret management.

## Local
- Copy `.dev.vars.example` to `.dev.vars` (not committed)
- `pnpm dev` reads `.env.local` if present; Workers flows use `.dev.vars`

## Cloudflare Bindings
- Define bindings in `wrangler.toml`
  - D1: `next_cf_app`
  - R2: `next_cf_app_bucket`
  - AI: `AI`
  - Static assets: `ASSETS`
  - Version metadata: `CF_VERSION_METADATA`
    - 注意：`version_metadata` 不会从顶层自动继承到环境配置；在生产环境需要显式添加：
      - 顶层：
        ```toml
        [version_metadata]
        binding = "CF_VERSION_METADATA"
        ```
      - 生产环境：
        ```toml
        [env.production.version_metadata]
        binding = "CF_VERSION_METADATA"
        ```

Run `pnpm cf-typegen` after adding/updating bindings to refresh `cloudflare-env.d.ts`.

## Common Variables

### Core platform & authentication
- `NEXT_PUBLIC_APP_URL`: public base URL for links and SEO。
- `NEXT_PUBLIC_IMAGE_HOSTS`: comma-separated allowlist of remote image hostnames for the Next Image component。
- `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`: Better Auth session 与回调配置。
- `CREEM_API_URL` / `CREEM_API_KEY` / `CREEM_WEBHOOK_SECRET`: 外部计费服务。
  - CI 变量名兼容：`CREEM_API_URL`（优先）或 `CREEM_API_URL_PRODUCTION`（回退）。
- `ADMIN_ALLOWED_EMAILS`、`ADMIN_ENTRY_TOKEN`、`ADMIN_FORCE_SECURE_COOKIES`: 管理后台访问控制策略。
- `CACHE_REVALIDATE_TOKEN`: Bearer token required by `/api/admin/cache/revalidate` for cache tag refreshes。
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth。
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET`: Cloudflare Turnstile 小组件与服务端验证密钥。

### Runtime & deployment metadata
- `NEXTJS_ENV`: 自定义环境标识（覆盖默认的 `NODE_ENV`）。
- `OPENNEXT_DEV`: 控制 Cloudflare OpenNext 适配器的开发模式逻辑。
- `ANALYZE`: 设为 `true` 时触发 bundle analyzer、Lighthouse 等性能流程。
- `SUMMARY_JSON`、`DEPLOYMENT_ID`: GitHub Actions 部署审计所需的上下文变量。
- 健康检查：`HEALTH_ACCESS_TOKEN`、`HEALTH_REQUIRE_DB`、`HEALTH_REQUIRE_R2`、`HEALTH_REQUIRE_EXTERNAL`。

### Documentation & tooling automation
- `DOCS_SYNC`、`DOCS_SYNC_SCOPE`、`DOCS_SYNC_DRY`、`DOCS_SYNC_VERBOSE`: 文档同步脚本行为控制。
- `DOCS_AUTOGEN`、`DOCS_AUTOGEN_SCOPE`、`DOCS_AUTOGEN_DRY`、`DOCS_AUTOGEN_THRESHOLD`、`DOCS_AUTOGEN_VERBOSE`: 文档自动生成配置。
- `DOC_STRICT_MODE`: 启用严格模式文档检查（与 `pnpm run check:docs:strict` 配合）。
- `ENABLE_MCP`: 为文档检查开启 MCP 增强模式。
- `SKIP_DOCS_NORMALIZE`、`SKIP_DOCS_CHECK`: 聚合检查脚本中跳过文档归一化或检查的标志。

### Optional integrations
- `OPENAI_API_KEY` / `GEMINI_API_KEY`: AI providers（可选）。
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: 速率限制与缓存（可选）。
- `EXTERNAL_API_RETRY_ATTEMPTS`: 覆盖外部 API 的重试次数（默认为配置文件中的值）。
- `EXTERNAL_API_FAILURE_THRESHOLD`: 自定义熔断阈值（连续失败次数）。
- `EXTERNAL_API_RECOVERY_TIMEOUT_SECONDS`: 熔断进入半开状态前的等待时间（秒）。
- `FAULT_INJECTION`: 以逗号分隔的故障注入标识（例如 `summarizer.before-run`），用于预生产演练。

## Rotation Policy
- Use `wrangler secret put <NAME>` for production secrets
- Rotate on schedule and after incident
- Update `.dev.vars.example` and docs when variables change

## Tips
- Keep minimal variables in CI; prefer Workers secrets
- Avoid leaking secrets into logs or client env (`NEXT_PUBLIC_*` is public)
- Validate configuration via `/api/v1/health` strict mode before rollout
- Normalize encoding: ensure JSON/JSONC/YAML files (e.g., `wrangler.toml`, `.github/workflows/*.yml`) are saved as UTF-8 without BOM. The local push helper auto-strips BOM if found; configure your editor (e.g., VS Code `files.encoding = "utf8"`, `files.eol = "\n"`) and/or `.editorconfig` to prevent BOM from being reintroduced.

<!-- DOCSYNC:ENV_BINDINGS START -->
### Cloudflare Bindings (auto)
| Type | Binding | Details |
| --- | --- | --- |
| D1 | next_cf_app | name=next_cf_app, database_id=0a4563c7-3ffb-4805-a564-681f81562d31 |
| R2 | next_cf_app_bucket | name=next_cf_app_bucket, bucket_name=next-cf-app-bucket |
| AI | AI | name=AI |
| ASSETS | ASSETS | name=ASSETS |

### Common Vars (auto)
- `ADMIN_ALLOWED_EMAILS`
- `ADMIN_ENTRY_TOKEN`
- `ADMIN_FORCE_SECURE_COOKIES`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_D1_TOKEN`
- `CLOUDFLARE_R2_URL`
- `CREEM_API_KEY`
- `CREEM_API_URL`
- `CREEM_CANCEL_URL`
- `CREEM_LOG_WEBHOOK_SIGNATURE`
- `CREEM_SUCCESS_URL`
- `CREEM_WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `HEALTH_ACCESS_TOKEN`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXTJS_ENV`
- `NEXT_PUBLIC_APP_URL`
- `TURNSTILE_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_TRANSLATION_MODEL`
- `TRANSLATION_PROVIDER`
<!-- DOCSYNC:ENV_BINDINGS END -->
