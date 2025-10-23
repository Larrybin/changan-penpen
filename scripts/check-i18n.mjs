#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = [
    path.join(ROOT, "src", "components", "data"),
    path.join(ROOT, "src", "components", "form"),
];
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx"]);
const CJK_REGEX = /[\u4e00-\u9fff]/u;

const flaggedFiles = [];

async function walk(directory) {
    let entries;
    try {
        entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "ENOENT"
        ) {
            return;
        }
        throw error;
    }

    await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                await walk(entryPath);
                return;
            }

            if (!entry.isFile()) {
                return;
            }

            const extension = path.extname(entry.name);
            if (!ALLOWED_EXTENSIONS.has(extension)) {
                return;
            }

            const content = await readFile(entryPath, "utf8");
            const sanitized = content
                .replace(/\/\*[\s\S]*?\*\//g, "")
                .replace(/\/\/.*$/gm, "");
            if (CJK_REGEX.test(sanitized)) {
                const relativePath = path.relative(ROOT, entryPath);
                flaggedFiles.push(relativePath);
            }
        }),
    );
}

await Promise.all(TARGET_DIRS.map((dir) => walk(dir)));

if (flaggedFiles.length > 0) {
    console.error("[check-i18n] Found hard-coded CJK characters in:");
    for (const file of flaggedFiles) {
        console.error(`  - ${file}`);
    }
    process.exitCode = 1;
} else {
    console.info(
        "[check-i18n] No hard-coded CJK strings detected in shared components.",
    );
}
