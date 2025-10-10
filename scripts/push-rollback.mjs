#!/usr/bin/env node
// Show and optionally apply rollback to a pre-push backup tag created by scripts/push-fix2.mjs

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function run(cmd, opts = {}) {
    const res = spawnSync(cmd, { shell: true, encoding: "utf8", ...opts });
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
    return res.status === 0;
}
function getOutput(cmd) {
    const r = spawnSync(cmd, { shell: true, encoding: "utf8" });
    if (r.status !== 0) throw new Error(r.stderr || `Failed: ${cmd}`);
    return (r.stdout || "").trim();
}

function listBackupTags() {
    try {
        const fmt = "%(creatordate:iso8601) %(refname:short)";
        const out = getOutput(
            `git for-each-ref --sort=-creatordate --format='${fmt}' refs/tags/prepush-`,
        );
        return out
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => {
                const sp = line.indexOf(" ");
                return { date: line.slice(0, sp), tag: line.slice(sp + 1) };
            });
    } catch {
        return [];
    }
}

function main() {
    const args = process.argv.slice(2);
    const apply =
        args.includes("--apply") || process.env.ROLLBACK_APPLY === "1";
    const show = args.includes("--list");
    const tagIdx = Math.max(args.indexOf("--tag"), args.indexOf("-t"));
    const tagName = tagIdx >= 0 ? args[tagIdx + 1] : null;

    if (show) {
        const tags = listBackupTags();
        if (!tags.length) {
            console.log("No prepush backup tags found (refs/tags/prepush-*)");
            return;
        }
        console.log("Latest prepush tags:");
        for (const t of tags.slice(0, 10)) console.log(`- ${t.date}  ${t.tag}`);
        return;
    }

    let tag = tagName;
    if (!tag) {
        const lastFile = path.join(
            process.cwd(),
            "logs",
            "last-prepush-tag.txt",
        );
        if (existsSync(lastFile)) {
            try {
                tag = readFileSync(lastFile, "utf8").trim();
            } catch {}
        }
        if (!tag) {
            const tags = listBackupTags();
            tag = tags[0]?.tag;
        }
    }

    if (!tag) {
        console.error(
            "No backup tag found. Use `pnpm run push:rollback -- --list` to inspect.",
        );
        process.exit(1);
    }

    console.log(`Rollback target: ${tag}`);
    if (!apply) {
        console.log("Dry-run. To apply locally:");
        console.log(`  git reset --hard ${tag}`);
        console.log("Then optionally push (force-with-lease):");
        console.log("  git push --force-with-lease");
        return;
    }

    if (!run(`git reset --hard "${tag}"`)) {
        console.error("Reset failed.");
        process.exit(1);
    }
    console.log("Local reset complete. Review state, then push if desired:");
    console.log("  git push --force-with-lease");
}

main();
