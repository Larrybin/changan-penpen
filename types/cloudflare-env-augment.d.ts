// Augment Cloudflare env bindings used across the app
// Keep in sync with wrangler `--var` and deployment vars

// Minimal shared binding types (avoid importing TS from src to keep ambient)
interface RateLimitBinding {
    limit(options: { key: string }): Promise<{ success: boolean }>;
}

declare namespace Cloudflare {
    interface Env {
        NEXT_PUBLIC_APP_URL: string;
        TRANSLATION_PROVIDER?: string;
        OPENAI_BASE_URL?: string;
        OPENAI_TRANSLATION_MODEL?: string;
        OPENAI_API_KEY?: string;
        GEMINI_API_KEY?: string;
        GEMINI_MODEL?: string;
        ADMIN_ALLOWED_EMAILS?: string;
        ADMIN_ENTRY_TOKEN?: string;
        CLOUDFLARE_GLOBAL_API_KEY?: string;
        CF_ACCOUNT_ID?: string;
        CF_PAGES?: string;
        CF_WORKER?: string;
        UPSTASH_REDIS_REST_URL?: string;
        UPSTASH_REDIS_REST_TOKEN?: string;
        // for rate limiter binding used in applyRateLimit
        RATE_LIMITER?: RateLimitBinding;
        OBSERVABILITY_METRICS_ENDPOINT?: string;
        OBSERVABILITY_METRICS_TOKEN?: string;
        OBSERVABILITY_METRICS_FLUSH_INTERVAL_MS?: string;
        OBSERVABILITY_METRICS_MAX_BUFFER?: string;
    }
}

interface CloudflareEnv extends Cloudflare.Env {}
