#!/usr/bin/env node

// Incremental docs sync & self-heal for README/docs.
// Goals:
// - Scope-aware: default only touches changed docs (git diff) unless DOCS_SYNC_SCOPE=all
// - Safe: no structural rewrites; only conservative fixes (BOM/CRLF, trailing spaces, relative link .md completion)
// - Report: writes logs/docs-sync-changed.json with list of modified files
// - Controllable: env flags DOCS_SYNC=0 to skip, DOCS_SYNC_DRY=1 for dry-run, DOCS_SYNC_VERBOSE=1 for details

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const VERBOSE = process.env.DOCS_SYNC_VERBOSE === "1";

function log(...args) {
    if (VERBOSE) console.info("[docs-sync]", ...args);
}

function logError(scope, error) {
    if (!error) return;
    const message = error?.message || String(error);
    log(`${scope}: ${message}`);
}

function ensureLogsDir() {
    const p = path.join(root, "logs");
    if (!fs.existsSync(p)) {
        try {
            fs.mkdirSync(p, { recursive: true });
        } catch (error) {
            console.error("[docs-sync] Failed to ensure log directory:", error);
        }
    }
    return p;
}

function outPath() {
    return path.join(ensureLogsDir(), "docs-sync-changed.json");
}

function readGitDiff(args, scope) {
    try {
        const result = spawnSync("git", args, { encoding: "utf8" });
        const lines = (result.stdout || "").split(/[\r\n]+/).filter(Boolean);
        return lines;
    } catch (error) {
        logError(scope, error);
    }
    return [];
}

function fetchBase(base) {
    try {
        spawnSync("git", ["fetch", "origin", base, "--depth=1"], {
            stdio: "ignore",
        });
    } catch (error) {
        logError("fetch-base", error);
    }
}

function getChangedFiles() {
    const staged = readGitDiff(
        ["diff", "--name-only", "--diff-filter=ACMR", "--cached"],
        "diff-staged",
    );
    if (staged.length) return staged;

    const base = process.env.GITHUB_BASE_REF;
    if (base) {
        fetchBase(base);
        const prDiff = readGitDiff(
            ["diff", "--name-only", `origin/${base}...HEAD`],
            "diff-pr",
        );
        if (prDiff.length) return prDiff;
    }

    const lastCommit = readGitDiff(
        ["diff", "--name-only", "HEAD~1"],
        "diff-last",
    );
    if (lastCommit.length) return lastCommit;

    return [];
}

function toUnixEol(s) {
    return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function stripBom(buf) {
    if (
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
    ) {
        return buf.slice(3);
    }
    return buf;
}

function isDocPath(p) {
    return p === "README.md" || /^docs\/.+\.(md|mdx)$/i.test(p);
}

function resolveLinkTarget(baseDir, target) {
    const trimmed = target.trim();
    if (
        !trimmed ||
        trimmed.startsWith("#") ||
        /^(https?:|mailto:|tel:|data:)/i.test(trimmed) ||
        trimmed.startsWith("/")
    ) {
        return null;
    }

    const normalized = trimmed.replace(/\\\\/g, "/");
    const candidate = path.resolve(baseDir, normalized);
    if (fs.existsSync(candidate)) return null;

    if (fs.existsSync(`${candidate}.md`)) {
        return `${normalized}.md`;
    }

    try {
        const stats = fs.statSync(candidate);
        if (stats.isDirectory()) {
            const readme = path.join(candidate, "README.md");
            if (fs.existsSync(readme)) {
                return path.posix.join(normalized, "README.md");
            }
        }
    } catch (error) {
        logError("resolve-link", error);
    }

    return null;
}

function fixRelativeLinks(filePath, text) {
    const baseDir = path.dirname(path.join(root, filePath));
    const linkRe = /\[(?:[^\]]*)\]\(([^)]+)\)/g;
    let changed = false;
    const out = text.replace(linkRe, (match, target) => {
        const resolved = resolveLinkTarget(baseDir, target);
        if (!resolved || resolved === target) return match;
        changed = true;
        return match.replace(target, resolved);
    });
    return { text: out, changed };
}

function trimTrailingSpaces(text) {
    // Do not alter code fences content aggressively; still safe to trim EOL spaces globally
    return text
        .split("\n")
        .map((l) => l.replace(/[\t ]+$/g, ""))
        .join("\n");
}

function processFile(relPath, dry) {
    const abs = path.join(root, relPath);
    if (!fs.existsSync(abs)) return false;
    const beforeBuf = fs.readFileSync(abs);
    const noBom = stripBom(beforeBuf);
    let text = toUnixEol(noBom.toString("utf8"));
    const beforeText = text;
    text = trimTrailingSpaces(text);
    const linkFix = fixRelativeLinks(relPath, text);
    text = linkFix.text;
    const changed = text !== beforeText;
    if (changed && !dry) {
        fs.writeFileSync(abs, text, "utf8");
    }
    return changed;
}

function gatherAllDocs() {
    const results = new Set(["README.md"]);
    const stack = [path.join(root, "docs")];
    while (stack.length) {
        const dir = stack.pop();
        if (!dir || !fs.existsSync(dir)) continue;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const target = path.join(dir, entry.name);
            if (entry.isDirectory()) stack.push(target);
            else if (/\.(md|mdx)$/i.test(entry.name))
                results.add(path.relative(root, target));
        }
    }
    return Array.from(results);
}

function resolveTargets(scope) {
    if (scope === "all") return gatherAllDocs();
    return getChangedFiles().filter(isDocPath);
}

function syncTargets(targets, dry) {
    const changed = [];
    for (const rel of new Set(targets)) {
        try {
            if (!isDocPath(rel)) continue;
            const did = processFile(rel, dry);
            if (did) changed.push(rel);
            log("processed", rel, did ? "(changed)" : "");
        } catch (error) {
            console.error("[docs-sync] error:", rel, error?.message || error);
            process.exitCode = 1;
        }
    }
    return changed;
}

function writeResult(payload) {
    try {
        fs.writeFileSync(outPath(), JSON.stringify(payload, null, 2));
    } catch (error) {
        console.error("[docs-sync] Failed to write result payload:", error);
    }
}

function report(changed, dry) {
    const message = dry
        ? `[docs-sync] Dry run complete. Would change: ${changed.length} files.`
        : `[docs-sync] Changed ${changed.length} file(s).`;
    console.info(message);
}

function shouldSkip() {
    if (process.env.DOCS_SYNC === "0") {
        console.info("[docs-sync] Skipped (DOCS_SYNC=0)");
        process.exit(0);
    }
    return false;
}

function main() {
    if (shouldSkip()) return;
    const scope = (process.env.DOCS_SYNC_SCOPE || "changed").toLowerCase();
    const dry = process.env.DOCS_SYNC_DRY === "1";
    const targets = resolveTargets(scope);
    const changed = syncTargets(targets, dry);
    writeResult({ scope, dryRun: dry, changed });
    report(changed, dry);
}

main();
