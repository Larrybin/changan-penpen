#!/usr/bin/env node
// Local push helper: change-aware quality gate + auto-commit + push
// Notes:
// - This file is tracked as a template. The actual local runner lives at scripts/push-fix2.mjs (ignored by Git).
// - CI/CD does not depend on this script.

import { spawnSync } from "node:child_process";
import {
    appendFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import path from "node:path";

let CF_TYPEGEN = false,
    BIOME_WRITE_RAN = false,
    TSC_OK = false,
    TEST_OK = false,
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

// --- Timing helpers ---
const STEP_TIMES = Object.create(null);
function timeStart(name) {
    STEP_TIMES[name] = { start: Date.now(), ms: 0 };
}
function timeEnd(name) {
    const t = STEP_TIMES[name];
    if (t?.start) t.ms = Date.now() - t.start;
}

// --- Subprocess helpers ---
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
    } catch {
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

// --- BOM check utilities ---
function checkBom(files) {
    const bad = [];
    for (const f of files) {
        try {
            if (!existsSync(f)) continue;
            const b = Buffer.from(
                (() => {
                    try {
                        return readFileSync(f);
                    } catch {
                        return new Uint8Array(0);
                    }
                })(),
            );
            if (
                b.length >= 3 &&
                b[0] === 0xef &&
                b[1] === 0xbb &&
                b[2] === 0xbf
            )
                bad.push(f);
        } catch {}
    }
    if (bad.length) {
        if (process.env.STRICT_BOM === "1") {
            console.error(
                `\n[check-bom] UTF-8 BOM detected in: ${bad.join(", ")}. Save as UTF-8 (no BOM) and re-run.`,
            );
            process.exit(1);
        }
        for (const f of bad) {
            try {
                const b = readFileSync(f);
                const stripped = b.slice(3);
                writeFileSync(f, stripped);
                console.log(`[check-bom] Stripped BOM: ${f}`);
            } catch (e) {
                console.error(`[check-bom] Failed to strip BOM for ${f}:`, e);
                process.exit(1);
            }
        }
    }
}

// --- Docs ASCII normalization (punctuation + whitespace) ---
function normalizeDocs(files) {
    const MAP = new Map([
        ["，", ","],
        ["。", "."],
        ["！", "!"],
        ["？", "?"],
        ["：", ":"],
        ["；", ";"],
        ["（", "("],
        ["）", ")"],
        ["【", "["],
        ["】", "]"],
        ["「", '"'],
        ["」", '"'],
        ["『", '"'],
        ["』", '"'],
        ["“", '"'],
        ["”", '"'],
        ["‘", "'"],
        ["’", "'"],
        ["、", ","],
        ["《", "<"],
        ["》", ">"],
        ["—", "-"],
        ["——", "--"],
        ["…", "..."],
    ]);
    const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g; // zero-width + BOM chars inside text
    const NBSP_RE = /\u00A0|\u3000/g; // nbsp + full-width space

    function applyAscii(text) {
        // Skip fenced code blocks (``` ... ```), do not normalize inside them
        const parts = text.split(/```/g);
        for (let i = 0; i < parts.length; i++) {
            // even index: normal text; odd index: code block content
            if (i % 2 === 1) continue;
            let seg = parts[i];
            seg = seg.replace(ZERO_WIDTH_RE, "");
            seg = seg.replace(NBSP_RE, " ");
            // line-end trailing spaces
            seg = seg.replace(/[ \t]+$/gm, "");
            // punctuation mapping
            for (const [k, v] of MAP) seg = seg.replace(new RegExp(k, "g"), v);
            parts[i] = seg;
        }
        let out = parts.join("```");
        // Normalize line endings and ensure trailing newline
        out = out.replace(/\r\n?/g, "\n");
        if (!out.endsWith("\n")) out += "\n";
        return out;
    }

    for (const f of files) {
        try {
            if (!existsSync(f)) continue;
            const s = readFileSync(f, "utf8");
            // Strip BOM if present
            let t = s;
            if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
            const n = applyAscii(t);
            if (n !== s) {
                writeFileSync(f, n, { encoding: "utf8" });
                console.log(`[docs-normalize] Normalized: ${f}`);
            }
        } catch (e) {
            console.error(`[docs-normalize] Failed for ${f}:`, e?.message);
            throw e;
        }
    }
}
function getTrackedFiles(globs) {
    try {
        const args = ["ls-files", "-z", "--", ...globs];
        const res = spawnSync("git", args, { encoding: "utf8" });
        if (res.status !== 0) return [];
        return (res.stdout || "")
            .split("\u0000")
            .map((s) => s.trim())
            .filter(Boolean);
    } catch {
        return [];
    }
}
function getChangedFiles() {
    try {
        const res = spawnSync(
            "git",
            ["diff", "--name-only", "--diff-filter=ACMR", "--cached"],
            { encoding: "utf8" },
        );
        const lines = (res.stdout || "").split(/\r?\n/).filter(Boolean);
        if (lines.length) return lines;
    } catch {}
    try {
        const base = process.env.GITHUB_BASE_REF;
        if (base) {
            try {
                spawnSync("git", ["fetch", "origin", base, "--depth=1"], {
                    stdio: "ignore",
                });
            } catch {}
            const r = spawnSync(
                "git",
                ["diff", "--name-only", `origin/${base}...HEAD`],
                { encoding: "utf8" },
            );
            const lines = (r.stdout || "").split(/\r?\n/).filter(Boolean);
            if (lines.length) return lines;
        }
    } catch {}
    try {
        const res = spawnSync("git", ["diff", "--name-only", "HEAD~1"], {
            encoding: "utf8",
        });
        const lines = (res.stdout || "").split(/\r?\n/).filter(Boolean);
        if (lines.length) return lines;
    } catch {}
    return [];
}
function classifyChanges(files) {
    const isDocs = (f) => f === "README.md" || f.startsWith("docs/");
    const isFlow = (f) =>
        f.startsWith(".github/workflows/") || f.startsWith(".github/actions/");
    const isBind = (f) =>
        f === "wrangler.jsonc" ||
        f === "cloudflare-env.d.ts" ||
        f.startsWith("types/cloudflare-env") ||
        f.startsWith("src/types/cloudflare-env");
    const isCode = (f) => f.startsWith("src/") || f.startsWith("scripts/");
    if (files.length === 0)
        return {
            docsOnly: false,
            workflowsOnly: false,
            bindingsChanged: true,
            codeChanged: true,
        };
    return {
        docsOnly: files.every(isDocs),
        workflowsOnly: files.every(isFlow),
        bindingsChanged: files.some(isBind),
        codeChanged: files.some(isCode),
    };
}

// --- 1) Typegen + format ----------------------------------------------------
try {
    tryRun("pnpm exec lint-staged");
} catch {}
if (process.env.SKIP_BOM_CHECK !== "1") {
    const baseList = [
        "package.json",
        "biome.json",
        "components.json",
        "tsconfig.json",
        "tsconfig.translate.json",
        "wrangler.jsonc",
    ];
    const yamlAndMd = getTrackedFiles([
        ".github/workflows/**/*.yml",
        ".github/workflows/**/*.yaml",
        ".github/actions/**/*.yml",
        ".github/actions/**/*.yaml",
        "**/*.yml",
        "**/*.yaml",
        "README.md",
        "docs/**/*.md",
        "**/*.mdx",
    ]);
    const set = new Set([...baseList, ...yamlAndMd]);
    checkBom(Array.from(set));
    if (process.env.SKIP_DOCS_NORMALIZE !== "1") {
        const docList = Array.from(
            new Set([
                "README.md",
                ...getTrackedFiles(["docs/**/*.md", "**/*.mdx"]),
            ]),
        );
        normalizeDocs(docList);
    }
}

const changedFiles = getChangedFiles();
const CH = classifyChanges(changedFiles);
const DO_CF_TYPEGEN = CH.bindingsChanged;
const DO_TSC = !CH.docsOnly && !CH.workflowsOnly;
const DO_TESTS = DO_TSC;
const DO_NEXT_BUILD = DO_TSC;

timeStart("biome-write");
BIOME_WRITE_RAN = tryRun("pnpm exec biome check . --write --unsafe");
timeEnd("biome-write");

if (DO_CF_TYPEGEN) {
    timeStart("cf-typegen");
    CF_TYPEGEN = tryRun("pnpm run cf-typegen");
    timeEnd("cf-typegen");
}

// --- 2) Type check ----------------------------------------------------------
if (DO_TSC) {
    try {
        if (existsSync(".next"))
            rmSync(".next", { recursive: true, force: true });
    } catch {}
    timeStart("tsc");
    run("pnpm exec tsc --noEmit");
    timeEnd("tsc");
    TSC_OK = true;
} else {
    console.log("\nSkipping TypeScript check (docs/workflows-only changes).");
}

// --- 2.2) Unit tests --------------------------------------------------------
if (DO_TESTS) {
    try {
        if (process.env.SKIP_TESTS === "1") {
            console.log("\nSkipping unit tests (SKIP_TESTS=1).");
        } else {
            const FULL = process.env.FULL_COVERAGE === "1";
            const FAST = process.env.FAST_VITEST === "1";
            timeStart("vitest");
            if (FAST && !FULL) {
                console.log("\nRunning unit tests (fast mode)…");
                run("pnpm run test:ci");
            } else {
                console.log("\nRunning unit tests (Vitest) with coverage…");
                run("pnpm run test");
            }
            timeEnd("vitest");
            TEST_OK = true;
        }
    } catch (e) {
        console.error("Unit tests failed. Aborting push.");
        throw e;
    }
} else {
    console.log("\nSkipping unit tests (docs/workflows-only changes).");
}

// --- 2.5) Optional Next.js build -------------------------------------------
try {
    const isWindows = process.platform === "win32";
    const skipByEnv = process.env.SKIP_NEXT_BUILD === "1";
    const forceOnWin = process.env.FORCE_NEXT_BUILD === "1";
    if (!DO_NEXT_BUILD || skipByEnv || (isWindows && !forceOnWin)) {
        console.log(
            "\nSkipping Next.js build pre-push (set FORCE_NEXT_BUILD=1 to force on Windows).",
        );
    } else {
        console.log("\nRunning Next.js build pre-push (may take a bit)...");
        try {
            if (existsSync(".next"))
                rmSync(".next", { recursive: true, force: true });
        } catch {}
        timeStart("next-build");
        run("pnpm run build");
        timeEnd("next-build");
        NEXT_BUILD = "built";
    }
} catch (e) {
    console.error("Next.js build failed. Aborting push.");
    throw e;
}

// --- 3) Docs checks ---------------------------------------------------------
try {
    if (process.env.SKIP_DOCS_CHECK === "1") {
        console.log(
            "\nSkipping docs checks (set SKIP_DOCS_CHECK!=1 to enable).",
        );
    } else {
        timeStart("docs-checks");
        run("pnpm run check:docs");
        DOCS_OK = true;
        run("pnpm run check:links");
        LINKS_OK = true;
        timeEnd("docs-checks");
    }
} catch (e) {
    console.error("Docs checks failed. Aborting push.");
    throw e;
}

// (Semgrep step removed)

// --- 4) Final Biome check ---------------------------------------------------
timeStart("biome-final");
run("pnpm exec biome check .");
timeEnd("biome-final");
BIOME_FINAL_OK = true;

// --- 5) Auto-commit ---------------------------------------------------------
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
    } else {
        const files = getOutput("git diff --cached --name-only")
            .split(/\r?\n/)
            .filter(Boolean);
        const scopeBits = new Set();
        if (files.some((f) => f.startsWith("src/"))) scopeBits.add("code");
        if (files.some((f) => f.startsWith("docs/") || f === "README.md"))
            scopeBits.add("docs");
        if (
            files.some(
                (f) =>
                    f.startsWith(".github/workflows/") ||
                    f.startsWith(".github/actions/"),
            )
        )
            scopeBits.add("workflows");
        const scope = Array.from(scopeBits).join(", ") || "auto";
        const subject = `chore: local push (${scope})`;
        const p = path.join(LOG_DIR, `commit-msg-${Date.now()}.txt`);
        writeFileSync(p, `${subject}\n`, { encoding: "utf8" });
        commitCmd = `git commit -F "${p}" --no-verify`;
    }
    tryRun(commitCmd);
}

// --- 6) Rebase & push -------------------------------------------------------
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
    run("git push", { env: { ...process.env, PNPM_PUSH_RUNNING: "1" } });
}

// --- Summary ---------------------------------------------------------------
try {
    const branch = getOutput("git rev-parse --abbrev-ref HEAD");
    const commit = getOutput("git show -s --format=%h %s -1");
    console.log("\n-- Push Summary --");
    console.log(`Status: Success`);
    console.log(`Branch: ${branch}`);
    console.log(`Commit: ${commit}`);
    console.log("Quality gates:");
    if (STEP_TIMES["cf-typegen"])
        console.log(
            `- cf-typegen: ${CF_TYPEGEN ? "OK" : "FAILED"} (${STEP_TIMES["cf-typegen"].ms}ms)`,
        );
    console.log(
        `- Lint (Biome write): ${BIOME_WRITE_RAN ? "Ran" : "Skipped"}${STEP_TIMES["biome-write"] ? ` (${STEP_TIMES["biome-write"].ms}ms)` : ""}`,
    );
    console.log(
        `- TypeScript: ${TSC_OK ? "OK" : STEP_TIMES.tsc ? "FAILED" : "Skipped"}${STEP_TIMES.tsc ? ` (${STEP_TIMES.tsc.ms}ms)` : ""}`,
    );
    console.log(
        `- Unit tests: ${TEST_OK ? "OK" : process.env.SKIP_TESTS === "1" ? "Skipped" : STEP_TIMES.vitest ? "FAILED" : "Skipped"}${STEP_TIMES.vitest ? ` (${STEP_TIMES.vitest.ms}ms)` : ""}`,
    );
    console.log(`- Docs consistency: ${DOCS_OK ? "OK" : "FAILED/Skipped"}`);
    console.log(`- Link check: ${LINKS_OK ? "OK" : "FAILED/Skipped"}`);
    console.log(
        `- Biome final: ${BIOME_FINAL_OK ? "OK" : "FAILED"}${STEP_TIMES["biome-final"] ? ` (${STEP_TIMES["biome-final"].ms}ms)` : ""}`,
    );
    if (STEP_TIMES["docs-checks"])
        console.log(`- Docs/links time: ${STEP_TIMES["docs-checks"].ms}ms`);
    if (STEP_TIMES["next-build"])
        console.log(`- Next.js build time: ${STEP_TIMES["next-build"].ms}ms`);
    console.log(`- Next.js build: ${NEXT_BUILD}`);
    console.log(`\nFull log saved to: ${LOG_PATH}`);
} catch {}
