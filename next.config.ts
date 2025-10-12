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
if (process.argv.includes("dev")) {
    import("@opennextjs/cloudflare").then(
        ({ initOpenNextCloudflareForDev }) => {
            initOpenNextCloudflareForDev();
        },
    );
}

const sentryWebpackPluginOptions = {
    org: process.env.SENTRY_ORG || "your-sentry-org",
    project: process.env.SENTRY_PROJECT || "your-sentry-project",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: Boolean(process.env.CI),
    disableLogger: true,
    debug: process.env.SENTRY_DEBUG === "1",
};

const sentryBuildOptions = {
    hideSourceMaps: true,
};

export default withSentryConfig(
    withNextIntl(nextConfig),
    sentryWebpackPluginOptions,
    sentryBuildOptions,
);
