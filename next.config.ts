import { createRequire } from "node:module";
import path from "node:path";
import createBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import createNextIntlPlugin from "next-intl/plugin";

import { buildRedirects } from "./config/redirects";

function parseHost(value: string | undefined) {
    if (!value) {
        return null;
    }
    try {
        const url = value.startsWith("http")
            ? new URL(value)
            : new URL(`https://${value}`);
        return url.hostname;
    } catch {
        return null;
    }
}

function collectRemoteImageHosts() {
    const hosts = new Set<string>();
    const envList = process.env.NEXT_PUBLIC_IMAGE_HOSTS;
    if (envList) {
        for (const raw of envList.split(",")) {
            const candidate = raw.trim();
            if (candidate) {
                hosts.add(candidate);
            }
        }
    }

    const appHost = parseHost(process.env.NEXT_PUBLIC_APP_URL);
    if (appHost) {
        hosts.add(appHost);
    }

    const r2Host = parseHost(process.env.CLOUDFLARE_R2_URL);
    if (r2Host) {
        hosts.add(r2Host);
    }

    hosts.add("imagedelivery.net");

    return Array.from(hosts);
}

const remoteImagePatterns: RemotePattern[] = collectRemoteImageHosts().map(
    (hostname) => ({
        protocol: "https",
        hostname,
        pathname: "/**",
    }),
);

const require = createRequire(import.meta.url);
const nextVersion = (require("next/package.json") as { version: string })
    .version;
const enableCacheComponents = /canary/i.test(nextVersion);

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = createBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false,
});

const nextConfig: NextConfig = {
    async redirects() {
        return buildRedirects();
    },
    // 图片优化配置
    images: {
        // 优先使用AVIF格式，回退到WebP
        formats: ["image/avif", "image/webp"],
        // 响应式图片断点
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        // 图片尺寸配置
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // 最小缓存时间（4小时）
        minimumCacheTTL: 14400,
        // 允许的外部图片源配置
        remotePatterns: remoteImagePatterns,
        // 本地图片模式
        localPatterns: [
            {
                pathname: "/public/images/**",
                search: "",
            },
            {
                pathname: "/og-image.svg",
                search: "",
            },
        ],
    },
    // OpenNext 构建需要 Next.js standalone 输出
    output: "standalone",
    // 实验性功能配置
    experimental: {
        // Core Web Vitals调试支持
        webVitalsAttribution: ["CLS", "LCP", "INP"],
        // Webpack内存优化（Next.js 15.0.0+）
        webpackMemoryOptimizations: true,
        ...(enableCacheComponents ? { cacheComponents: true } : {}),
        useCache: true,
    },
    webpack: (config) => {
        config.resolve = config.resolve || {};
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            "@standard-schema/utils": path.resolve(
                __dirname,
                "stubs/standard-schema-utils",
            ),
            "next-intl/config": path.resolve(__dirname, "next-intl.config.ts"),
        };

        return config;
    },
};

const configWithPlugins = withBundleAnalyzer(withNextIntl(nextConfig));

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

export default configWithPlugins;
