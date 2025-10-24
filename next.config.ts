import path from "node:path";
import createBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = createBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false,
});

const nextConfig: NextConfig = {
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
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
                port: "",
                pathname: "/**",
                search: "",
            },
        ],
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
    // 实验性功能配置
    experimental: {
        // Core Web Vitals调试支持
        webVitalsAttribution: ["CLS", "LCP", "INP"],
        // Webpack内存优化（Next.js 15.0.0+）
        webpackMemoryOptimizations: true,
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
