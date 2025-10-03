/* Augment Cloudflare Env bindings for CREEM_* variables */
declare namespace Cloudflare {
    interface Env {
        CREEM_API_URL: string;
        CREEM_API_KEY: string;
        CREEM_WEBHOOK_SECRET: string;
        CREEM_SUCCESS_URL?: string;
        CREEM_CANCEL_URL?: string;
        CREEM_LOG_WEBHOOK_SIGNATURE?: string;
        // Auth & OAuth (secrets usually configured via GitHub Actions -> wrangler secrets)
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL?: string;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        // Optional public URL for R2 files
        CLOUDFLARE_R2_URL?: string;
    }
}
