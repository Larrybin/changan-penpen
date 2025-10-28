#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const LINK_PATTERN = /\[[^\]]*\]\(([^)]+)\)/g;
const DEFAULT_IGNORE_PROTOCOL = /^(https?:|mailto:|tel:|data:)/i;

/**
 * Recursively collects markdown files from the provided directories.
 *
 * @param {string[]} roots
 * @returns {Promise<Array<{ absolute: string; relative: string }>>}
 */
export async function collectMarkdownFiles(roots, options = {}) {
    const projectRoot = options.projectRoot || process.cwd();
    const skip = options.skip || defaultSkip;
    const results = [];

    for (const root of roots) {
        await traverse(root);
    }

    return results;

    async function traverse(currentPath) {
        const stats = await fs.stat(currentPath).catch(() => null);
        if (!stats) return;

        if (stats.isDirectory()) {
            const dirName = path.basename(currentPath);
            if (skip(dirName, currentPath)) return;

            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                await traverse(path.join(currentPath, entry.name));
            }
            return;
        }

        if (stats.isFile() && isMarkdown(currentPath)) {
            results.push({
                absolute: currentPath,
                relative: path.relative(projectRoot, currentPath),
            });
        }
    }
}

/**
 * Validates markdown links for a set of files.
 *
 * @param {Array<{ absolute: string; relative: string }>} files
 * @param {{ projectRoot?: string, ignore?: (link: string) => boolean }=} options
 * @returns {Promise<Array<{ file: string; target: string }>>}
 */
export async function validateMarkdownLinks(files, options = {}) {
    const projectRoot = options.projectRoot || process.cwd();
    const shouldIgnore = options.ignore || ((link) => DEFAULT_IGNORE_PROTOCOL.test(link));
    const missing = [];
    let inspected = 0;

    for (const file of files) {
        const content = await fs.readFile(file.absolute, "utf8");
        const matches = content.matchAll(LINK_PATTERN);
        for (const match of matches) {
            const raw = match[1].trim();
            inspected++;
            if (!raw || raw.startsWith("#") || shouldIgnore(raw)) continue;
            if (raw.startsWith("/")) continue; // site-relative route

            const missingLink = await resolveLocalLink(file.absolute, raw, projectRoot);
            if (missingLink) {
                missing.push({ file: file.relative, target: raw });
            }
        }
    }

    return { missing, inspected };
}

function isMarkdown(filePath) {
    return /\.(md|mdx)$/i.test(filePath);
}

async function resolveLocalLink(baseFile, linkRaw, projectRoot) {
    const baseDir = path.dirname(baseFile);
    const [relativePath] = linkRaw.split("#");
    if (!relativePath) return null;

    const candidate = path.resolve(baseDir, relativePath);
    if (await exists(candidate)) return null;
    if (await exists(`${candidate}.md`)) return null;

    // Directory README fallback
    if (await isDirectory(candidate)) {
        const fallback = path.join(candidate, "README.md");
        if (await exists(fallback)) return null;
    }

    // Try resolving relative to project root for shared assets
    const rootCandidate = path.resolve(projectRoot, relativePath);
    if (await exists(rootCandidate)) return null;

    return `${path.relative(projectRoot, baseFile)} -> ${relativePath}`;
}

function defaultSkip(dirName) {
    return [
        "node_modules",
        ".git",
        ".next",
        "dist",
        "build",
        "out",
    ].includes(dirName);
}

async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function isDirectory(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}
