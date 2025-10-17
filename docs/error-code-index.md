# Error Code Index

Centralized mapping between error codes, the modules that emit them, and recommended remediation steps. Update this file whenever you introduce a new API/service error or change the semantics of an existing one.

| Code | HTTP Status | Module / Endpoint | Description | Primary Source |
| --- | --- | --- | --- | --- |
| `INVALID_REQUEST` | 400 | Billing checkout, usage record, summarize | Input validation failed (missing or malformed payload) | `src/app/api/v1/creem/create-checkout/route.ts` (also `usage/record`, `summarize`) |
| `INVALID_JSON` | 400 | Generic API helpers | Request body could not be parsed as JSON | `src/lib/api-error.ts` |
| `UNAUTHORIZED` | 401 | Auth guard, usage stats, summarize | Caller lacks a valid session/token | `src/app/api/v1/summarize/route.ts`, `src/app/api/v1/usage/*.ts` |
| `INVALID_SIGNATURE` | 401 | Creem webhook | Webhook signature verification failed | `src/app/api/v1/webhooks/creem/route.ts` |
| `CREEM_CUSTOMER_NOT_FOUND` | 404 | Creem customer portal guard | Tenant missing Creem customer metadata | `src/modules/creem/utils/guards.ts` |
| `RATE_LIMITED` | 429 | Auth flow, checkout, webhook | Upstash/Workers rate limit triggered | `src/lib/rate-limit.ts`, `src/app/api/v1/auth/[...all]/route.ts` |
| `UPSTREAM_FAILURE` | 502 | Creem customer portal | Downstream (Creem) returned error | `src/app/api/v1/creem/customer-portal/route.ts` |
| `UPSTREAM_INVALID_RESPONSE` | 502 | Creem customer portal | Downstream payload missing required fields | `src/app/api/v1/creem/customer-portal/route.ts` |
| `SERVICE_CONFIGURATION_ERROR` | 500 | Creem webhook | Missing mandatory secret/binding | `src/app/api/v1/webhooks/creem/route.ts` |
| `INTERNAL_ERROR` | 500 | Generic API helpers | Unexpected server error | `src/lib/api-error.ts` |
| `SERVICE_UNAVAILABLE` | 503 | Creem checkout, summarize | Dependency not reachable (AI binding, Creem API) | `src/app/api/v1/summarize/route.ts`, `src/app/api/v1/creem/create-checkout/route.ts` |

## How to Extend
1. Prefer reusing existing codes. If a new code is necessary, define it close to the throwing service and add an entry to the table above.
2. Include remediation hints in the `details` field of `ApiError` where possible.
3. Update related runbooks (for example, [`docs/health-and-observability.md`](./health-and-observability.md)) if the code implies an operational action.
4. Run `pnpm openapi:generate` so shared schemas stay aligned with the updated catalogue.
