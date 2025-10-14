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
- `NEXT_PUBLIC_APP_URL`: public base URL for links and SEO
- `BETTER_AUTH_SECRET`: server secret for sessions
- `CREEM_API_URL` / `CREEM_API_KEY`: external billing service
  - CI 变量名兼容：`CREEM_API_URL`（优先）或 `CREEM_API_URL_PRODUCTION`（回退）。工作流会优先读取 `CREEM_API_URL`，否则使用 `CREEM_API_URL_PRODUCTION`。
- `OPENAI_API_KEY` / `GEMINI_API_KEY`: AI providers (optional; used for AI features)
- Health toggles: `HEALTH_REQUIRE_DB`, `HEALTH_REQUIRE_R2`, `HEALTH_REQUIRE_EXTERNAL` ("true"/"false")
- Health auth: `HEALTH_ACCESS_TOKEN`: enables detailed health output behind `X-Health-Token` or `Authorization: Bearer`
- Admin cookies: `ADMIN_FORCE_SECURE_COOKIES`: force secure cookies even when proto headers are missing

## Rotation Policy
- Use `wrangler secret put <NAME>` for production secrets
- Rotate on schedule and after incident
- Update `.dev.vars.example` and docs when variables change

## Tips
- Keep minimal variables in CI; prefer Workers secrets
- Avoid leaking secrets into logs or client env (`NEXT_PUBLIC_*` is public)
- Validate configuration via `/api/health` strict mode before rollout
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
- `NEXTJS_ENV`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_TRANSLATION_MODEL`
- `TRANSLATION_PROVIDER`
<!-- DOCSYNC:ENV_BINDINGS END -->
