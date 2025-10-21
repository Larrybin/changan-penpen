/** biome-ignore-all lint/style/noNonNullAssertion: Ignore for this file */

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .dev.vars for drizzle studio
config({ path: ".dev.vars" });

function requireEnv(key: string): string {
    const value = process.env[key]?.trim();
    if (!value) {
        throw new Error(
            `[drizzle] Missing required environment variable: ${key}. ` +
                "Set it in .dev.vars or your shell before running drizzle-kit.",
        );
    }
    return value;
}

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./src/drizzle",
    dialect: "sqlite",
    driver: "d1-http",
    dbCredentials: {
        accountId: requireEnv("CLOUDFLARE_ACCOUNT_ID"),
        databaseId: requireEnv("CLOUDFLARE_D1_DATABASE_ID"),
        token: requireEnv("CLOUDFLARE_D1_TOKEN"),
    },
});
