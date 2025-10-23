#!/usr/bin/env node
import { execSync } from "node:child_process";
/**
 * Docs consistency checks (diff-based only):
 * - If certain files change (package.json, wrangler.toml, .dev.vars.example,
 *   .github/workflows/*.yml, routes/pages, migrations, scripts), require the
 *   corresponding docs to also change in the same diff.
 *
 * Note: repository-wide invariant checks were removed to reduce noise.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function exists(p) {
    try {
        return fs.existsSync(path.join(repoRoot, p));
    } catch {
        return false;
    }
}

function readFile(p) {
    return fs.readFileSync(path.join(repoRoot, p), "utf8");
}

function fileContains(p, token) {
    try {
        return readFile(p).includes(token);
    } catch {
        return false;
    }
}

function listWorkflows() {
    const dir = path.join(repoRoot, ".github", "workflows");
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith(".yml"))
        .map((d) => d.name)
        .sort();
}

function containsNonEnglish(text) {
    // Detect common CJK and full‑width punctuation ranges
    // CJK Unified Ideographs, Extensions A/B (basic coverage), Compatibility Ideographs
    // Hiragana/Katakana, Hangul Syllables, Fullwidth forms
    const re =
        /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u30FF\u31F0-\u31FF\uAC00-\uD7AF\uFF00-\uFFEF]/;
    return re.test(text);
}

function isDocPath(p) {
    return /^docs\/.+\.md$/.test(p) || p === "README.md";
}

function getChangedFiles() {
    // Priority: staged → PR base → last commit
    const results = [];
    try {
        const staged = execSync(
            "git diff --name-only --diff-filter=ACMR --cached",
            {
                stdio: ["ignore", "pipe", "ignore"],
                encoding: "utf8",
            },
        )
            .split(/\r?\n/)
            .filter(Boolean);
        if (staged.length) return staged;
    } catch {
        // ignore: no staged changes or git diff failed
    }

    try {
        const base = process.env.GITHUB_BASE_REF;
        if (base) {
            try {
                execSync(`git fetch origin ${base} --depth=1`, {
                    stdio: "ignore",
                });
            } catch {
                // ignore fetch failures; continue with other diff strategies
            }
            const prDiff = execSync(
                `git diff --name-only origin/${base}...HEAD`,
                {
                    stdio: ["ignore", "pipe", "ignore"],
                    encoding: "utf8",
                },
            )
                .split(/\r?\n/)
                .filter(Boolean);
            if (prDiff.length) return prDiff;
        }
    } catch {
        // ignore: likely not in PR context
    }

    try {
        const last = execSync("git diff --name-only HEAD~1", {
            stdio: ["ignore", "pipe", "ignore"],
            encoding: "utf8",
        })
            .split(/\r?\n/)
            .filter(Boolean);
        if (last.length) return last;
    } catch {
        // ignore: no previous commit or git unavailable
    }

    return results; // empty → invariant checks only
}

function requireDocChange(changed, docFiles, reason, errors) {
    const found = docFiles.some((f) => changed.includes(f));
    if (!found) {
        errors.push(
            `Docs update required: ${reason}. Expected one of: ${docFiles.join(", ")}`,
        );
    }
}

function changedAny(changed, pattern) {
    return changed.some((file) => pattern.test(file));
}

function checkPackageScripts({ changed, errors }) {
    if (!changed.includes("package.json")) return;
    const before = errors.length;
    requireDocChange(
        changed,
        ["README.md", "docs/local-dev.md"],
        "package.json scripts changed",
        errors,
    );
    const hasAuto =
        docHasAnchor("docs/local-dev.md", "SCRIPTS_TABLE_AUTO") ||
        docHasAnchor("README.md", "README_AUTOMATION");
    if (hasAuto && errors.length > before) errors.pop();
}

function checkEnvDocs({ changed, errors }) {
    if (
        !changed.includes("wrangler.toml") &&
        !changed.includes(".dev.vars.example")
    )
        return;
    requireDocChange(
        changed,
        ["docs/env-and-secrets.md"],
        "wrangler.toml or .dev.vars.example changed",
        errors,
    );
}

function checkWorkflowDocs({ changed, errors }) {
    if (!changedAny(changed, /^\.github\/workflows\/[^/]+\.yml$/)) return;
    requireDocChange(
        changed,
        ["docs/ci-cd.md", "README.md"],
        ".github/workflows/*.yml changed",
        errors,
    );
}

function checkRouteDocs({ changed, errors }) {
    const touchedRoutes =
        changedAny(
            changed,
            /(^|\/)src\/(app|modules)\/.*\.(route\.ts|page\.tsx)$/,
        ) || changedAny(changed, /(^|\/)src\/app\/.*\/api\/.*\/route\.ts$/);
    if (!touchedRoutes && !changed.includes("middleware.ts")) return;
    requireDocChange(
        changed,
        ["docs/api-index.md"],
        "routes/pages/API/middleware changed",
        errors,
    );
}

function checkServiceDocs({ changed, errors }) {
    if (!changedAny(changed, /^src\/modules\/[^/]+\/services\/[^/]+\.ts$/))
        return;
    requireDocChange(
        changed,
        ["docs/error-code-index.md"],
        "service layer changed; sync error code index",
        errors,
    );
}

const RATE_LIMIT_DOCS = ["docs/api-index.md", "docs/ratelimit-index.md"];
const RATE_LIMIT_ROUTES = [
    "src/app/api/v1/auth/[...all]/route.ts",
    "src/app/api/v1/creem/create-checkout/route.ts",
    "src/app/api/v1/webhooks/creem/route.ts",
];

function checkRateLimitDocs({ changed, errors }) {
    const touched = RATE_LIMIT_ROUTES.filter((file) => changed.includes(file));
    if (!touched.length) return;
    requireDocChange(
        changed,
        RATE_LIMIT_DOCS,
        "rate-limited route changed; update rate limit documentation",
        errors,
    );
    for (const file of touched) {
        if (!fileContains(file, "applyRateLimit")) {
            errors.push(
                `Rate limit enforcement missing: ${file} should call applyRateLimit()`,
            );
        }
    }
}

function checkMigrationDocs({ changed, errors }) {
    if (!changedAny(changed, /^src\/drizzle\/.*\.sql$/)) return;
    requireDocChange(
        changed,
        ["docs/db-d1.md"],
        "DB migrations changed",
        errors,
    );
}

function checkScriptDocs({ changed, errors }) {
    if (!changedAny(changed, /^scripts\/.+/)) return;
    const before = errors.length;
    requireDocChange(
        changed,
        ["docs/local-dev.md"],
        "scripts/ changed",
        errors,
    );
    if (
        docHasAnchor("docs/local-dev.md", "SCRIPTS_TABLE_AUTO") &&
        errors.length > before
    )
        errors.pop();
}

function enforceEnglishDocs({ changed, errors }) {
    const changedDocs = changed.filter(isDocPath);
    for (const p of changedDocs) {
        try {
            const text = readFile(p);
            if (containsNonEnglish(text)) {
                errors.push(
                    `Docs language must be English only: ${p} contains non-English (CJK) characters`,
                );
            }
        } catch {
            // Ignore read errors; files may have been deleted in the diff
        }
    }
}

const DIFF_RULES = [
    checkPackageScripts,
    checkEnvDocs,
    checkWorkflowDocs,
    checkRouteDocs,
    checkServiceDocs,
    checkRateLimitDocs,
    checkMigrationDocs,
    checkScriptDocs,
];

function runDiffChecks(context) {
    for (const rule of DIFF_RULES) {
        rule(context);
    }
    if (process.env.STRICT_ENGLISH === "1") {
        enforceEnglishDocs(context);
    }
}

function _checkReadmeWorkflows(errors) {
    const readmePath = "README.md";
    if (!exists(readmePath)) return;
    const text = readFile(readmePath);
    const re = /\.github\/workflows\/([\w.-]+\.yml)/g;
    const mentioned = new Set();
    for (const m of text.matchAll(re)) {
        mentioned.add(m[1]);
    }
    if (!mentioned.size) return;
    const actual = new Set(listWorkflows());
    for (const name of mentioned) {
        if (!actual.has(name)) {
            errors.push(
                `README references missing workflow: .github/workflows/${name}`,
            );
        }
    }
}

function _checkIndexInvariants(errors) {
    const idx = "docs/00-index.md";
    if (!exists(idx)) return;
    const t = readFile(idx);
    if (!t.includes("opennext.md")) {
        errors.push("docs/00-index.md should include a link to opennext.md");
    }
    if (!t.includes("style-guide.md")) {
        errors.push("docs/00-index.md should include a link to style-guide.md");
    }
}

function main() {
    const errors = [];
    const changed = getChangedFiles();

    if (changed.length > 0) {
        runDiffChecks({ changed, errors });
    } else {
        console.info(
            "[check-docs] No git diff detected; skipped diff-based checks.",
        );
    }

    if (errors.length) {
        console.error(`\n[check-docs] Found issues:\n- ${errors.join("\n- ")}`);
        process.exit(1);
    } else {
        console.info("[check-docs] OK");
    }
}

main();
function docHasAnchor(p, key) {
    try {
        const t = readFile(p);
        return (
            t.includes(`<!-- DOCSYNC:${key} START -->`) &&
            t.includes(`<!-- DOCSYNC:${key} END -->`)
        );
    } catch {
        return false;
    }
}
