#!/usr/bin/env node
// Auto-fix + self-check + push (clean UTF-8, fully automated commit message)
import { spawnSync } from "node:child_process";
import {
    appendFileSync,
    existsSync,
    mkdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
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

function buildAutoCommitMessage(files, diff) {
    const changed = (re) => files.some((f) => re.test(f));
    const diffHas = (re) => re.test(diff);

    const bullets = [];
    if (changed(/src\/app\/api\/creem\/create-checkout\/route\.ts/)) {
        bullets.push(
            "- create-checkout: safe JSON parsing on non-JSON responses; use headers() sync",
        );
    }
    if (changed(/src\/app\/api\/creem\/customer-portal\/route\.ts/)) {
        bullets.push("- customer-portal: align redirect handling and inputs");
    }
    if (changed(/src\/app\/api\/webhooks\/creem\/route\.ts/)) {
        bullets.push(
            "- webhooks: require CREEM_WEBHOOK_SECRET before verification",
        );
    }
    if (
        changed(/src\/app\/(sitemap|robots)\.ts/) ||
        changed(/src\/lib\/sitemap\.ts/)
    ) {
        bullets.push(
            "- page/sitemap: fallback to process.env when Cloudflare context missing",
        );
    }
    if (changed(/src\/lib\/r2\.ts/)) {
        if (diffHas(/Content-Disposition/i)) {
            bullets.push(
                "- R2: add Content-Disposition for document/text types to mitigate XSS",
            );
        } else {
            bullets.push("- R2: adjust response headers and content handling");
        }
    }
    if (
        diffHas(/ResponseCookie/) ||
        diffHas(/cookies\(\)/) ||
        diffHas(/await\s+headers\(/)
    ) {
        bullets.push(
            "- auth/utils and API routes: clean headers()/cookies() usage",
        );
    }
    if (
        files.some(
            (f) => /tests\//.test(f) || /\.(test|spec)\.[tj]sx?$/.test(f),
        )
    ) {
        bullets.push("- tests: adjust mocks and assertions");
    }
    if (
        changed(/cloudflare-env.*\.d\.ts/) ||
        changed(/src\/types\/cloudflare-env/)
    ) {
        bullets.push(
            "- types: make CloudflareEnv bindings optional for accurate typing",
        );
    }

    // Subject
    const subjectBits = [];
    if (
        bullets.some(
            (b) =>
                b.startsWith("- create-checkout") || b.startsWith("- webhooks"),
        )
    ) {
        subjectBits.push("harden webhook and fetch parsing");
    }
    if (bullets.some((b) => b.includes("process.env"))) {
        subjectBits.push("add CF env fallbacks");
    }
    if (bullets.some((b) => b.startsWith("- R2:"))) {
        subjectBits.push("enforce R2 attachment for docs");
    }
    if (
        diffHas(/ResponseCookie/) &&
        !subjectBits.includes("remove Next internal type")
    ) {
        subjectBits.push("remove Next internal type");
    }
    if (bullets.some((b) => b.includes("headers()/cookies()"))) {
        subjectBits.push("clean headers()/cookies() usage");
    }

    const tail =
        subjectBits.length > 1
            ? `${subjectBits.slice(0, -1).join(", ")}, and ${subjectBits.slice(-1)}`
            : subjectBits[0] || "auto-fix lint & types";
    const isFix = bullets.some(
        (b) =>
            b.startsWith("- webhooks") ||
            b.startsWith("- R2:") ||
            b.includes("headers()/cookies()"),
    );
    const subject = `${isFix ? "fix" : "chore"}: ${tail}`;

    const body = bullets.length ? `\n\n${bullets.join("\n")}` : "";
    return subject + body;
}

// 1) Typegen + format
CF_TYPEGEN = tryRun("pnpm run cf-typegen");
BIOME_WRITE_RAN = tryRun("pnpm exec biome check . --write --unsafe");

// 2) Type check
try {
    if (existsSync(".next")) rmSync(".next", { recursive: true, force: true });
} catch {}
run("pnpm exec tsc --noEmit");
TSC_OK = true;

// 2.5) Optional Next.js build
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

// 3) Docs checks
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

// Optional helper output
if (process.env.SHOW_API_SUGGEST === "1") {
    tryRun("pnpm run suggest:api-index");
}

// 4) Final Biome check
run("pnpm exec biome check .");
BIOME_FINAL_OK = true;

// 5) Auto-commit
const status = getOutput("git status --porcelain");
if (status) {
    run("git add -A");
    let commitCmd = null;
    if (process.env.PUSH_COMMIT_MSG_FILE) {
        commitCmd = `git commit -F "${process.env.PUSH_COMMIT_MSG_FILE}" --no-verify`;
    } else if (process.env.PUSH_COMMIT_MSG) {
        const p = path.join(LOG_DIR, `commit-msg-${Date.now()}.txt`);
        writeFileSync(p, process.env.PUSH_COMMIT_MSG, { encoding: "utf8" });
        commitCmd = `git commit -F "${p}" --no-verify`;
    } else if (process.env.PUSH_COMMIT_EDITOR === "1") {
        const tmpl = ".github/COMMIT_TEMPLATE.txt";
        if (existsSync(tmpl)) commitCmd = `git commit -t ${tmpl}`;
        else commitCmd = "git commit";
    } else {
        // Fully automated subject + bullets
        const files = getOutput("git diff --cached --name-only")
            .split(/\r?\n/)
            .filter(Boolean);
        const diff = (() => {
            try {
                return getOutput("git diff --cached -U0");
            } catch {
                return "";
            }
        })();
        const auto = buildAutoCommitMessage(files, diff);
        const p = path.join(LOG_DIR, `commit-msg-${Date.now()}.txt`);
        writeFileSync(p, auto, { encoding: "utf8" });
        commitCmd = `git commit -F "${p}" --no-verify`;
    }
    tryRun(commitCmd);
}

// 6) Rebase then push
{
    const pulled = tryRun("git pull --rebase --autostash");
    let conflictList = "";
    try {
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

// Summary
try {
    const branch = getOutput("git rev-parse --abbrev-ref HEAD");
    const commit = getOutput("git show -s --format=%h %s -1");
    const filesShow = getOutput("git show --name-only -1");
    const changedDocs = filesShow
        .split(/\r?\n/)
        .filter(
            (f) =>
                f.startsWith("docs/") ||
                f === "README.md" ||
                f.startsWith(".github/workflows/"),
        )
        .slice(0, 30);
    console.log("\n-- Push Summary --");
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
    console.log(`\nFull log saved to: ${LOG_PATH}`);
} catch {}
