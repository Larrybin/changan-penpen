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
    } catch {}

    try {
        const base = process.env.GITHUB_BASE_REF;
        if (base) {
            try {
                execSync(`git fetch origin ${base} --depth=1`, {
                    stdio: "ignore",
                });
            } catch {}
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
    } catch {}

    try {
        const last = execSync("git diff --name-only HEAD~1", {
            stdio: ["ignore", "pipe", "ignore"],
            encoding: "utf8",
        })
            .split(/\r?\n/)
            .filter(Boolean);
        if (last.length) return last;
    } catch {}

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
    // Invariant checks removed; only diff-based checks below

    const changed = getChangedFiles();
    const hasChanges = changed.length > 0;

    if (hasChanges) {
        const changedAny = (re) => changed.some((f) => re.test(f));

        // package.json scripts -> README or local-dev docs
        if (changed.includes("package.json")) {
            const before = errors.length;
            requireDocChange(
                changed,
                ["README.md", "docs/local-dev.md"],
                "package.json scripts changed",
                errors,
            );
            // Relax when auto anchors exist (autogen keeps docs in sync even if no diff)
            const hasAuto =
                docHasAnchor("docs/local-dev.md", "SCRIPTS_TABLE_AUTO") ||
                docHasAnchor("README.md", "README_AUTOMATION");
            if (hasAuto && errors.length > before) errors.pop();
        }

        // Env/bindings -> env docs
        if (
            changed.includes("wrangler.toml") ||
            changed.includes(".dev.vars.example")
        ) {
            requireDocChange(
                changed,
                ["docs/env-and-secrets.md"],
                "wrangler.toml or .dev.vars.example changed",
                errors,
            );
        }

        // Workflows -> ci-cd docs
        if (changedAny(/^\.github\/workflows\/[^/]+\.yml$/)) {
            requireDocChange(
                changed,
                ["docs/ci-cd.md", "README.md"],
                ".github/workflows/*.yml changed",
                errors,
            );
        }

        // Routes/pages/API/middleware -> api-index docs
        if (
            changedAny(
                /(^|\/)src\/(app|modules)\/.*\.(route\.ts|page\.tsx)$/,
            ) ||
            changedAny(/(^|\/)src\/app\/.*\/api\/.*\/route\.ts$/) ||
            changed.includes("middleware.ts")
        ) {
            requireDocChange(
                changed,
                ["docs/api-index.md"],
                "routes/pages/API/middleware changed",
                errors,
            );
        }

        // Migrations -> db docs
        if (changedAny(/^src\/drizzle\/.*\.sql$/)) {
            requireDocChange(
                changed,
                ["docs/db-d1.md"],
                "DB migrations changed",
                errors,
            );
        }

        // Scripts -> local dev docs
        if (changedAny(/^scripts\/.+/)) {
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

        // English‑only docs policy (enforced on changed docs)
        if (process.env.STRICT_ENGLISH === "1") {
            const changedDocs = changed.filter(isDocPath);
            for (const p of changedDocs) {
                try {
                    const t = readFile(p);
                    if (containsNonEnglish(t)) {
                        errors.push(
                            `Docs language must be English only: ${p} contains non‑English (CJK) characters`,
                        );
                    }
                } catch {}
            }
        }
    } else {
        // No diff found; nothing to validate
        console.log(
            "[check-docs] No git diff detected; skipped diff-based checks.",
        );
    }

    if (errors.length) {
        console.error(`\n[check-docs] Found issues:\n- ${errors.join("\n- ")}`);
        process.exit(1);
    } else {
        console.log("[check-docs] OK");
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
