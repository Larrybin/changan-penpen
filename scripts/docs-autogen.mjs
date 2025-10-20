#!/usr/bin/env node

// Auto‑generate doc fragments into anchored blocks.
// Idempotent: only replaces content between markers.
// Markers: <!-- DOCSYNC:<KEY> START --> ... <!-- DOCSYNC:<KEY> END -->
// First phase coverage:
// - ENV/Bindings:   wrangler.toml, .dev.vars.example  -> docs/env-and-secrets.md
// - Workflows:      .github/workflows/*.yml            -> docs/ci-cd.md (overview table)
// - Scripts table:  package.json                        -> docs/local-dev.md (auto section)
// - API index:      src/app/**/route.ts                -> docs/api-index.md (auto section)
// Controls:
// - DOCS_AUTOGEN=0      skip
// - DOCS_AUTOGEN_SCOPE=changed|all (default: changed; when all, ignore diff and rebuild)
// - DOCS_AUTOGEN_DRY=1  dry-run (no write)

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function getChangedFiles() {
    try {
        const r = spawnSync(
            "git",
            ["diff", "--name-only", "--diff-filter=ACMR", "--cached"],
            { encoding: "utf8" },
        );
        const a = (r.stdout || "").split(/[\r\n]+/).filter(Boolean);
        if (a.length) return a;
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
            const a = (r.stdout || "").split(/[\r\n]+/).filter(Boolean);
            if (a.length) return a;
        }
    } catch {}
    try {
        const r = spawnSync("git", ["diff", "--name-only", "HEAD~1"], {
            encoding: "utf8",
        });
        const a = (r.stdout || "").split(/[\r\n]+/).filter(Boolean);
        if (a.length) return a;
    } catch {}
    return [];
}

function readUtf8(p) {
    return fs.readFileSync(p, "utf8");
}
function writeUtf8(p, s) {
    fs.writeFileSync(p, s, "utf8");
}
function exists(p) {
    return fs.existsSync(p);
}
function rel(p) {
    return path.relative(root, p).replace(/\\/g, "/");
}

function stripJsonc(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function ensureAnchors(text, key) {
    const start = `<!-- DOCSYNC:${key} START -->`;
    const end = `<!-- DOCSYNC:${key} END -->`;
    if (!text.includes(start) || !text.includes(end)) {
        return `${text.trimEnd()}\n\n${start}\n${end}\n`;
    }
    return text;
}

function replaceAnchored(text, key, body) {
    const start = `<!-- DOCSYNC:${key} START -->`;
    const end = `<!-- DOCSYNC:${key} END -->`;
    if (!text.includes(start) || !text.includes(end)) return text; // no-op if anchors missing
    const re = new RegExp(`${start}[\n\rsS]*?${end}`);
    const block = `${start}\n${body.trim()}\n${end}`;
    return text.replace(re, block);
}

function gatherEnvBindings() {
    const out = { bindings: [], vars: [] };
    const wrangler = path.join(root, "wrangler.toml");
    if (exists(wrangler)) {
        try {
            const json = JSON.parse(stripJsonc(readUtf8(wrangler)));
            const b = [];
            const a = json?.vars ? Object.keys(json.vars) : [];
            if (Array.isArray(json?.d1_databases))
                for (const x of json.d1_databases)
                    b.push({
                        type: "D1",
                        name: x?.binding,
                        database_id: x?.database_id,
                    });
            if (Array.isArray(json?.r2_buckets))
                for (const x of json.r2_buckets)
                    b.push({
                        type: "R2",
                        name: x?.binding,
                        bucket_name: x?.bucket_name,
                    });
            if (Array.isArray(json?.kv_namespaces))
                for (const x of json.kv_namespaces)
                    b.push({ type: "KV", name: x?.binding, id: x?.id });
            if (Array.isArray(json?.queues?.producers))
                for (const x of json.queues.producers)
                    b.push({
                        type: "QueueProducer",
                        name: x?.binding,
                        queue: x?.queue,
                    });
            if (Array.isArray(json?.queues?.consumers))
                for (const x of json.queues.consumers)
                    b.push({ type: "QueueConsumer", queue: x?.queue });
            if (json?.ai)
                b.push({
                    type: "AI",
                    name: typeof json.ai === "string" ? json.ai : "AI",
                });
            if (json?.assets)
                b.push({
                    type: "ASSETS",
                    name: json.assets?.binding || "ASSETS",
                });
            out.bindings = b;
            out.vars = a;
        } catch {}
    }
    const devvars = path.join(root, ".dev.vars.example");
    if (exists(devvars)) {
        try {
            const lines = readUtf8(devvars).split(/\r?\n/);
            for (const l of lines) {
                const s = l.trim();
                if (!s || s.startsWith("#")) continue;
                const eq = s.indexOf("=");
                const key = eq > 0 ? s.slice(0, eq).trim() : s;
                if (key && !out.vars.includes(key)) out.vars.push(key);
            }
        } catch {}
    }
    out.vars.sort();
    return out;
}

function renderEnvSection() {
    const { bindings, vars } = gatherEnvBindings();
    const lines = [];
    lines.push("### Cloudflare Bindings (auto)");
    if (bindings.length) {
        lines.push("| Type | Binding | Details |");
        lines.push("| --- | --- | --- |");
        for (const b of bindings) {
            const detail = Object.entries(b)
                .filter(([k]) => k !== "type")
                .map(([k, v]) => `${k}=${v ?? ""}`)
                .join(", ");
            lines.push(
                `| ${b.type} | ${b.name ?? b.queue ?? ""} | ${detail} |`,
            );
        }
    } else {
        lines.push("_No bindings detected_.");
    }
    lines.push("\n### Common Vars (auto)");
    if (vars.length) {
        for (const v of vars) lines.push(`- \`${v}\``);
    } else {
        lines.push("_No variables detected_.");
    }
    return lines.join("\n");
}

function listWorkflows() {
    const dir = path.join(root, ".github", "workflows");
    if (!exists(dir)) return [];
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!e.isFile() || !/\.yml$|\.yaml$/i.test(e.name)) continue;
        const p = path.join(dir, e.name);
        const t = readUtf8(p);
        const name = (t.match(/^\s*name:\s*(.+)$/m)?.[1] || e.name).trim();
        // extract triggers under top-level 'on:'
        const triggers = [];
        const onIdx = t.indexOf("\non:");
        if (onIdx >= 0) {
            const lines = t.slice(onIdx + 1).split(/\r?\n/);
            for (const line of lines) {
                const m = line.match(/^\s{2,}([a-zA-Z_]+):/);
                if (m) triggers.push(m[1]);
                else if (/^\S/.test(line)) break;
            }
        }
        out.push({
            file: rel(p),
            name,
            triggers: Array.from(new Set(triggers)),
        });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}

function renderWorkflowTable() {
    const w = listWorkflows();
    const lines = [
        "### Workflows Overview (auto)",
        "| Workflow | Triggers | File |",
        "| --- | --- | --- |",
    ];
    for (const x of w)
        lines.push(`| ${x.name} | ${x.triggers.join(", ")} | ${x.file} |`);
    if (w.length === 0) lines.push("_No workflows detected_.");
    return lines.join("\n");
}

function readPackageJson() {
    const p = path.join(root, "package.json");
    if (!exists(p)) return { scripts: {} };
    try {
        return JSON.parse(readUtf8(p));
    } catch {
        return { scripts: {} };
    }
}

function renderScriptsTable() {
    const { scripts } = readPackageJson();
    const names = Object.keys(scripts || {}).sort();
    const lines = [
        "### Common Scripts (auto)",
        "| Script | Command |",
        "| --- | --- |",
    ];
    const escapeMdInline = (s) =>
        String(s)
            // 在字符类中无需转义 '['，但需要保留对 ']' 与 '-' 的转义
            .replace(/([`\\|*_{}[\]()#+\-.!])/g, "\\$1")
            .replace(/[\r\n]+/g, " ");
    for (const n of names) {
        const cmd = escapeMdInline(scripts[n] || "");
        lines.push(`| \`${n}\` | \`${cmd}\` |`);
    }
    if (names.length === 0) lines.push("_No scripts_.");
    return lines.join("\n");
}

function renderReadmeAutomation() {
    const { scripts } = readPackageJson();
    const preferred = [
        "dev",
        "dev:cf",
        "build",
        "start",
        "push",
        "check:all",
        "typecheck",
        "lint",
        "deploy:cf",
    ];
    const names = Object.keys(scripts || {});
    const picked = preferred.filter((n) => names.includes(n));
    const lines = [];
    lines.push("### Automation & DevOps (auto)");
    lines.push(
        "- Local push integrates docs sync/autogen, lint/typecheck/build, optional Next build, and rebase & push.",
    );
    lines.push(
        "- No extra commits: changes are amended into the last commit. Set `ALLOW_FORCE_PUSH=1` to handle non-fast-forward push after amend.",
    );
    lines.push(
        "- See more: docs/local-dev.md, docs/ci-cd.md, docs/docs-maintenance.md",
    );
    lines.push("\n#### Common Scripts Snapshot");
    lines.push("| Script | Command |");
    lines.push("| --- | --- |");
    for (const n of picked) {
        const escapeMdInline = (s) =>
            String(s)
                .replace(/([`\\|*_{}[\]()#+\-.!])/g, "\\$1")
                .replace(/[\r\n]+/g, " ");
        const cmd = escapeMdInline(scripts[n] || "");
        lines.push(`| \`${n}\` | \`${cmd}\` |`);
    }
    if (picked.length === 0) lines.push("_No scripts_.");

    const w = listWorkflows();
    const top = w.slice(0, 5);
    lines.push("\n#### Workflows (top)");
    if (top.length) {
        lines.push("| Workflow | Triggers | File |");
        lines.push("| --- | --- | --- |");
        for (const x of top)
            lines.push(`| ${x.name} | ${x.triggers.join(", ")} | ${x.file} |`);
        if (w.length > top.length)
            lines.push(
                `… and ${w.length - top.length} more (see docs/ci-cd.md).`,
            );
    } else {
        lines.push("_No workflows detected_.");
    }
    return lines.join("\n");
}

function renderReadmeStructure() {
    // Prefer parsing AGENTS.md > Project Structure & Module Organization
    try {
        const agents = path.join(root, "AGENTS.md");
        if (exists(agents)) {
            const t = readUtf8(agents);
            const secRe =
                /^##\s+Project Structure\s*&\s*Module Organization\s*$/im;
            const m = t.match(secRe);
            if (m) {
                const idx = m.index || 0;
                const tail = t.slice(idx);
                const linesMd = tail.split(/\r?\n/);
                const out = [];
                let started = false;
                for (const ln of linesMd) {
                    if (!started) {
                        if (/^\s*-\s+/.test(ln)) started = true;
                        else continue;
                    }
                    if (/^\s*##\s+/.test(ln)) break; // next section
                    if (/^\s*-\s+/.test(ln)) {
                        // Keep original bullet text
                        out.push(ln.replace(/^\s*-\s+/, "- "));
                    } else if (started && ln.trim().length) {
                        // Continuation lines – append
                        out.push(ln);
                    }
                }
                if (out.length) {
                    return ["### Project Structure (auto)", ...out].join("\n");
                }
            }
        }
    } catch {}
    // Fallback to probing directories
    const paths = [
        {
            p: "src/app",
            note: "Next.js App Router (pages/api routes, layouts)",
        },
        {
            p: "src/modules",
            note: "Domain modules (actions/components/hooks/models/schemas/utils)",
        },
        { p: "src/components", note: "Reusable UI components" },
        { p: "src/components/ui", note: "Design system primitives" },
        { p: "src/db", note: "Data access" },
        { p: "src/drizzle", note: "D1 migrations" },
        { p: "src/lib", note: "Shared helpers" },
        { p: "public", note: "Static assets" },
        { p: "docs", note: "Project documentation" },
    ];
    const outLines = ["### Project Structure (auto)"];
    for (const it of paths) {
        const abs = path.join(root, it.p);
        if (exists(abs)) outLines.push(`- \`${it.p}\`: ${it.note}`);
    }
    const modsDir = path.join(root, "src", "modules");
    if (exists(modsDir)) {
        try {
            const mods = fs
                .readdirSync(modsDir, { withFileTypes: true })
                .filter((d) => d.isDirectory())
                .map((d) => d.name)
                .sort();
            const show = mods.slice(0, 10).join(", ");
            if (mods.length)
                outLines.push(
                    `- Modules: ${show}${mods.length > 10 ? ` …(+${mods.length - 10})` : ""}`,
                );
        } catch {}
    }
    return outLines.join("\n");
}

function renderReadmeQuality() {
    const lines = ["### Quality Gates (auto)"];
    // Try to extract execution order and toggles from docs/quality-gates.md
    try {
        const q = path.join(root, "docs", "quality-gates.md");
        if (exists(q)) {
            const t = readUtf8(q);
            const idxLocal = t.toLowerCase().indexOf("local push self-check");
            if (idxLocal >= 0) {
                const tail = t.slice(idxLocal);
                const idxExec = tail.toLowerCase().indexOf("execution order:");
                if (idxExec >= 0) {
                    const tail2 = tail.slice(
                        idxExec + "execution order:".length,
                    );
                    const linesRaw = tail2.split(/\r?\n/);
                    const bullets = [];
                    for (const ln of linesRaw) {
                        if (/^\s*\d+\.\s+/.test(ln)) bullets.push(ln.trim());
                        else if (bullets.length && ln.trim() === "") break;
                    }
                    if (bullets.length) {
                        lines.push("- Local push order:");
                        for (const b of bullets.slice(0, 8))
                            lines.push(`  ${b}`);
                    }
                }
                const idxTog = tail
                    .toLowerCase()
                    .indexOf("environment toggles:");
                if (idxTog >= 0) {
                    const tail3 = tail.slice(
                        idxTog + "environment toggles:".length,
                    );
                    const linesRaw = tail3.split(/\r?\n/);
                    const toggles = [];
                    for (const ln of linesRaw) {
                        if (/^\s*-\s+`/.test(ln)) toggles.push(ln.trim());
                        else if (toggles.length && ln.trim() === "") break;
                    }
                    if (toggles.length) {
                        lines.push("- Env toggles:");
                        for (const l of toggles.slice(0, 10))
                            lines.push(`  ${l}`);
                    }
                }
            }
        }
    } catch {}
    // Policy notes
    // Removed Semgrep note; SonarCloud remains the primary CI quality scanner.
    lines.push(
        "- No extra commits: changes are amended into the last commit (ALLOW_FORCE_PUSH=1 for non-fast-forward).",
    );
    return lines.join("\n");
}
function walk(dir, filter) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(p, filter));
        else if (!filter || filter(p)) out.push(p);
    }
    return out;
}

function pageFromRouteFile(p) {
    // src/app/.../route.ts -> /...
    const rp = rel(p);
    const seg = rp.replace(/^src\/app\//, "").replace(/\/route\.ts$/, "");
    return `/${seg
        .replace(/\\+/g, "/")
        .replace(/(^|\/)\(.*?\)\/?/g, "$1")
        .replace(/\/$/, "")}`;
}

function extractHttpMethods(t) {
    const methods = new Set();
    const re =
        /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
    for (const m of t.matchAll(re)) methods.add(m[1]);
    return Array.from(methods).sort();
}

function renderApiIndex() {
    const appDir = path.join(root, "src", "app");
    if (!exists(appDir)) return "_src/app not found_.";
    const files = walk(appDir, (p) =>
        /\/route\.ts$/.test(p.replace(/\\/g, "/")),
    ).sort();
    const rows = [];
    for (const f of files) {
        const t = readUtf8(f);
        const methods = extractHttpMethods(t);
        rows.push({ path: pageFromRouteFile(f), file: rel(f), methods });
    }
    const lines = [
        "### API Index (auto)",
        "| Path | Methods | File |",
        "| --- | --- | --- |",
    ];
    for (const r of rows)
        lines.push(`| ${r.path} | ${r.methods.join(", ")} | ${r.file} |`);
    if (rows.length === 0) lines.push("_No routes detected_.");
    return lines.join("\n");
}

function applyToFile(pRel, sections) {
    const p = path.join(root, pRel);
    if (!exists(p)) return false;
    let text = readUtf8(p);
    let changed = false;
    for (const [key, body] of sections) {
        const before = text;
        text = ensureAnchors(text, key);
        text = replaceAnchored(text, key, body);
        if (text !== before) changed = true;
    }
    return changed ? text : null;
}

function main() {
    if (process.env.DOCS_AUTOGEN === "0") {
        console.log("[docs-autogen] Skipped (DOCS_AUTOGEN=0)");
        process.exit(0);
    }
    const scope = (process.env.DOCS_AUTOGEN_SCOPE || "changed").toLowerCase();
    const dry = process.env.DOCS_AUTOGEN_DRY === "1";
    const changed = new Set(getChangedFiles());

    const shouldRun = (paths) => {
        if (scope === "all") return true;
        return paths.some((p) =>
            Array.from(changed).some((c) => c.startsWith(p)),
        );
    };

    const results = [];
    // ENV & Bindings
    if (shouldRun(["wrangler.toml", ".dev.vars.example"])) {
        const body = renderEnvSection();
        const updated = applyToFile("docs/env-and-secrets.md", [
            ["ENV_BINDINGS", body],
        ]);
        if (updated != null && !dry)
            writeUtf8(path.join(root, "docs/env-and-secrets.md"), updated);
        if (updated != null) results.push("docs/env-and-secrets.md");
    }

    // Workflows overview
    if (shouldRun([".github/workflows/"])) {
        const body = renderWorkflowTable();
        const updated = applyToFile("docs/ci-cd.md", [
            ["WORKFLOWS_TABLE", body],
        ]);
        if (updated != null && !dry)
            writeUtf8(path.join(root, "docs/ci-cd.md"), updated);
        if (updated != null) results.push("docs/ci-cd.md");
    }

    // Scripts table
    if (shouldRun(["package.json"])) {
        const body = renderScriptsTable();
        const updated = applyToFile("docs/local-dev.md", [
            ["SCRIPTS_TABLE_AUTO", body],
        ]);
        if (updated != null && !dry)
            writeUtf8(path.join(root, "docs/local-dev.md"), updated);
        if (updated != null) results.push("docs/local-dev.md");
    }

    // API index
    if (shouldRun(["src/app/"])) {
        const body = renderApiIndex();
        const updated = applyToFile("docs/api-index.md", [["API_INDEX", body]]);
        if (updated != null && !dry)
            writeUtf8(path.join(root, "docs/api-index.md"), updated);
        if (updated != null) results.push("docs/api-index.md");
    }

    // README snapshots
    if (
        shouldRun([
            "package.json",
            ".github/workflows/",
            "scripts/",
            "src/",
            "docs/quality-gates.md",
            "AGENTS.md",
        ])
    ) {
        const sections = [
            ["README_AUTOMATION", renderReadmeAutomation()],
            ["README_STRUCTURE", renderReadmeStructure()],
            ["README_QUALITY_GATES", renderReadmeQuality()],
        ];
        const updated = applyToFile("README.md", sections);
        if (updated != null && !dry)
            writeUtf8(path.join(root, "README.md"), updated);
        if (updated != null) results.push("README.md");
    }

    const logDir = path.join(root, "logs");
    try {
        fs.mkdirSync(logDir, { recursive: true });
    } catch {}
    const outFile = path.join(logDir, "docs-autogen-changed.json");
    try {
        writeUtf8(
            outFile,
            JSON.stringify({ scope, dryRun: dry, changed: results }, null, 2),
        );
    } catch {}
    console.log(
        `[docs-autogen] Updated ${results.length} file(s).${dry ? " (dry-run)" : ""}`,
    );
}

main();
