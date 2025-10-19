import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: "./vitest.setup.ts",
        globals: true,
        coverage: {
            enabled: true,
            provider: "v8",
            reporter: ["text", "html", "json", "json-summary", "lcov"],
            reportsDirectory: "coverage",
            all: true,
            include: [
                "src/modules/**/*.{ts,tsx}",
                "src/services/**/*.{ts,tsx}",
                "src/lib/**/*.{ts,tsx}",
                "src/app/**/route.ts",
            ],
            exclude: [
                "**/__tests__/**",
                "src/**/?(*.)test.ts?(x)",
                "src/modules/**/mocks/**",
                "src/modules/**/stories/**",
                "src/lib/stubs/**",
                "**/*.page.tsx",
                "**/*.layout.tsx",
                "**/*.d.ts",
            ],
            thresholds: {
                lines: 15,
                statements: 15,
                branches: 20,
                functions: 20,
            },
        },
        alias: {
            "@": path.resolve(__dirname, "./src"),
            // Stub Next.js-only module so Vite/Vitest can transform files that import it
            "server-only": path.resolve(
                __dirname,
                "./vitest.stubs/server-only.ts",
            ),
        },
    },
    css: {
        // Avoid loading project PostCSS/Tailwind pipeline during unit tests
        postcss: {
            plugins: [],
        },
    },
});
