# Rate Limit Index

Canonical overview of rate limits applied across public APIs. Use this sheet to review guardrails before launching new endpoints.

| Route | Method | Identifier | Strategy | Notes |
| --- | --- | --- | --- | --- |
| `/api/v1/auth/[...all]` | `GET/POST` | `auth:flow` | Sliding window (10 requests / 60s, Upstash + Workers headers) | Applies to both callback (GET) and credential exchange (POST); returns `RATE_LIMITED` with retry metadata. |
| `/api/v1/creem/create-checkout` | `POST` | `creem:create-checkout` | Sliding window (3 requests / 10s) | Blocks rapid-fire checkout attempts; analytics enabled for monitoring. |
| `/api/v1/webhooks/creem` | `POST` | `creem:webhook` | Fixed window (60 requests / 60s) | Shields billing webhook endpoint; includes standard rate limit headers. |

## Gaps & Follow-up
- `/api/v1/creem/customer-portal`, `/api/v1/summarize`, and usage endpoints currently have no dedicated limiter. Evaluate per-tenant quotas or shared credits thresholds before GA.
- Internal server actions are exempt but should inherit upstream limits when exposed externally.

## Implementation Checklist
1. Reuse `applyRateLimit` from `src/lib/rate-limit.ts`.
2. Provide a unique `identifier` and `prefix` for each endpoint so analytics and Redis keys remain isolated.
3. Document the new entry in this file and update [`docs/api-index.md`](./api-index.md).
4. Add regression tests where appropriate (for example, Vitest unit tests that assert `applyRateLimit` is called).
