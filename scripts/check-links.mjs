#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function walk(dir) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(p));
        else out.push(p);
    }
    return out;
}

function isMarkdown(p) {
    return /\.(md|mdx)$/i.test(p);
}

function read(p) {
    return fs.readFileSync(p, "utf8");
}

function checkLocalLink(baseFile, linkRaw) {
    const baseDir = path.dirname(baseFile);
    const [relPath] = linkRaw.split("#");
    if (!relPath || relPath.startsWith("#")) return null; // in-file anchor only
    // ignore web/mail/tel/data
    if (/^(https?:|mailto:|tel:|data:)/i.test(relPath)) return null;
    // ignore site routes like /about
    if (relPath.startsWith("/")) return null;

    const candidate = path.resolve(baseDir, relPath);
    if (fs.existsSync(candidate)) return null;
    // try with .md
    if (fs.existsSync(`${candidate}.md`)) return null;
    // if relPath points to a directory, try README.md
    try {
        const stat = fs.statSync(candidate);
        if (
            stat.isDirectory() &&
            fs.existsSync(path.join(candidate, "README.md"))
        )
            return null;
    } catch {}
    return `${path.relative(root, baseFile)} -> ${relPath}`;
}

function main() {
    const targets = [
        path.join(root, "README.md"),
        path.join(root, "docs"),
    ].filter((p) => fs.existsSync(p));
    const files = targets
        .flatMap((t) => (fs.statSync(t).isDirectory() ? walk(t) : [t]))
        .filter(isMarkdown);
    const errors = [];

    const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;

    for (const f of files) {
        const text = read(f);
        for (const m of text.matchAll(linkRe)) {
            const link = m[1].trim();
            const err = checkLocalLink(f, link);
            if (err) errors.push(err);
        }
    }

    if (errors.length) {
        console.error(
            `[check-links] Missing local links (file -> target):\n- ${errors.join("\n- ")}`,
        );
        process.exit(1);
    } else {
        console.log("[check-links] OK");
    }
}

main();
