#!/usr/bin/env node
/*
 Auto-fix + self-check + push helper
 - Applies Biome fixes
 - Generates Cloudflare types + TSC typecheck
 - Verifies Biome again (no errors)
 - Auto-commits any remaining changes
 - Pulls with rebase then pushes current branch
*/

import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

let CF_TYPEGEN = false,
    BIOME_WRITE_RAN = false,
    TSC_OK = false,
    NEXT_BUILD = "skipped",
    DOCS_OK = false,
    LINKS_OK = false,
    BIOME_FINAL_OK = false;

const LOG_DIR = process.env.PUSH_LOG_DIR || "logs";
try {
    mkdirSync(LOG_DIR, { recursive: true });
} catch {}
const LOG_PATH =
    process.env.PUSH_LOG_FILE ||
    path.join(
        LOG_DIR,
        `push-${new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").replace("Z", "")}.log`,
    );

function logLine(line = "") {
    try {
        appendFileSync(LOG_PATH, `${line}\n`);
    } catch {}
}

function run(cmd, opts = {}) {
    const header = `\n$ ${cmd}`;
    console.log(header);
    logLine(header);
    const res = spawnSync(cmd, { shell: true, encoding: "utf8", ...opts });
    if (res.stdout) {
        process.stdout.write(res.stdout);
        logLine(res.stdout.trimEnd());
    }
    if (res.stderr) {
        process.stderr.write(res.stderr);
        logLine(res.stderr.trimEnd());
    }
    if (res.status !== 0)
        throw new Error(res.stderr || `Command failed: ${cmd}`);
}

function tryRun(cmd, opts = {}) {
    try {
        run(cmd, opts);
        return true;
    } catch (_e) {
        return false;
    }
}

function getOutput(cmd) {
    const res = spawnSync(cmd, { shell: true, encoding: "utf8" });
    if (res.error) throw res.error;
    if (res.status !== 0)
        throw new Error(res.stderr || `Command failed: ${cmd}`);
    return (res.stdout || "").trim();
}

// 1) Generate types and apply formatting fixes
CF_TYPEGEN = tryRun("pnpm run cf-typegen");
BIOME_WRITE_RAN = tryRun("pnpm exec biome check . --write --unsafe");

// 2) Type check (clean stale Next types first)
try {
    if (existsSync(".next")) rmSync(".next", { recursive: true, force: true });
} catch {}
run("pnpm exec tsc --noEmit");
TSC_OK = true;

// 2.5) Next.js build (pre-push)
// - Skip on Windows by default due to Workers runtime instability
// - Respect SKIP_NEXT_BUILD=1 to skip on any platform
// - Respect FORCE_NEXT_BUILD=1 to force on Windows
try {
    const isWindows = process.platform === "win32";
    const skipByEnv = process.env.SKIP_NEXT_BUILD === "1";
    const forceOnWin = process.env.FORCE_NEXT_BUILD === "1";
    if (skipByEnv || (isWindows && !forceOnWin)) {
        console.log(
            "\nSkipping Next.js build pre-push (set FORCE_NEXT_BUILD=1 to force on Windows).",
        );
    } else {
        console.log("\nRunning Next.js build pre-push (may take a bit)...");
        try {
            if (existsSync(".next"))
                rmSync(".next", { recursive: true, force: true });
        } catch {}
        run("pnpm run build");
        NEXT_BUILD = "built";
    }
} catch (e) {
    console.error("Next.js build failed. Aborting push.");
    throw e;
}

// 3) Docs checks (consistency + local links)
try {
    if (process.env.SKIP_DOCS_CHECK === "1") {
        console.log(
            "\nSkipping docs checks (set SKIP_DOCS_CHECK!=1 to enable).",
        );
    } else {
        run("pnpm run check:docs");
        DOCS_OK = true;
        run("pnpm run check:links");
        LINKS_OK = true;
    }
} catch (e) {
    console.error("Docs checks failed. Aborting push.");
    throw e;
}

// Optional: show API index suggestions (no gating)
if (process.env.SHOW_API_SUGGEST === "1") {
    tryRun("pnpm run suggest:api-index");
}

// 4) Final Biome check (no errors allowed)
run("pnpm exec biome check .");
BIOME_FINAL_OK = true;

// 5) Auto-commit changes if any
const status = getOutput("git status --porcelain");
if (status) {
    run("git add -A");
    // allow commit to succeed even if no staged change (no-op commit will fail gracefully)
    tryRun('git commit -m "chore: auto-fix lint & types" --no-verify');
}

// 6) Rebase latest remote then push
{
    const pulled = tryRun("git pull --rebase --autostash");
    let conflictList = "";
    try {
        // List unmerged files if any
        conflictList = getOutput("git diff --name-only --diff-filter=U");
    } catch {}
    if (!pulled || (conflictList && conflictList.trim().length > 0)) {
        if (conflictList && conflictList.trim().length > 0) {
            const msg = `\nMerge conflicts detected in the following files:\n${conflictList.trim()}`;
            console.error(msg);
            logLine(msg);
        } else {
            const msg = "\nPull with rebase failed. Resolve issues and re-run.";
            console.error(msg);
            logLine(msg);
        }
        const hint =
            "\nResolve the conflicts locally, commit the resolution, then re-run `pnpm push`.";
        console.error(hint);
        logLine(hint);
        process.exit(1);
    }
    run("git push");
}

// Standard push receipt
try {
    const branch = getOutput("git rev-parse --abbrev-ref HEAD");
    const commit = getOutput("git show -s --format=%h\\ %s -1");
    const files = getOutput("git show --name-only -1");
    const changedDocs = files
        .split(/\r?\n/)
        .filter(
            (f) =>
                f.startsWith("docs/") ||
                f === "README.md" ||
                f.startsWith(".github/workflows/"),
        )
        .slice(0, 30);
    console.log("\n—— Push Summary ——");
    console.log(`Status: Success`);
    console.log(`Branch: ${branch}`);
    console.log(`Commit: ${commit}`);
    console.log("Quality gates:");
    console.log(`- cf-typegen: ${CF_TYPEGEN ? "OK" : "FAILED/Skipped"}`);
    console.log(`- Lint (Biome write): ${BIOME_WRITE_RAN ? "Ran" : "Skipped"}`);
    console.log(`- TypeScript: ${TSC_OK ? "OK" : "FAILED"}`);
    console.log(`- Docs consistency: ${DOCS_OK ? "OK" : "FAILED/Skipped"}`);
    console.log(`- Link check: ${LINKS_OK ? "OK" : "FAILED/Skipped"}`);
    console.log(`- Biome final: ${BIOME_FINAL_OK ? "OK" : "FAILED"}`);
    console.log(`- Next.js build: ${NEXT_BUILD}`);
    if (changedDocs.length) {
        console.log("Docs updated:");
        for (const f of changedDocs) console.log(`- ${f}`);
    } else {
        console.log("Docs updated: none");
    }
} catch {}

console.log("\n✅ Auto-fix + self-check + push completed.");
console.log(`?? Full log saved to: ${LOG_PATH}`);
