# Cloudflare R2 & Static Assets

> Object storage usage, bindings, upload flow, and environment differences.

## Binding
- Define in `wrangler.jsonc` under `r2_buckets` and expose as `next_cf_app_bucket`
- Access via `env.next_cf_app_bucket` (typed by `cloudflare-env.d.ts`)

## Upload/Read
- Write: `put(objectName, ReadableStream | ArrayBuffer, options)`
- Read: `get(objectName)` and stream to client or re‑encode as needed
- Keep content‑type and cache headers accurate
- Default helpers only allow media/pdf/text uploads; set `allowedMimeTypes` explicitly for other formats
- `uploadToR2` writes scan metadata (`scan.status`, optional `scan.auditId`) into object metadata for auditing and exposes it on the returned object payload
- Provide a `scanFile` hook to integrate AV/NSFW scanners; returning `{ auditId }` will be persisted and surfaced to callers

## Static Assets
- OpenNext builds static files under `.open-next/assets`
- Served via `ASSETS` binding configured in `wrangler.jsonc`

## Tips
- Namespacing: prefix objects per environment (`prod/…`, `stg/…`)
- Avoid overly large objects; prefer chunking or background jobs
- Validate permissions on the bucket and region
