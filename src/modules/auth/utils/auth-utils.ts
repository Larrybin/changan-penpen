/** biome-ignore-all lint/style/noNonNullAssertion: <we will make sure it's not null> */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { getDb } from "@/db";
import type { AuthUser } from "@/modules/auth/models/user.model";

/**
 * Cached auth instance singleton so we don't create a new instance every time
 */
let cachedAuth: ReturnType<typeof betterAuth> | null = null;

/**
 * Create auth instance dynamically to avoid top-level async issues
 */
async function getAuth() {
    if (cachedAuth) {
        return cachedAuth;
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

    const socialProviders = googleConfigured
        ? {
              google: {
                  enabled: true,
                  clientId: googleClientId!,
                  clientSecret: googleClientSecret!,
              },
          }
        : undefined;

    cachedAuth = betterAuth({
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

    return cachedAuth;
}
/**
 * Get the current authenticated user from the session
 * Returns null if no user is authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const auth = await getAuth();
        const session = await auth.api.getSession({
            headers: new Headers(await headers()),
        });

        if (!session?.user) {
            return null;
        }

        return {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
        };
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

/**
 * Get the current authenticated user or throw an error
 * Use this when authentication is required
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    return user;
}

/**
 * Check if a user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Get the auth instance for use in server actions and API routes
 */
export async function getAuthInstance() {
    return await getAuth();
}

/**
 * Get session information
 */
export async function getSession() {
    try {
        const auth = await getAuth();
        return await auth.api.getSession({
            headers: new Headers(await headers()),
        });
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}
