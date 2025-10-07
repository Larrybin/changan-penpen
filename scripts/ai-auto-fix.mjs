#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error("OPENAI_API_KEY 未设置，跳过 AI 修复。");
    process.exit(0);
}

const repo = process.env.GITHUB_REPOSITORY;
const runId = process.env.WORKFLOW_RUN_ID;
const headSha = process.env.WORKFLOW_HEAD_SHA || "";
const baseDir = process.cwd();

function gatherLogSnippets() {
    const root = join(baseDir, "logs");
    if (!existsSync(root)) {
        return "未找到日志目录 logs/。";
    }
    const snippets = [];
    const maxChars = 6000;

    function walk(dir) {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            const st = statSync(full);
            if (st.isDirectory()) {
                walk(full);
            } else if (st.isFile() && entry.endsWith(".txt")) {
                const rel = relative(root, full);
                const raw = readFileSync(full, "utf8");
                const lines = raw.split(/\r?\n/);
                const matches = [];
                for (let i = 0; i < lines.length; i++) {
                    const lower = lines[i].toLowerCase();
                    if (lower.includes("error") || lower.includes("failed") || lower.includes("exception")) {
                        const start = Math.max(0, i - 10);
                        const end = Math.min(lines.length, i + 20);
                        matches.push(lines.slice(start, end).join("\n"));
                    }
                }
                let snippet;
                if (matches.length) {
                    snippet = matches.join("\n\n---\n\n");
                } else {
                    snippet = lines.slice(-40).join("\n");
                }
                snippets.push(`### ${rel}\n\n${snippet}`);
            }
        }
    }

    walk(root);
    const combined = snippets.join("\n\n==============================\n\n");
    return combined.slice(0, maxChars);
}

const logSummary = gatherLogSnippets();

const context = `仓库: ${repo}\n失败 workflow run: ${runId}\n(head commit ${headSha})\n`;
const instructions = `你是资深全栈工程师。根据 CI/CD 失败日志，提供可执行的 git diff 修复方案：
1. 先分析问题，有必要时查阅仓库内文件。
2. 输出统一 diff（patch）代码块，适配当前仓库结构。
3. 只生成必要的改动；禁止修改与问题无关的文件。
4. 如果无法确定修复方式，请说明原因。`;

const prompt = `${context}\n\n${instructions}\n\n以下是失败日志片段：\n\n${logSummary}`;

async function callOpenAI() {
    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4.1-mini",
            input: [
                { role: "system", content: "You are a senior TypeScript/Next.js engineer. Always return actionable guidance and accurate diffs." },
                { role: "user", content: prompt },
            ],
            max_output_tokens: 2048,
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI API 请求失败: ${response.status} ${text}`);
    }
    const json = await response.json();
    const output = json?.output?.[0]?.content?.[0]?.text ?? json?.output_text ?? "";
    return output;
}

function extractDiff(text) {
    const diffBlock = text.match(/```diff\s+[\s\S]*?```/);
    if (!diffBlock) return null;
    return diffBlock[0].replace(/```diff\s*/, "").replace(/```$/, "").trim();
}

function writeOutput(key, value) {
    const file = process.env.GITHUB_OUTPUT;
    if (file) {
        appendFileSync(file, `${key}=${value}\n`);
    }
}

try {
    const aiOutput = await callOpenAI();
    console.log("AI 生成内容:\n", aiOutput);
    const diff = extractDiff(aiOutput);
    if (!diff) {
        console.warn("未找到 diff，跳过。");
        writeOutput("changed", "false");
        process.exit(0);
    }
    try {
        execSync("patch -p1", { input: diff, stdio: "inherit" });
    } catch (error) {
        console.error("应用 diff 失败", error.message);
        writeOutput("changed", "false");
        process.exit(0);
    }
    try {
        execSync("pnpm exec biome format --write .", { stdio: "inherit" });
    } catch (err) {
        console.warn("Biome format 失败", err.message);
    }
    writeOutput("changed", "true");
    const summaryPath = join(baseDir, "ai-fix-summary.txt");
    appendFileSync(summaryPath, aiOutput);
    writeOutput("summary_path", summaryPath);
} catch (error) {
    console.error("AI 修复流程异常:", error);
    writeOutput("changed", "false");
    process.exit(0);
}