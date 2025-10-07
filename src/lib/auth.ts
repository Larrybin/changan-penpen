/** biome-ignore-all lint/style/noNonNullAssertion: <we will make sure it's not null> */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";

let authInstance: ReturnType<typeof betterAuth> | null = null;

const createAuth = async () => {
    if (authInstance) {
        return authInstance;
    }

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

    authInstance = betterAuth({
        secret: env.BETTER_AUTH_SECRET,
        database: drizzleAdapter(db, {
            provider: "sqlite",
        }),
        emailAndPassword: {
            enabled: true,
        },
        socialProviders: googleConfigured
            ? {
                  google: {
                      enabled: true,
                      clientId: googleClientId,
                      clientSecret: googleClientSecret,
                  },
              }
            : undefined,
        plugins: [nextCookies()],
    });

    return authInstance;
};

export const getAuth = async () => {
    return await createAuth();
};
