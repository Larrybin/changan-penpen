#!/usr/bin/env node
/**
 * Suggest entries for docs/api-index.md by scanning pages and API routes.
 * This does not write files — it prints suggestions to stdout.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function walk(dir, filter) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(p, filter));
        else if (filter(p)) out.push(p);
    }
    return out;
}

function rel(p) {
    return path.relative(root, p).replace(/\\/g, "/");
}

function pageToRoute(file) {
    // src/app/a/b/page.tsx -> /a/b
    const relPath = rel(file);
    const seg = relPath.replace(/^src\/app\//, "").replace(/\/page\.tsx$/, "");
    // drop segment groups like (admin)
    const clean = seg
        .split("/")
        .filter((s) => s && !/^\(.+\)$/.test(s))
        .map((s) => (s === "index" ? "" : s))
        .join("/");
    return `/${clean}`;
}

function main() {
    const appDir = path.join(root, "src", "app");
    if (!fs.existsSync(appDir)) {
        console.error("src/app not found");
        process.exit(1);
    }
    const pages = walk(appDir, (p) =>
        p.replace(/\\/g, "/").endsWith("/page.tsx"),
    );
    const apis = walk(appDir, (p) =>
        /\/api\/.*\/route\.ts$/.test(p.replace(/\\/g, "/")),
    );
    const moduleRoutes = walk(path.join(root, "src"), (p) =>
        /\.route\.ts$/.test(p),
    );

    console.log("Suggested Page Routes:");
    for (const p of pages.sort()) {
        console.log(`- ${pageToRoute(p)}  (${rel(p)})`);
    }
    console.log("\nAPI Route Files:");
    for (const a of apis.sort()) console.log(`- ${rel(a)}`);
    console.log("\nModule Route Files:");
    for (const r of moduleRoutes.sort()) console.log(`- ${rel(r)}`);
}

main();
