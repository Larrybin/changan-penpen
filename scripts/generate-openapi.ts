#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";

import { getOpenApiDocument } from "@/lib/openapi/document";

async function main() {
    const args = new Set(process.argv.slice(2));
    const checkOnly = args.has("--check");
    const root = process.cwd();
    const outputPath = path.join(root, "public", "openapi.json");
    const document = getOpenApiDocument();
    const json = `${JSON.stringify(document, null, 2)}\n`;

    if (checkOnly) {
        try {
            const existing = await fs.readFile(outputPath, "utf8");
            if (existing !== json) {
                console.error(
                    "[openapi] public/openapi.json 已过期，请运行 pnpm openapi:generate",
                );
                process.exit(1);
            }
            console.log("[openapi] public/openapi.json 已是最新。");
            return;
        } catch (error) {
            console.error(
                "[openapi] 检查失败：未找到现有文件或读取失败，请运行 pnpm openapi:generate",
            );
            if (error instanceof Error) {
                console.error(error.message);
            }
            process.exit(1);
        }
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, json, "utf8");
    console.log(`[openapi] 写入 ${path.relative(root, outputPath)}`);
}

main().catch((error) => {
    console.error("[openapi] 生成失败", error);
    process.exit(1);
});
