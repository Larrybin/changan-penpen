import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

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

export default withNextIntl(nextConfig);
