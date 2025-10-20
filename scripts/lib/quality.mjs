import { spawnSync } from "node:child_process";
import {
    appendFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from "node:fs";
import path from "node:path";

// Normalize Windows shell environment so downstream tools (pnpm, cross-spawn)
// don't inherit an overridden ComSpec that points to PowerShell.
if (process.platform === "win32") {
    const cs = process.env.ComSpec || "";
    if (!/cmd(\.exe)?$/i.test(cs)) {
        process.env.ComSpec = "cmd.exe";
    }
}

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
        // Force a stable shell on Windows to avoid pnpm/npm script-shell overrides
        // that replace cmd.exe with PowerShell and break standard "/d /s /c" args.
        const shellOption = process.platform === "win32" ? "cmd.exe" : true;
        const res = spawnSync(cmd, {
            shell: shellOption,
            encoding: "utf8",
            ...opts,
        });
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
        const shellOption = process.platform === "win32" ? "cmd.exe" : true;
        const res = spawnSync(cmd, {
            shell: shellOption,
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

export function getChangedFiles({
    announceFallback = false,
    commandHint = "pnpm check:all",
} = {}) {
    const fallbackHint = `建议先运行 \`git add -A\` 后再执行 \`${commandHint}\`，以确保校验覆盖最新改动。`;

    const attemptMessages = {
        base: (base) =>
            `未检测到已暂存改动，已改为与 \`origin/${base}\` 对比。${fallbackHint}`,
        range: (range) =>
            `未检测到已暂存改动，已改为使用 CHECK_RANGE="${range}"。${fallbackHint}`,
        head: () =>
            `未检测到已暂存改动，已改为对比上一提交 (HEAD~1)。${fallbackHint}`,
    };

    function captureDiff(args) {
        const res = spawnSync("git", args, { encoding: "utf8" });
        if (res.status !== 0) return [];
        return (res.stdout || "").split(/\r?\n/).filter(Boolean);
    }

    try {
        const staged = captureDiff([
            "diff",
            "--name-only",
            "--diff-filter=ACMR",
            "--cached",
        ]);
        if (staged.length) return { files: staged, source: "staged" };
    } catch {}

    const base = process.env.GITHUB_BASE_REF;
    if (base) {
        try {
            try {
                spawnSync("git", ["fetch", "origin", base, "--depth=1"], {
                    stdio: "ignore",
                });
            } catch {}
            const baseFiles = captureDiff([
                "diff",
                "--name-only",
                `origin/${base}...HEAD`,
            ]);
            if (baseFiles.length) {
                if (announceFallback) console.log(attemptMessages.base(base));
                return { files: baseFiles, source: "base" };
            }
        } catch {}
    }

    const range = process.env.CHECK_RANGE;
    if (range) {
        try {
            const rangeFiles = captureDiff(["diff", "--name-only", range]);
            if (rangeFiles.length) {
                if (announceFallback) console.log(attemptMessages.range(range));
                return { files: rangeFiles, source: "range" };
            }
        } catch {}
    }

    try {
        const headFiles = captureDiff(["diff", "--name-only", "HEAD~1"]);
        if (headFiles.length) {
            if (announceFallback) console.log(attemptMessages.head());
            return { files: headFiles, source: "head" };
        }
    } catch {}

    if (announceFallback) console.log(`未检测到改动。${fallbackHint}`);
    return { files: [], source: "none" };
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
