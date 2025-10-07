#!/usr/bin/env node
import { execSync } from "node:child_process";
import {
    appendFileSync,
    existsSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error("OPENAI_API_KEY is not set. Skipping AI auto-fix.");
    process.exit(0);
}

const apiBase = (
    process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
).replace(/\/$/, "");
const model =
    process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4.1-mini";

const repo = process.env.GITHUB_REPOSITORY || "";
const runId = process.env.WORKFLOW_RUN_ID || "";
const headSha = process.env.WORKFLOW_HEAD_SHA || "";
const baseDir = process.cwd();

const summaryPath = join(baseDir, "ai-fix-summary.txt");
writeFileSync(summaryPath, "## AI Auto Fix Summary\n\n");

function appendSummary(text) {
    appendFileSync(summaryPath, `${text}\n`);
}

function writeOutput(key, value) {
    const file = process.env.GITHUB_OUTPUT;
    if (!file) return;
    appendFileSync(file, `${key}=${value}\n`);
}

function gatherLogSnippets() {
    const root = join(baseDir, "logs");
    if (!existsSync(root)) {
        return "No logs directory found (logs/).";
    }
    const snippets = [];
    const maxChars = 8000;

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
                    if (
                        lower.includes("error") ||
                        lower.includes("failed") ||
                        lower.includes("exception") ||
                        lower.includes("warning")
                    ) {
                        const start = Math.max(0, i - 8);
                        const end = Math.min(lines.length, i + 12);
                        matches.push(lines.slice(start, end).join("\n"));
                    }
                }
                let snippet;
                if (matches.length) {
                    snippet = matches.join("\n\n---\n\n");
                } else {
                    snippet = lines.slice(-30).join("\n");
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
const metaContext = `Repository: ${repo}\nFailed workflow run: ${runId}\nHead commit: ${headSha}`;

appendSummary(`- Model: ${model}`);
appendSummary(`- API Base: ${apiBase}`);
appendSummary(`- Context: ${metaContext}`);
appendSummary("\n### Log snippets provided to AI\n");
appendSummary(logSummary);
appendSummary("\n---\n");

const systemPrompt =
    "You are a senior TypeScript/Next.js engineer. Provide precise reasoning and reliable patches.";
const analysisPrompt = `${metaContext}\n\nReview the following CI/CD failure logs, explain the root cause, and outline a step-by-step fix plan.\n\n${logSummary}`;
const diffPrompt =
    "Using the analysis above, produce a minimal unified git diff (with file headers) that resolves the issue. If no change is needed, respond with 'NO_DIFF'.";

async function callOpenAI(messages) {
    const response = await fetch(`${apiBase}/responses`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            input: messages,
            max_output_tokens: 2048,
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `OpenAI API request failed: ${response.status} ${text}`,
        );
    }
    const json = await response.json();
    const content =
        json?.output?.[0]?.content?.[0]?.text ?? json?.output_text ?? "";
    return content.trim();
}

function extractDiff(text) {
    const diffBlock = text.match(/```(?:diff|patch)?\s+[\s\S]*?```/);
    if (!diffBlock) return null;
    return diffBlock[0]
        .replace(/^```(?:diff|patch)?\s*/i, "")
        .replace(/```$/, "")
        .trim();
}

let analysisText = "";
let diffText = "";

try {
    analysisText = await callOpenAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: analysisPrompt },
    ]);
    appendSummary("### AI Analysis\n");
    appendSummary(analysisText);
    appendSummary("\n---\n");

    diffText = await callOpenAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: analysisPrompt },
        { role: "assistant", content: analysisText },
        { role: "user", content: diffPrompt },
    ]);
    appendSummary("### AI Proposed Patch\n");
    appendSummary(diffText);
    appendSummary("\n---\n");

    const diff = extractDiff(diffText);
    if (!diff || diff.toUpperCase() === "NO_DIFF") {
        console.warn("AI did not return a usable diff.");
        appendSummary("AI did not provide a patch. Exiting without changes.");
        writeOutput("changed", "false");
        writeOutput("summary_path", summaryPath);
        process.exit(0);
    }

    try {
        execSync("git apply --whitespace=fix", { input: diff, stdio: "pipe" });
    } catch (error) {
        console.error("git apply failed, aborting.", error.message);
        appendSummary(`git apply failed: ${error.message}`);
        writeOutput("changed", "false");
        writeOutput("summary_path", summaryPath);
        process.exit(0);
    }

    let biomeStatus = "success";
    try {
        execSync("pnpm exec biome format --write .", { stdio: "inherit" });
        execSync("pnpm exec biome check .", { stdio: "inherit" });
    } catch (error) {
        biomeStatus = "failed";
        appendSummary(`Biome check failed: ${error.message}`);
    }

    let tscStatus = "success";
    try {
        execSync("pnpm exec tsc --noEmit", { stdio: "inherit" });
    } catch (error) {
        tscStatus = "failed";
        appendSummary(`tsc failed: ${error.message}`);
    }

    appendSummary("### Post-fix command status\n");
    appendSummary(`- biome check: ${biomeStatus}`);
    appendSummary(`- tsc --noEmit: ${tscStatus}`);

    writeOutput("changed", "true");
    writeOutput("summary_path", summaryPath);
    writeOutput("analysis_path", summaryPath);
    writeOutput("biome_status", biomeStatus);
    writeOutput("tsc_status", tscStatus);
} catch (error) {
    console.error("AI auto-fix encountered an error:", error);
    appendSummary(`AI auto-fix error: ${error.message}`);
    writeOutput("changed", "false");
    writeOutput("summary_path", summaryPath);
    process.exit(0);
}
