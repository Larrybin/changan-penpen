import { spawnSync } from "node:child_process";
import {
    appendFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from "node:fs";
import path from "node:path";

function timestamp(prefix) {
    return `${prefix}-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .replace("Z", "")}.log`;
}

export class QualitySession {
    constructor({
        logDirEnvVar = "PUSH_LOG_DIR",
        logFileEnvVar = "PUSH_LOG_FILE",
        prefix = "quality",
        defaultLogDir = "logs",
    } = {}) {
        this.times = Object.create(null);
        const envLogDir = process.env[logDirEnvVar]?.trim();
        this.logDir = envLogDir?.length ? envLogDir : defaultLogDir;
        try {
            mkdirSync(this.logDir, { recursive: true });
        } catch {}
        const envLogFile = process.env[logFileEnvVar]?.trim();
        this.logPath = envLogFile?.length
            ? envLogFile
            : path.join(this.logDir, timestamp(prefix));
    }

    logLine(line = "") {
        try {
            appendFileSync(this.logPath, `${line}\n`);
        } catch {}
    }

    timeStart(name) {
        this.times[name] = { start: Date.now(), ms: 0 };
    }

    timeEnd(name) {
        const entry = this.times[name];
        if (entry?.start) entry.ms = Date.now() - entry.start;
    }

    run(cmd, opts = {}) {
        const header = `\n$ ${cmd}`;
        console.log(header);
        this.logLine(header);
        const res = spawnSync(cmd, { shell: true, encoding: "utf8", ...opts });
        if (res.stdout) {
            process.stdout.write(res.stdout);
            this.logLine(res.stdout.trimEnd());
        }
        if (res.stderr) {
            process.stderr.write(res.stderr);
            this.logLine(res.stderr.trimEnd());
        }
        if (res.status !== 0)
            throw new Error(res.stderr || `Command failed: ${cmd}`);
        return res;
    }

    tryRun(cmd, opts = {}) {
        try {
            this.run(cmd, opts);
            return true;
        } catch {
            return false;
        }
    }

    getOutput(cmd, opts = {}) {
        const res = spawnSync(cmd, {
            shell: true,
            encoding: "utf8",
            ...opts,
        });
        if (res.error) throw res.error;
        if (res.status !== 0)
            throw new Error(res.stderr || `Command failed: ${cmd}`);
        return (res.stdout || "").trim();
    }

    getTimes() {
        return this.times;
    }

    getLogPath() {
        return this.logPath;
    }
}

export function checkBom(files, { strictMode = false } = {}) {
    const bad = [];
    for (const f of files) {
        try {
            if (!existsSync(f)) continue;
            const contents = readFileSync(f);
            if (
                contents.length >= 3 &&
                contents[0] === 0xef &&
                contents[1] === 0xbb &&
                contents[2] === 0xbf
            )
                bad.push(f);
        } catch {}
    }
    if (!bad.length) return;
    if (strictMode) {
        console.error(
            `\n[check-bom] UTF-8 BOM detected in: ${bad.join(
                ", ",
            )}. Save as UTF-8 (no BOM) and re-run.`,
        );
        process.exit(1);
    }
    for (const file of bad) {
        try {
            const buf = readFileSync(file);
            const stripped = buf.slice(3);
            writeFileSync(file, stripped);
            console.log(`[check-bom] Stripped BOM: ${file}`);
        } catch (error) {
            console.error(
                `[check-bom] Failed to strip BOM for ${file}:`,
                error,
            );
            process.exit(1);
        }
    }
}

const DOC_PUNCT_MAP = new Map([
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
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
const NBSP_RE = /\u00A0|\u3000/g;

export function normalizeDocs(files, { strictMode = false } = {}) {
    for (const file of files) {
        try {
            if (!existsSync(file)) continue;
            const original = readFileSync(file, "utf8");
            const withoutBom =
                original.charCodeAt(0) === 0xfeff
                    ? original.slice(1)
                    : original;
            if (strictMode && withoutBom !== original) {
                console.error(
                    `[docs-normalize] BOM detected in ${file}. Remove it and re-run.`,
                );
                process.exit(1);
            }
            if (strictMode) continue;
            const parts = withoutBom.split(/```/g);
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 1) continue;
                let seg = parts[i];
                seg = seg.replace(ZERO_WIDTH_RE, "");
                seg = seg.replace(NBSP_RE, " ");
                seg = seg.replace(/[ \t]+$/gm, "");
                for (const [from, to] of DOC_PUNCT_MAP)
                    seg = seg.replace(new RegExp(from, "g"), to);
                parts[i] = seg;
            }
            let output = parts.join("```");
            output = output.replace(/\r\n?/g, "\n");
            if (!output.endsWith("\n")) output += "\n";
            if (output !== original)
                writeFileSync(file, output, { encoding: "utf8" });
        } catch (error) {
            console.error(
                `[docs-normalize] Failed for ${file}:`,
                error?.message || error,
            );
            throw error;
        }
    }
}

export function getTrackedFiles(globs) {
    try {
        const args = ["ls-files", "-z", "--", ...globs];
        const res = spawnSync("git", args, { encoding: "utf8" });
        if (res.status !== 0) return [];
        return (res.stdout || "")
            .split("\u0000")
            .map((item) => item.trim())
            .filter(Boolean);
    } catch {
        return [];
    }
}

export function getChangedFiles() {
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
            const res = spawnSync(
                "git",
                ["diff", "--name-only", `origin/${base}...HEAD`],
                { encoding: "utf8" },
            );
            const lines = (res.stdout || "").split(/\r?\n/).filter(Boolean);
            if (lines.length) return lines;
        }
    } catch {}
    try {
        const range = process.env.CHECK_RANGE;
        if (range) {
            const res = spawnSync("git", ["diff", "--name-only", range], {
                encoding: "utf8",
            });
            const lines = (res.stdout || "").split(/\r?\n/).filter(Boolean);
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

export function classifyChanges(files) {
    const isDocs = (f) => f === "README.md" || f.startsWith("docs/");
    const isFlow = (f) =>
        f.startsWith(".github/workflows/") || f.startsWith(".github/actions/");
    const isBind = (f) =>
        f === "wrangler.toml" ||
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

export function summarizeScope(files) {
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
    if (files.some((f) => f.startsWith("scripts/"))) scopeBits.add("scripts");
    return Array.from(scopeBits).join(", ") || "auto";
}
