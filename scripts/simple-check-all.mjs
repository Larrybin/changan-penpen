#!/usr/bin/env node
/**
 * Simple Check All - 简化版代码质量检查脚本
 */

import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import {
    checkBom,
    classifyChanges,
    getChangedFiles,
    normalizeDocs,
} from "./lib/quality.mjs";

console.log("🚀 Simple Check All - 简化版代码质量检查");

async function main() {
    const startTime = Date.now();

    try {
        // 1. 获取变更文件
        console.log("\n📁 分析变更文件...");
        const { files: changedFiles, source } = getChangedFiles({
            announceFallback: true,
            commandHint: "pnpm check:all",
        });

        if (changedFiles.length === 0) {
            console.log("✅ 未检测到变更，跳过检查");
            process.exit(0);
        }

        console.log(
            `🔍 检测到 ${changedFiles.length} 个变更文件 (来源: ${source})`,
        );
        changedFiles.forEach((file) => console.log(`  - ${file}`));

        // 2. 分析变更类型
        const changes = classifyChanges(changedFiles);
        console.log(`\n📊 变更分析:`);
        console.log(`  仅文档变更: ${changes.docsOnly}`);
        console.log(`  仅工作流变更: ${changes.workflowsOnly}`);
        console.log(`  代码变更: ${changes.codeChanged}`);
        console.log(`  配置变更: ${changes.bindingsChanged}`);

        // 3. 执行预检查
        console.log("\n📝 执行预检查...");
        await performPreChecks(changedFiles);

        // 4. 执行质量检查
        console.log("\n🔧 执行质量检查...");
        const results = await performChecks(changes);

        // 5. 生成报告
        const report = generateReport(results, startTime, changedFiles);
        displayReport(report);

        // 6. 决定退出码
        if (report.summary.overallSuccess) {
            console.log("\n✅ 所有检查通过！");
            process.exit(0);
        } else {
            console.log("\n❌ 检查失败，请修复问题后重试");
            process.exit(1);
        }
    } catch (error) {
        console.error("\n💥 检查过程中发生错误:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function performPreChecks(changedFiles) {
    // BOM 检查
    const baseList = [
        "package.json",
        "biome.json",
        "components.json",
        "tsconfig.json",
        "tsconfig.translate.json",
        "wrangler.toml",
    ];
    const yamlAndMd = changedFiles.filter(
        (file) =>
            file.match(/\.(yml|yaml|md|mdx)$/) ||
            file.startsWith("docs/") ||
            file.startsWith(".github/"),
    );
    const checkFiles = [...new Set([...baseList, ...yamlAndMd])];

    checkBom(checkFiles, { strictMode: false });

    // 文档规范化
    const docFiles = changedFiles.filter(
        (file) =>
            file.endsWith(".md") ||
            file.endsWith(".mdx") ||
            file === "README.md",
    );
    if (docFiles.length > 0) {
        normalizeDocs(docFiles);
    }
}

async function performChecks(changes) {
    const results = [];

    // 清理缓存
    if (existsSync(".next")) {
        try {
            rmSync(".next", { recursive: true, force: true });
        } catch {}
    }

    // 按顺序执行检查
    const steps = determineExecutionOrder(changes);

    for (const step of steps) {
        const result = await executeStep(step);
        results.push(result);

        if (!result.success) {
            console.log(`❌ ${step} 检查失败，继续其他检查...`);
        }
    }

    return results;
}

function determineExecutionOrder(changes) {
    const order = [];

    if (!changes.docsOnly && !changes.workflowsOnly) {
        order.push("lint", "typecheck");
    }

    if (changes.codeChanged) {
        order.push("test");
        order.push("build");
    }

    return order;
}

async function executeStep(step) {
    const startTime = Date.now();

    try {
        let result;

        switch (step) {
            case "lint":
                result = await runBiomeLint();
                break;
            case "typecheck":
                result = await runTypeScriptCheck();
                break;
            case "test":
                result = await runVitest();
                break;
            case "build":
                result = await runNextBuild();
                break;
            default:
                result = { success: false, message: `未知步骤: ${step}` };
        }

        result.duration = Date.now() - startTime;
        result.step = step;

        return result;
    } catch (error) {
        return {
            success: false,
            step,
            message: error.message,
            duration: Date.now() - startTime,
            error,
        };
    }
}

async function runBiomeLint() {
    try {
        const result = spawnSync("pnpm exec biome check .", {
            shell: true,
            stdio: "pipe",
            encoding: "utf8",
        });

        if (result.status === 0) {
            return { success: true, message: "Biome 检查通过" };
        } else {
            return {
                success: false,
                message: "Biome 检查失败",
                output: result.stdout || result.stderr,
            };
        }
    } catch (error) {
        return { success: false, message: "Biome 检查失败", error };
    }
}

async function runTypeScriptCheck() {
    try {
        const result = spawnSync("pnpm exec tsc --noEmit", {
            shell: true,
            stdio: "pipe",
            encoding: "utf8",
        });

        if (result.status === 0) {
            return { success: true, message: "TypeScript 检查通过" };
        } else {
            return {
                success: false,
                message: "TypeScript 检查失败",
                output: result.stdout || result.stderr,
            };
        }
    } catch (error) {
        return { success: false, message: "TypeScript 检查失败", error };
    }
}

async function runVitest() {
    try {
        const result = spawnSync("pnpm run test:ci", {
            shell: true,
            stdio: "pipe",
            encoding: "utf8",
        });

        if (result.status === 0) {
            return { success: true, message: "Vitest 检查通过" };
        } else {
            return {
                success: false,
                message: "Vitest 检查失败",
                output: result.stdout || result.stderr,
            };
        }
    } catch (error) {
        return { success: false, message: "Vitest 检查失败", error };
    }
}

async function runNextBuild() {
    try {
        const result = spawnSync("pnpm run build", {
            shell: true,
            stdio: "pipe",
            encoding: "utf8",
        });

        if (result.status === 0) {
            return { success: true, message: "Next.js 构建通过" };
        } else {
            return {
                success: false,
                message: "Next.js 构建失败",
                output: result.stdout || result.stderr,
            };
        }
    } catch (error) {
        return { success: false, message: "Next.js 构建失败", error };
    }
}

function generateReport(results, startTime, changedFiles) {
    const totalDuration = Date.now() - startTime;

    return {
        summary: {
            totalSteps: results.length,
            successCount: results.filter((r) => r.success).length,
            failureCount: results.filter((r) => !r.success).length,
            overallSuccess: results.every((r) => r.success),
            totalDuration,
            changedFiles: changedFiles.length,
        },
        details: results,
    };
}

function displayReport(report) {
    console.log(`\n${"=".repeat(60)}`);
    console.log("📋 代码质量检查报告");
    console.log("=".repeat(60));

    const { summary } = report;

    console.log(`\n📊 检查概况:`);
    console.log(`  总步骤数: ${summary.totalSteps}`);
    console.log(`  成功: ${summary.successCount}`);
    console.log(`  失败: ${summary.failureCount}`);
    console.log(`  总耗时: ${(summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`  变更文件: ${summary.changedFiles} 个`);

    console.log(`\n📝 检查详情:`);
    report.details.forEach((detail, index) => {
        const icon = detail.success ? "✅" : "❌";
        const duration = detail.duration ? ` (${detail.duration}ms)` : "";
        console.log(
            `  ${index + 1}. ${icon} ${detail.step}: ${detail.message}${duration}`,
        );

        if (!detail.success && detail.output) {
            // 只显示前几行错误信息
            const lines = detail.output.split("\n").slice(0, 5);
            lines.forEach((line) => console.log(`     ${line}`));
            if (detail.output.split("\n").length > 5) {
                console.log("     ...");
            }
        }
    });

    console.log(`\n${"=".repeat(60)}`);
}

// 主入口
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main };
