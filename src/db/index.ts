import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

function extractDatabaseBinding(env: unknown): D1Database {
    if (!env || typeof env !== "object") {
        throw new Error(
            "[db] Unable to read Cloudflare bindings from context env",
        );
    }

    const candidate = env as Partial<CloudflareEnv> & Record<string, unknown>;
    const binding = candidate.next_cf_app;

    if (!binding) {
        throw new Error(
            '[db] Missing D1 binding "next_cf_app". Check wrangler.toml and cloudflare-env.d.ts.',
        );
    }

    return binding;
}

export async function getDb() {
    const { env } = await getCloudflareContext({ async: true });
    const binding = extractDatabaseBinding(env);
    return drizzle(binding, { schema });
}

export * from "./schema";
