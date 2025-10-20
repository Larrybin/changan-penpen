import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const aliases = [
    {
        find: /^msw\/node$/, // ensure more specific match resolves before the generic "msw" alias
        replacement: path.resolve(__dirname, "./vitest.stubs/msw-node.ts"),
    },
    {
        find: /^msw\/browser$/,
        replacement: path.resolve(
            __dirname,
            "./node_modules/msw/lib/browser/index.js",
        ),
    },
    {
        find: /^msw$/,
        replacement: path.resolve(__dirname, "./vitest.stubs/msw.ts"),
    },
    {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
    },
    {
        find: "server-only",
        replacement: path.resolve(__dirname, "./vitest.stubs/server-only.ts"),
    },
];

const isTruthy = (value: string | undefined) =>
    value === "true" || value === "1";

const coverageEnabled =
    isTruthy(process.env.CI) || isTruthy(process.env.VITEST_COVERAGE);

const coverageWatermark: [number, number] = [50, 80];

const coverageConfig = {
    enabled: coverageEnabled,
    provider: "v8" as const,
    reporter: coverageEnabled
        ? ["text", "html", "json", "json-summary", "lcov"]
        : ["text"],
    reportsDirectory: coverageEnabled ? "coverage" : undefined,
    all: coverageEnabled ? true : undefined,
    include: coverageEnabled
        ? [
              "src/modules/**/*.{ts,tsx}",
              "src/services/**/*.{ts,tsx}",
              "src/lib/**/*.{ts,tsx}",
              "src/app/**/route.ts",
          ]
        : [],
    exclude: coverageEnabled
        ? [
              "**/__tests__/**",
              "src/**/?(*.)test.ts?(x)",
              "src/modules/**/mocks/**",
              "src/modules/**/stories/**",
              "src/lib/stubs/**",
              "**/*.page.tsx",
              "**/*.layout.tsx",
              "**/*.d.ts",
          ]
        : [],
    thresholds: coverageEnabled
        ? {
              // 第1阶段: 基础建设目标 (30% coverage)
              lines: 30,
              statements: 30,
              branches: 25,
              functions: 35,
              // 注释: 后续阶段将逐步提升至55%
              // 第2阶段 (第3周): lines: 45, statements: 45, branches: 40, functions: 50
              // 第3阶段 (第5周): lines: 55, statements: 55, branches: 50, functions: 60
          }
        : undefined,
    // 添加覆盖率水印配置 - 提供视觉指示器
    watermarks: coverageEnabled
        ? {
              statements: coverageWatermark,
              functions: coverageWatermark,
              branches: coverageWatermark,
              lines: coverageWatermark,
          }
        : undefined,
};

export default defineConfig({
    resolve: {
        alias: aliases,
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        globals: true,
        // 性能优化配置
        testTimeout: 10000, // 单个测试10秒超时
        hookTimeout: 10000, // 钩子10秒超时
        pool: "threads", // 线程池提升并行性能
        poolOptions: {
            threads: {
                maxThreads: 4, // 最大4个并行线程
                minThreads: 1, // 最小1个线程
            },
        },
        // 测试文件匹配模式优化
        include: [
            "**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        ],
        exclude: ["node_modules/**", "dist/**", "coverage/**", ".next/**"],
        typecheck: {
            checker: "tsc",
            tsconfig: path.resolve(__dirname, "./tsconfig.test.json"),
        },
        coverage: coverageConfig,
        alias: aliases,
    },
    css: {
        // Avoid loading project PostCSS/Tailwind pipeline during unit tests
        postcss: {
            plugins: [],
        },
    },
});
