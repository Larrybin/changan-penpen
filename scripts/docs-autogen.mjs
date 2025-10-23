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
const LOG_PREFIX = "[docs-autogen]";
const VERBOSE = process.env.DOCS_AUTOGEN_VERBOSE === "1";

const logInfo = (message, ...rest) =>
    console.info(`${LOG_PREFIX} ${message}`, ...rest);
const logWarn = (message, ...rest) =>
    console.warn(`${LOG_PREFIX} ${message}`, ...rest);
const logDebug = (message, ...rest) => {
    if (VERBOSE) console.info(`${LOG_PREFIX} [debug] ${message}`, ...rest);
};

const describeError = (error) =>
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

function getChangedFiles() {
    try {
        const r = spawnSync(
            "git",
            ["diff", "--name-only", "--diff-filter=ACMR", "--cached"],
            { encoding: "utf8" },
        );
        const a = (r.stdout || "").split(/[\r\n]+/).filter(Boolean);
        if (a.length) return a;
    } catch (error) {
        logDebug("git diff --cached failed", describeError(error));
    }
    try {
        const base = process.env.GITHUB_BASE_REF;
        if (base) {
            try {
                spawnSync("git", ["fetch", "origin", base, "--depth=1"], {
                    stdio: "ignore",
                });
            } catch (error) {
                logDebug(
                    `git fetch origin ${base} failed`,
                    describeError(error),
                );
            }
            const r = spawnSync(
                "git",
                ["diff", "--name-only", `origin/${base}...HEAD`],
                { encoding: "utf8" },
            );
            const a = (r.stdout || "").split(/[\r\n]+/).filter(Boolean);
            if (a.length) return a;
        }
    } catch (error) {
        logDebug("git diff vs base branch failed", describeError(error));
    }
    try {
        const r = spawnSync("git", ["diff", "--name-only", "HEAD~1"], {
            encoding: "utf8",
        });
        const a = (r.stdout || "").split(/[\r\n]+/).filter(Boolean);
        if (a.length) return a;
    } catch (error) {
        logDebug("git diff HEAD~1 failed", describeError(error));
    }
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

const bindingExtractors = [
    {
        key: "d1_databases",
        map: (entry) => ({
            type: "D1",
            name: entry?.binding,
            database_id: entry?.database_id,
        }),
    },
    {
        key: "r2_buckets",
        map: (entry) => ({
            type: "R2",
            name: entry?.binding,
            bucket_name: entry?.bucket_name,
        }),
    },
    {
        key: "kv_namespaces",
        map: (entry) => ({ type: "KV", name: entry?.binding, id: entry?.id }),
    },
    {
        key: ["queues", "producers"],
        map: (entry) => ({
            type: "QueueProducer",
            name: entry?.binding,
            queue: entry?.queue,
        }),
    },
    {
        key: ["queues", "consumers"],
        map: (entry) => ({ type: "QueueConsumer", queue: entry?.queue }),
    },
];

const singletonBindingExtractors = [
    {
        key: "ai",
        map: (value) => ({
            type: "AI",
            name: typeof value === "string" ? value : "AI",
        }),
    },
    {
        key: "assets",
        map: (value) => ({
            type: "ASSETS",
            name: value?.binding || "ASSETS",
        }),
    },
];

const normalizeArray = (maybeArray) =>
    Array.isArray(maybeArray) ? maybeArray.filter(Boolean) : [];

const deepGet = (obj, pathSegments) => {
    if (!obj) return undefined;
    return pathSegments.reduce(
        (acc, segment) => (acc && segment in acc ? acc[segment] : undefined),
        obj,
    );
};

function parseWranglerConfig(filePath) {
    if (!exists(filePath)) return null;
    try {
        return JSON.parse(stripJsonc(readUtf8(filePath)));
    } catch (error) {
        logWarn(
            "unable to parse wrangler.toml; binding metadata will be limited",
            describeError(error),
        );
        return null;
    }
}

function collectBindingRecords(config) {
    if (!config) return [];
    const bindings = [];
    for (const extractor of bindingExtractors) {
        const target = Array.isArray(extractor.key)
            ? deepGet(config, extractor.key)
            : config?.[extractor.key];
        for (const entry of normalizeArray(target)) {
            bindings.push(extractor.map(entry));
        }
    }
    for (const extractor of singletonBindingExtractors) {
        const value = config?.[extractor.key];
        if (value) bindings.push(extractor.map(value));
    }
    return bindings;
}

function collectWranglerVarKeys(config) {
    if (!config?.vars) return [];
    try {
        return Object.keys(config.vars);
    } catch (error) {
        logWarn(
            "unable to enumerate vars from wrangler config",
            describeError(error),
        );
        return [];
    }
}

function readDevVarKeys(filePath) {
    if (!exists(filePath)) return [];
    try {
        return readUtf8(filePath)
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"))
            .map((line) => {
                const eq = line.indexOf("=");
                return eq > 0 ? line.slice(0, eq).trim() : line;
            })
            .filter(Boolean);
    } catch (error) {
        logWarn("unable to parse .dev.vars.example", describeError(error));
        return [];
    }
}

function uniqueSorted(values) {
    return Array.from(new Set(values)).sort();
}

function gatherEnvBindings() {
    const wranglerPath = path.join(root, "wrangler.toml");
    const wranglerConfig = parseWranglerConfig(wranglerPath);
    const bindings = collectBindingRecords(wranglerConfig);
    const wranglerVars = collectWranglerVarKeys(wranglerConfig);
    const devVarPath = path.join(root, ".dev.vars.example");
    const devVarKeys = readDevVarKeys(devVarPath);
    return { bindings, vars: uniqueSorted([...wranglerVars, ...devVarKeys]) };
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

const WORKFLOW_FILE_PATTERN = /\.ya?ml$/i;

const extractWorkflowTriggers = (text) => {
    const triggers = new Set();
    const onIdx = text.indexOf("\non:");
    if (onIdx < 0) return [];
    const lines = text.slice(onIdx + 1).split(/\r?\n/);
    for (const line of lines) {
        const match = line.match(/^\s{2,}([a-zA-Z_]+):/);
        if (match) triggers.add(match[1]);
        else if (/^\S/.test(line)) break;
    }
    return Array.from(triggers);
};

const deriveWorkflowName = (text, fallback) => {
    const match = text.match(/^\s*name:\s*(.+)$/m);
    return (match?.[1] || fallback).trim();
};

const parseWorkflowFile = (filePath) => {
    try {
        const contents = readUtf8(filePath);
        return {
            file: rel(filePath),
            name: deriveWorkflowName(contents, path.basename(filePath)),
            triggers: extractWorkflowTriggers(contents),
        };
    } catch (error) {
        logWarn(
            `unable to read workflow definition at ${rel(filePath)}`,
            describeError(error),
        );
        return null;
    }
};

function listWorkflows() {
    const dir = path.join(root, ".github", "workflows");
    if (!exists(dir)) return [];
    const entries = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter(
            (entry) => entry.isFile() && WORKFLOW_FILE_PATTERN.test(entry.name),
        );
    const workflows = [];
    for (const entry of entries) {
        const parsed = parseWorkflowFile(path.join(dir, entry.name));
        if (parsed) workflows.push(parsed);
    }
    return workflows.sort((a, b) => a.name.localeCompare(b.name));
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

const AGENTS_STRUCTURE_SECTION =
    /^##\s+Project Structure\s*&\s*Module Organization\s*$/im;

const parseStructureFromAgents = () => {
    const agents = path.join(root, "AGENTS.md");
    if (!exists(agents)) return null;
    try {
        const text = readUtf8(agents);
        const match = text.match(AGENTS_STRUCTURE_SECTION);
        if (!match) return null;
        const startIndex = match.index || 0;
        const lines = text.slice(startIndex).split(/\r?\n/);
        const bullets = [];
        let started = false;
        for (const line of lines) {
            if (!started) {
                if (/^\s*-\s+/.test(line)) started = true;
                else continue;
            }
            if (/^\s*##\s+/.test(line)) break;
            if (/^\s*-\s+/.test(line))
                bullets.push(line.replace(/^\s*-\s+/, "- "));
            else if (line.trim()) bullets.push(line);
        }
        return bullets.length ? bullets : null;
    } catch (error) {
        logDebug(
            "failed to parse AGENTS.md project structure",
            describeError(error),
        );
        return null;
    }
};

const fallbackStructurePaths = [
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

const summarizeModulesDirectory = () => {
    const modsDir = path.join(root, "src", "modules");
    if (!exists(modsDir)) return null;
    try {
        const modules = fs
            .readdirSync(modsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort();
        if (!modules.length) return null;
        const shown = modules.slice(0, 10).join(", ");
        const overflow =
            modules.length > 10 ? ` …(+${modules.length - 10})` : "";
        return `- Modules: ${shown}${overflow}`;
    } catch (error) {
        logWarn(
            "unable to enumerate src/modules for README snapshot",
            describeError(error),
        );
        return null;
    }
};

const buildFallbackStructureLines = () => {
    const lines = [];
    for (const { p, note } of fallbackStructurePaths) {
        if (exists(path.join(root, p))) lines.push(`- \`${p}\`: ${note}`);
    }
    const moduleSummary = summarizeModulesDirectory();
    if (moduleSummary) lines.push(moduleSummary);
    return lines;
};

function renderReadmeStructure() {
    const fromAgents = parseStructureFromAgents();
    const bodyLines = fromAgents ?? buildFallbackStructureLines();
    return ["### Project Structure (auto)", ...bodyLines].join("\n");
}

const collectListAfterLabel = (lines, label, pattern) => {
    const target = label.toLowerCase();
    const collected = [];
    let scanning = false;
    for (const line of lines) {
        if (!scanning) {
            if (line.toLowerCase().includes(target)) scanning = true;
            continue;
        }
        if (pattern.test(line)) collected.push(line.trim());
        else if (collected.length && line.trim() === "") break;
    }
    return collected;
};

const parseQualityDoc = () => {
    const docPath = path.join(root, "docs", "quality-gates.md");
    if (!exists(docPath)) return { order: [], toggles: [] };
    try {
        const text = readUtf8(docPath);
        const anchorIndex = text.toLowerCase().indexOf("local push self-check");
        if (anchorIndex < 0) return { order: [], toggles: [] };
        const sectionLines = text.slice(anchorIndex).split(/\r?\n/);
        return {
            order: collectListAfterLabel(
                sectionLines,
                "execution order:",
                /^\s*\d+\.\s+/,
            ).slice(0, 8),
            toggles: collectListAfterLabel(
                sectionLines,
                "environment toggles:",
                /^\s*-\s+`/,
            ).slice(0, 10),
        };
    } catch (error) {
        logDebug(
            "failed to derive quality gates from docs/quality-gates.md",
            describeError(error),
        );
        return { order: [], toggles: [] };
    }
};

function renderReadmeQuality() {
    const lines = ["### Quality Gates (auto)"];
    const { order, toggles } = parseQualityDoc();
    if (order.length) {
        lines.push("- Local push order:");
        for (const entry of order) lines.push(`  ${entry}`);
    }
    if (toggles.length) {
        lines.push("- Env toggles:");
        for (const entry of toggles) lines.push(`  ${entry}`);
    }
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

const shouldRunTask = (scopeMode, changedFiles, watchedPaths) => {
    if (scopeMode === "all") return true;
    if (!watchedPaths || watchedPaths.length === 0) return false;
    return watchedPaths.some((watch) =>
        changedFiles.some((file) => file.startsWith(watch)),
    );
};

const runAutogenTask = (task, context) => {
    if (!shouldRunTask(context.scope, context.changedFiles, task.watch))
        return null;
    const sections = task.buildSections();
    const updated = applyToFile(task.output, sections);
    if (updated == null) return null;
    if (!context.dryRun) writeUtf8(path.join(root, task.output), updated);
    return task.output;
};

function main() {
    if (process.env.DOCS_AUTOGEN === "0") {
        logInfo("Skipped (DOCS_AUTOGEN=0)");
        process.exit(0);
    }
    const context = {
        scope: (process.env.DOCS_AUTOGEN_SCOPE || "changed").toLowerCase(),
        dryRun: process.env.DOCS_AUTOGEN_DRY === "1",
        changedFiles: getChangedFiles(),
    };
    const tasks = [
        {
            watch: ["wrangler.toml", ".dev.vars.example"],
            output: "docs/env-and-secrets.md",
            buildSections: () => [["ENV_BINDINGS", renderEnvSection()]],
        },
        {
            watch: [".github/workflows/"],
            output: "docs/ci-cd.md",
            buildSections: () => [["WORKFLOWS_TABLE", renderWorkflowTable()]],
        },
        {
            watch: ["package.json"],
            output: "docs/local-dev.md",
            buildSections: () => [["SCRIPTS_TABLE_AUTO", renderScriptsTable()]],
        },
        {
            watch: ["src/app/"],
            output: "docs/api-index.md",
            buildSections: () => [["API_INDEX", renderApiIndex()]],
        },
        {
            watch: [
                "package.json",
                ".github/workflows/",
                "scripts/",
                "src/",
                "docs/quality-gates.md",
                "AGENTS.md",
            ],
            output: "README.md",
            buildSections: () => [
                ["README_AUTOMATION", renderReadmeAutomation()],
                ["README_STRUCTURE", renderReadmeStructure()],
                ["README_QUALITY_GATES", renderReadmeQuality()],
            ],
        },
    ];

    const results = [];
    for (const task of tasks) {
        const output = runAutogenTask(task, context);
        if (output) results.push(output);
    }

    const logDir = path.join(root, "logs");
    try {
        fs.mkdirSync(logDir, { recursive: true });
    } catch (error) {
        logWarn("unable to create logs directory", describeError(error));
    }
    const outFile = path.join(logDir, "docs-autogen-changed.json");
    try {
        writeUtf8(
            outFile,
            JSON.stringify(
                {
                    scope: context.scope,
                    dryRun: context.dryRun,
                    changed: results,
                },
                null,
                2,
            ),
        );
    } catch (error) {
        logWarn(
            "unable to persist docs-autogen change summary",
            describeError(error),
        );
    }
    logInfo(
        `Updated ${results.length} file(s).${
            context.dryRun ? " (dry-run)" : ""
        }`,
    );
}

main();
