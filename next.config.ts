import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
    webpack: (config) => {
        config.resolve = config.resolve || {};
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            "@refinedev/core": path.resolve(
                __dirname,
                "src/lib/stubs/refine-core",
            ),
            "@standard-schema/utils": path.resolve(
                __dirname,
                "stubs/standard-schema-utils",
            ),
            "next-intl/config": path.resolve(__dirname, "next-intl.config.ts"),
        };
        return config;
    },
};

// Only run during `next dev`, not during `next build`
if (
    process.argv.includes("dev") &&
    !["0", "false"].includes((process.env.OPENNEXT_DEV || "").toLowerCase())
) {
    import("@opennextjs/cloudflare").then(
        ({ initOpenNextCloudflareForDev }) => {
            initOpenNextCloudflareForDev();
        },
    );
}

const sentryWebpackPluginOptions = {
    org: process.env.SENTRY_ORG || "jiang-bin",
    project: process.env.SENTRY_PROJECT || "javascript-nextjs",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,
    // Route browser requests through a rewrite to circumvent ad-blockers (may increase server load)
    tunnelRoute: "/monitoring",
    // Enable automatic instrumentation of Vercel Cron Monitors (App Router route handlers not yet supported)
    automaticVercelMonitors: true,
    // Optional: extra logs when debugging
    debug: process.env.SENTRY_DEBUG === "1",
};

const _sentryBuildOptions = {
    hideSourceMaps: true,
};

export default withSentryConfig(
    withNextIntl(nextConfig),
    sentryWebpackPluginOptions,
);
