import "@opennextjs/cloudflare/dist/api/cloudflare-context.js";

declare global {
    interface CloudflareEnv extends Cloudflare.Env {
        ADMIN_ALLOWED_EMAILS?: string;
        ADMIN_ENTRY_TOKEN?: string;
        RATE_LIMITER?: RateLimit;
    }
}
