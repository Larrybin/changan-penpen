# Static Config Export Workflow

This document explains how the static marketing configuration is generated, validated, and consumed across local development and CI environments.

## Overview

Static configuration files live under `config/static/` and contain per-locale metadata, marketing copy, and structured data used by the marketing homepage. Detailed section content is stored in companion JSON files under `config/static/marketing/<locale>/`.

Two Node scripts coordinate the workflow:

- `scripts/export-site-settings.ts` – fetches data from the admin export API (or falls back to bundled locale messages) and writes JSON files.
- `scripts/validate-static-config.ts` – verifies that generated files match the required schema and that every marketing section has consistent variants.

## Local development

Running `pnpm run prebuild:static-config` locally attempts to use the remote export API when `STATIC_EXPORT_TOKEN` is set. If the token is not available, the script transparently falls back to bundled i18n messages and logs:

```
[static-export] Falling back to bundled messages for static site config generation.
```

Fallback output includes:

- Full metadata with `version` (resolved from the current commit when possible) and `updatedAt` timestamps.
- Marketing section files derived from `src/i18n/messages/<locale>.json`.
- Optional diff reports saved to `config/static/diff/<timestamp>/<locale>.diff` whenever JSON content changes between runs.

You can force remote mode locally by passing `--require-token`. The script exits with a non-zero status if the token is missing when this flag is provided.

## Continuous integration (CI)

In CI, the command is invoked as `pnpm run prebuild:static-config -- --require-token` so the pipeline fails immediately if credentials are missing. Ensure the following environment variables are configured (for example via repository secrets/variables):

- `STATIC_EXPORT_TOKEN` – bearer token used by the `/api/admin/site-settings/export` endpoint.
- `STATIC_EXPORT_BASE_URL` – base URL that hosts the admin export endpoint (e.g. production deployment URL).

The workflow also runs `pnpm run validate:static-config -- --print` to enforce schema compliance. Any validation error aborts the job and prints detailed diagnostics.

## Validation rules

`validate-static-config` enforces:

- Metadata contains `baseUrl`, `siteName`, `ogImage`, `structuredData`, `version`, and an ISO 8601 `updatedAt` timestamp.
- `messages.Marketing` and `messages.StaticPages` are present for every locale.
- Each marketing section exposes a `defaultVariant` that is defined in the corresponding section JSON under `config/static/marketing/<locale>/<section>.json`.
- `marketing.variants` matches the available section variant keys.

Use `pnpm run validate:static-config` manually whenever editing static JSON files to catch mistakes early.

## Related scripts

| Command | Description |
| --- | --- |
| `pnpm run prebuild:static-config` | Generate static config JSON (remote export when credentials are provided, otherwise fallback). |
| `pnpm run prebuild:static-config -- --require-token` | Enforce presence of `STATIC_EXPORT_TOKEN`; fails if missing. |
| `pnpm run validate:static-config` | Validate generated configs; exits non-zero on schema violations. |
| `pnpm run validate:static-config -- --print` | Same as above but prints each error detail to stderr. |

## Troubleshooting

- **Missing token in CI** – Ensure the repository secret `STATIC_EXPORT_TOKEN` is defined. The script exits with code `1` when required credentials are absent.
- **Validation failures** – Run `pnpm run validate:static-config -- --print` locally to view detailed errors, then fix the offending JSON files.
- **Unexpected fallback** – Check the console output; if the script logs a fallback warning, confirm that `STATIC_EXPORT_TOKEN` and `STATIC_EXPORT_BASE_URL` are set and reachable from your environment.
