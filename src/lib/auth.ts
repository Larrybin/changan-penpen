/** biome-ignore-all lint/style/noNonNullAssertion: <we will make sure it's not null> */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";

type BetterAuthInstance = ReturnType<typeof betterAuth>;

type AuthEnvSnapshot = {
    secret: string;
    googleClientId?: string;
    googleClientSecret?: string;
};

type AuthCache = {
    instances: Map<string, BetterAuthInstance>;
    promises: Map<string, Promise<BetterAuthInstance>>;
};

function getGlobalAuthCache(): AuthCache {
    const globalObject = globalThis as typeof globalThis & {
        __betterAuthCache?: AuthCache;
    };
    if (!globalObject.__betterAuthCache) {
        globalObject.__betterAuthCache = {
            instances: new Map(),
            promises: new Map(),
        };
    }
    return globalObject.__betterAuthCache;
}

function snapshotAuthEnv(env: CloudflareEnv): AuthEnvSnapshot {
    const secret = env.BETTER_AUTH_SECRET?.trim();
    if (!secret) {
        throw new Error(
            "[auth] BETTER_AUTH_SECRET is not configured. Set it via wrangler secret or .dev.vars.",
        );
    }

    const googleClientId = env.GOOGLE_CLIENT_ID?.trim() || undefined;
    const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim() || undefined;

    if (googleClientId && !googleClientSecret) {
        console.warn(
            "GOOGLE_CLIENT_SECRET is missing; Google OAuth provider will be disabled.",
        );
    } else if (googleClientSecret && !googleClientId) {
        console.warn(
            "GOOGLE_CLIENT_ID is missing; Google OAuth provider will be disabled.",
        );
    }

    return {
        secret,
        googleClientId,
        googleClientSecret,
    } satisfies AuthEnvSnapshot;
}

function buildCacheKey(snapshot: AuthEnvSnapshot): string {
    const providerState =
        snapshot.googleClientId && snapshot.googleClientSecret
            ? "google:on"
            : "google:off";
    return `${snapshot.secret}::${providerState}`;
}

async function buildAuthInstance(
    snapshot: AuthEnvSnapshot,
): Promise<BetterAuthInstance> {
    const db = await getDb();
    const googleConfigured = Boolean(
        snapshot.googleClientId && snapshot.googleClientSecret,
    );

    const socialProviders = googleConfigured
        ? {
              google: {
                  enabled: true,
                  clientId: snapshot.googleClientId!,
                  clientSecret: snapshot.googleClientSecret!,
              },
          }
        : undefined;

    return betterAuth({
        secret: snapshot.secret,
        database: drizzleAdapter(db, {
            provider: "sqlite",
        }),
        emailAndPassword: {
            enabled: true,
        },
        socialProviders,
        plugins: [nextCookies()],
    });
}

export async function getAuth({
    fresh = false,
} = {}): Promise<BetterAuthInstance> {
    const { env } = await getCloudflareContext({ async: true });
    const snapshot = snapshotAuthEnv(env as CloudflareEnv);
    const cacheKey = buildCacheKey(snapshot);
    const cache = getGlobalAuthCache();

    if (fresh) {
        cache.instances.delete(cacheKey);
        cache.promises.delete(cacheKey);
    } else {
        const existing = cache.instances.get(cacheKey);
        if (existing) {
            return existing;
        }
    }

    let promise = cache.promises.get(cacheKey);
    if (!promise) {
        promise = buildAuthInstance(snapshot)
            .then((instance) => {
                cache.instances.set(cacheKey, instance);
                return instance;
            })
            .catch((error) => {
                cache.promises.delete(cacheKey);
                cache.instances.delete(cacheKey);
                throw error;
            });
        cache.promises.set(cacheKey, promise);
    }

    const instance = await promise;

    if (fresh) {
        cache.instances.set(cacheKey, instance);
    }

    return instance;
}

export function __resetAuthInstanceForTests() {
    const cache = getGlobalAuthCache();
    cache.instances.clear();
    cache.promises.clear();
}
