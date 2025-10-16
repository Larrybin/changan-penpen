# Upstash Ratelimit Integration

## Overview
- Harden sensitive Cloudflare Workers endpoints with Redis-backed rate limiting that runs at the edge.
- Reuse the shared `applyRateLimit` helper while opting into Upstash algorithms per endpoint.
- Fall back to the existing Cloudflare `RATE_LIMITER` binding automatically when Upstash is not configured.

## Dependencies
- Install the SDKs: `pnpm add @upstash/ratelimit @upstash/redis@latest` (and re-run after lock updates).
- The REST client entry point `@upstash/redis/cloudflare` is bundled by the base package; no extra install step is needed.

## Environment Variables
- Create an Upstash Redis database close to your users and copy the REST URL and token.
- Add the secrets locally in `.dev.vars` (see `.dev.vars.example`) and store them in production via `wrangler secret put` or pipeline secrets.
- Required keys: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- After adding new bindings run `pnpm cf-typegen` so that `cloudflare-env.d.ts` stays in sync.

## Using `applyRateLimit`
- The helper now accepts an `upstash` block that declares the algorithm, prefix, and headers to emit.
- When Upstash credentials exist, the limiter caches instances per prefix and strategy to minimize cold-start latency.
- Analytics promises emitted by Upstash are handled through `waitUntil`; pass the execution context so Workers can flush telemetry without delaying the response.
- If the request exceeds the quota, the response includes retry metadata (`Retry-After`, `X-RateLimit-*`, JSON payload with `limit`, `remaining`, `reset`).

```ts
const rateLimit = await applyRateLimit({
    request,
    identifier: "creem:create-checkout",
    env: {
        RATE_LIMITER: env.RATE_LIMITER,
        UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
    },
    message: "Too many checkout attempts",
    upstash: {
        strategy: { type: "sliding", requests: 3, window: "10 s" },
        analytics: true,
        prefix: "@ratelimit/checkout",
        includeHeaders: true,
    },
    waitUntil,
});
if (!rateLimit.ok) return rateLimit.response;
```

## Endpoint Examples
- **Checkout API** (`src/app/api/v1/creem/create-checkout/route.ts`): 3 sliding-window requests every 10 seconds per IP with analytics enabled.
- **Webhook API** (`src/app/api/v1/webhooks/creem/route.ts`): 60 fixed-window hits per minute. Using the signature as a unique token is optional; IP-based throttling is enabled by default.
- **Login or OTP flows**: call `applyRateLimit` with `upstash: { strategy: { type: "tokenBucket", refillRate: 5, interval: "60 s", capacity: 10 }, prefix: "@ratelimit/login" }` to smooth bursts while keeping limits strict.

## Local Verification
- Run `wrangler dev --remote` and hammer the protected routes with `curl` to confirm `429` responses after the thresholds.
- Monitor Upstash analytics to observe hit, miss, and block counts; adjust thresholds per endpoint as abuse patterns evolve.
- Remember to keep environment prefixes distinct for staging vs. production to avoid cross-environment interference.
