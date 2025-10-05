import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: "./vitest.setup.ts",
        globals: true,
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    css: {
        // Avoid loading project PostCSS/Tailwind pipeline during unit tests
        postcss: {
            plugins: [],
        },
    },
});
