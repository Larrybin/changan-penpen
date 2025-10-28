#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import {
    collectMarkdownFiles,
    validateMarkdownLinks,
} from "./lib/doc-link-validator.mjs";

async function main() {
    const projectRoot = process.cwd();
    const candidates = [
        path.join(projectRoot, "README.md"),
        path.join(projectRoot, "docs"),
    ].filter((entry) => existsSync(entry));

    if (candidates.length === 0) {
        console.info("[check-links] 未找到需要检查的文档");
        return;
    }

    const files = await collectMarkdownFiles(candidates);
    const { missing } = await validateMarkdownLinks(files, { projectRoot });

    if (missing.length > 0) {
        console.error("[check-links] Missing local links (file -> target):");
        for (const item of missing) {
            console.error(`- ${item.file} -> ${item.target}`);
        }
        process.exit(1);
    }

    console.info("[check-links] OK");
}

await main();
