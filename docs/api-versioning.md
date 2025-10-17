# API Versioning & Deprecation Policy

This guide explains how we publish and retire HTTP and server action APIs so that client integrations can plan ahead.

## Supported Versions
- **v1** — Active baseline. Backwards-compatible additions (new endpoints, fields, optional parameters) are allowed without a new major version.
- **v2 (planned)** — Target for breaking changes that affect response shapes, authentication flows, or mandatory parameters.

We commit to maintaining each major version for **at least six months** after the next major version becomes generally available (GA). Earlier retirement requires explicit customer sign-off.

## Adding a New Version
1. Fork existing routes under `/api/{version}/...` or the matching module folder.
2. Update [`docs/api-index.md`](./api-index.md) and the OpenAPI tags to surface the new version.
3. Announce the roadmap in release notes and the changelog at least one sprint before the beta launch.
4. Provide upgrade notes and migration helpers (for example, adapters or feature flags).

## Backwards-Compatible Changes
- May add new optional query parameters or response fields.
- Must preserve existing semantics and error codes.
- Should document additions in the OpenAPI schema and call them out in release notes.

## Deprecation Process
1. **Mark** — Flag the affected routes in OpenAPI (`deprecated: true`) and annotate `docs/api-index.md` with the planned sunset date.
2. **Announce** — Send release notes, update the status page, and inform impacted customers. Minimum notice: 90 days.
3. **Monitor** — Track traffic via logs/analytics; provide warnings (HTTP headers or response body hints) at least 30 days prior to removal.
4. **Sunset** — Remove the routes only after the grace period ends. Archive the OpenAPI snapshot and update documentation accordingly.

## Error Handling Expectations
- Maintain stable error codes across versions (see [`docs/error-code-index.md`](./error-code-index.md)).
- When deprecating codes, introduce replacements in the newer version and document the mapping.

## Checklist for Version Changes
- [ ] Update `public/openapi.json` via `pnpm openapi:generate`.
- [ ] Run `pnpm openapi:lint` to ensure schema quality.
- [ ] Update monitoring alerts (health checks, dashboards) to include the new version.
- [ ] Confirm that `scripts/check-docs.mjs` rules cover the new directories.
