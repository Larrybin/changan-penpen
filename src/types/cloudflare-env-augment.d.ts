/* Augment Cloudflare Env bindings for CREEM_* variables */
declare namespace Cloudflare {
    interface Env {
        CREEM_API_URL: string;
        CREEM_API_KEY: string;
        CREEM_WEBHOOK_SECRET: string;
        CREEM_SUCCESS_URL?: string;
        CREEM_CANCEL_URL?: string;
        CREEM_LOG_WEBHOOK_SIGNATURE?: string;
    }
}

