/** biome-ignore-all lint/style/noNonNullAssertion: <we will make sure it's not null> */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";

type BetterAuthInstance = ReturnType<typeof betterAuth>;

let authInstance: BetterAuthInstance | null = null;
let authPromise: Promise<BetterAuthInstance> | null = null;

async function buildAuthInstance(): Promise<BetterAuthInstance> {
    const { env } = await getCloudflareContext({ async: true });
    const db = await getDb();
    const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
    const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
    const googleConfigured = Boolean(googleClientId && googleClientSecret);

    if (googleClientId && !googleClientSecret) {
        console.warn(
            "GOOGLE_CLIENT_SECRET is missing; Google OAuth provider will be disabled.",
        );
    } else if (googleClientSecret && !googleClientId) {
        console.warn(
            "GOOGLE_CLIENT_ID is missing; Google OAuth provider will be disabled.",
        );
    }

    const socialProviders = googleConfigured
        ? {
              google: {
                  enabled: true,
                  clientId: googleClientId!,
                  clientSecret: googleClientSecret!,
              },
          }
        : undefined;

    return betterAuth({
        secret: env.BETTER_AUTH_SECRET,
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
    if (fresh) {
        authInstance = null;
        authPromise = null;
    }

    if (authInstance && !fresh) {
        return authInstance;
    }

    if (!authPromise) {
        authPromise = buildAuthInstance()
            .then((instance) => {
                authInstance = instance;
                return instance;
            })
            .catch((error) => {
                authPromise = null;
                throw error;
            });
    }

    const instance = await authPromise;

    if (fresh) {
        authInstance = instance;
    }

    return instance;
}

export function __resetAuthInstanceForTests() {
    authInstance = null;
    authPromise = null;
}
