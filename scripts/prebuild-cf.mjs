#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function runWranglerMigration(args, label) {
    const result = spawnSync("wrangler", args, {
        stdio: "inherit",
        env: process.env,
    });

    if (result.status !== 0) {
        console.error(
            `\n[error] Failed to complete ${label} database migrations`,
        );
        return false;
    }

    return true;
}

function hasRemoteCredentials(env) {
    if (!env) {
        return false;
    }

    const accountId = env.CLOUDFLARE_ACCOUNT_ID ?? env.CF_ACCOUNT_ID;
    const hasApiToken = Boolean(
        env.CLOUDFLARE_API_TOKEN ?? env.CLOUDFLARE_GLOBAL_API_KEY,
    );

    return Boolean(accountId && hasApiToken);
}

function shouldRunRemoteMigrations(env) {
    if (!env) {
        return false;
    }

    if (env.CLOUDFLARE_RUN_REMOTE_MIGRATIONS !== "true") {
        return false;
    }

    return hasRemoteCredentials(env);
}

const env = process.env ?? {};
let isSuccessful = true;

console.log("[info] Syncing local D1 database migrations...");
isSuccessful &&= runWranglerMigration(
    ["d1", "migrations", "apply", "next-cf-app", "--local"],
    "local",
);

if (shouldRunRemoteMigrations(env)) {
    console.log("[info] Syncing remote D1 database migrations...");
    isSuccessful &&= runWranglerMigration(
        ["d1", "migrations", "apply", "next-cf-app", "--remote"],
        "remote",
    );

} else {
    console.log("[info] Skipping remote D1 migrations. Set CLOUDFLARE_RUN_REMOTE_MIGRATIONS=true to enable.");
}

if (!isSuccessful) {
    process.exit(1);
}

console.log("[info] D1 database migrations completed successfully.");
