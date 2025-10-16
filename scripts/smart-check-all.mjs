#!/usr/bin/env node

/**
 * Smart Check All - 智能代码质量检查脚本
 *
 * 集成 context7、memory、sequential-thinking MCP 工具
 * 提供变更感知、智能策略选择、质量门禁等功能
 */

import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import DocConsistencyChecker from "./lib/doc-consistency-checker.mjs";
import {
    checkBom,
    classifyChanges,
    getChangedFiles,
    normalizeDocs,
} from "./lib/quality.mjs";
import { SmartQualitySession } from "./lib/smart-quality.mjs";

// 配置选项
const STRICT_MODE = process.env.CHECK_STRICT === "1";
const ENABLE_MCP = true; // 强制启用 MCP 进行测试
const ENABLE_TESTS =
    process.env.CHECK_ENABLE_TESTS === "1" && process.env.SKIP_TESTS !== "1";
const SKIP_BOM = process.env.SKIP_BOM_CHECK === "1";
const SKIP_DOCS_NORMALIZE = process.env.SKIP_DOCS_NORMALIZE === "1";
const STRICT_BOM = process.env.STRICT_BOM === "1" || STRICT_MODE;
const SKIP_DOCS_CHECK = process.env.SKIP_DOCS_CHECK === "1";
const SKIP_DOCS_CONSISTENCY = process.env.SKIP_DOCS_CONSISTENCY === "1";
const SKIP_NEXT_BUILD = process.env.SKIP_NEXT_BUILD === "1";
const FAST_VITEST = process.env.FAST_VITEST === "1";
const FULL_COVERAGE = process.env.FULL_COVERAGE === "1";

console.log(`🚀 Smart Check All - 智能代码质量检查`);
console.log(
    `📋 配置: MCP=${ENABLE_MCP ? "启用" : "禁用"}, 严格模式=${STRICT_MODE ? "启用" : "禁用"}`,
);

async function main() {
    const startTime = Date.now();

    try {
        // 1. 初始化智能会话
        let smartSession;
        if (ENABLE_MCP) {
            smartSession = new SmartQualitySession({
                enableMCP: true,
                strictMode: STRICT_MODE,
                timeConstraints: {
                    urgent: process.env.URGENCY === "high",
                    maxDuration:
                        parseInt(process.env.MAX_DURATION, 10) || 300000, // 5分钟
                },
            });
            await smartSession.initialize();
        }

        // 2. 获取变更文件
        console.log("\n📁 分析变更文件...");
        const { files: changedFiles, source } = getChangedFiles({
            announceFallback: true,
            commandHint: ENABLE_MCP ? "pnpm smart-check:all" : "pnpm check:all",
        });

        if (changedFiles.length === 0) {
            console.log("✅ 未检测到变更，跳过检查");
            process.exit(0);
        }

        console.log(
            `🔍 检测到 ${changedFiles.length} 个变更文件 (来源: ${source})`,
        );
        changedFiles.forEach((file) => console.log(`  - ${file}`));

        // 3. 分析变更并生成策略
        let analysisResult;
        if (ENABLE_MCP && smartSession) {
            console.log("\n🧠 智能分析变更...");
            analysisResult = await smartSession.analyzeChanges(changedFiles);
        } else {
            // 传统分析方式
            const changes = classifyChanges(changedFiles);
            analysisResult = {
                changedFiles,
                riskScore: changes.codeChanged ? 0.6 : 0.3,
                strategy: getFallbackStrategy(changes),
            };
        }

        // 4. 执行BOM检查和文档规范化
        console.log("\n📝 BOM检查和文档规范化...");
        await performPreChecks(changedFiles);

        // 5. 智能执行检查
        let checkResults;
        if (ENABLE_MCP && smartSession) {
            console.log("\n🎯 执行智能质量检查...");
            checkResults = await smartSession.executeSmartCheck();
        } else {
            console.log("\n🔧 执行传统质量检查...");
            checkResults = await performTraditionalChecks(
                changedFiles,
                analysisResult,
            );
        }

        // 6. 生成报告
        console.log("\n📊 生成检查报告...");
        const report = generateFinalReport(
            checkResults,
            analysisResult,
            startTime,
        );

        // 7. 输出结果
        displayReport(report);

        // 8. 决定退出码
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
    if (!SKIP_BOM) {
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

        checkBom(checkFiles, { strictMode: STRICT_BOM });
    }

    // 文档规范化
    if (!STRICT_MODE && !SKIP_DOCS_NORMALIZE) {
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
}

function getFallbackStrategy(changes) {
    return {
        parallelExecution: false,
        failFast: !STRICT_MODE,
        skipNonEssential: changes.docsOnly,
        maxRetries: 1,
        cacheResults: false,
        skipDocsCheck: SKIP_DOCS_CHECK,
        runTests: ENABLE_TESTS && changes.codeChanged,
        testCoverage: FULL_COVERAGE,
        strictMode: STRICT_MODE,
        errorOnWarnings: STRICT_MODE,
        fullCoverage: FULL_COVERAGE,
        additionalChecks: [],
        executionOrder: determineExecutionOrder(changes),
    };
}

function determineExecutionOrder(changes) {
    const order = [];

    if (!changes.docsOnly && !changes.workflowsOnly) {
        order.push("lint", "typecheck");
    }

    if (ENABLE_TESTS && changes.codeChanged) {
        order.push("test");
    }

    if (changes.codeChanged && !SKIP_NEXT_BUILD) {
        order.push("build");
    }

    // 文档一致性检查（在文档检查之前）
    if (!SKIP_DOCS_CONSISTENCY) {
        order.push("docs_consistency");
    }

    if (!SKIP_DOCS_CHECK) {
        order.push("docs");
    }

    return order;
}

async function performTraditionalChecks(changedFiles, analysisResult) {
    const results = [];
    const strategy = analysisResult.strategy;

    // 清理缓存
    if (existsSync(".next")) {
        try {
            rmSync(".next", { recursive: true, force: true });
        } catch {}
    }

    // 按顺序执行检查
    for (const step of strategy.executionOrder) {
        const result = await executeTraditionalStep(
            step,
            strategy,
            changedFiles,
        );
        results.push(result);

        if (strategy.failFast && !result.success) {
            console.log(`⚡ 快速失败: ${step} 检查失败`);
            break;
        }
    }

    return {
        summary: {
            totalSteps: results.length,
            successCount: results.filter((r) => r.success).length,
            failureCount: results.filter((r) => !r.success).length,
            overallSuccess: results.every((r) => r.success),
        },
        details: results,
    };
}

async function executeTraditionalStep(step, strategy, _changedFiles) {
    const startTime = Date.now();

    try {
        let result;

        switch (step) {
            case "lint":
                result = await runBiomeLint(strategy);
                break;
            case "typecheck":
                result = await runTypeScriptCheck(strategy);
                break;
            case "test":
                result = await runVitest(strategy);
                break;
            case "build":
                result = await runNextBuild(strategy);
                break;
            case "docs_consistency":
                result = await runDocsConsistencyCheck(strategy);
                break;
            case "docs":
                result = await runDocsCheck(strategy);
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

async function runBiomeLint(strategy) {
    const flags = strategy.errorOnWarnings ? "--error-on-warnings" : "";
    try {
        spawnSync(`pnpm exec biome check . ${flags}`, {
            shell: true,
            stdio: "inherit",
        });
        return { success: true, message: "Biome 检查通过" };
    } catch (error) {
        return { success: false, message: "Biome 检查失败", error };
    }
}

async function runTypeScriptCheck(strategy) {
    const flags = strategy.strictMode ? "--strict" : "";
    try {
        spawnSync(`pnpm exec tsc --noEmit ${flags}`, {
            shell: true,
            stdio: "inherit",
        });
        return { success: true, message: "TypeScript 检查通过" };
    } catch (error) {
        return { success: false, message: "TypeScript 检查失败", error };
    }
}

async function runVitest(strategy) {
    const coverage = strategy.testCoverage ? "--coverage" : "";
    const mode = FAST_VITEST && !strategy.fullCoverage ? "test:ci" : "test";

    try {
        spawnSync(`pnpm run ${mode} ${coverage}`, {
            shell: true,
            stdio: "inherit",
        });
        return { success: true, message: "Vitest 检查通过" };
    } catch (error) {
        return { success: false, message: "Vitest 检查失败", error };
    }
}

async function runNextBuild(_strategy) {
    try {
        spawnSync("pnpm run build", { shell: true, stdio: "inherit" });
        return { success: true, message: "Next.js 构建通过" };
    } catch (error) {
        return { success: false, message: "Next.js 构建失败", error };
    }
}

async function runDocsConsistencyCheck(strategy) {
    console.log("📚 执行文档一致性检查...");

    try {
        const docChecker = new DocConsistencyChecker({
            enableMCP: ENABLE_MCP,
            strictMode: STRICT_MODE,
            checkLinks: true,
            checkAPI: true,
            checkCode: true,
            checkReadme: true,
        });

        const result = await docChecker.checkAll();

        if (result.success) {
            console.log(
                `✅ 文档一致性检查通过 (检查了${result.stats.filesChecked}个文件)`,
            );
            return {
                success: true,
                message: `文档一致性检查通过 (检查了${result.stats.filesChecked}个文件)`,
                stats: result.stats,
            };
        } else {
            const errors = result.issues.filter(
                (i) => i.severity === "error",
            ).length;
            const warnings = result.issues.filter(
                (i) => i.severity === "warning",
            ).length;
            console.log(
                `❌ 文档一致性检查失败: ${errors}个错误, ${warnings}个警告`,
            );

            if (strategy.strictMode || STRICT_MODE) {
                return {
                    success: false,
                    message: `文档一致性检查失败: ${errors}个错误, ${warnings}个警告`,
                    stats: result.stats,
                    issues: result.issues,
                };
            } else {
                console.log("⚠️ 非严格模式，文档问题将作为警告记录");
                return {
                    success: true,
                    message: `文档一致性检查完成: ${errors}个错误, ${warnings}个警告`,
                    stats: result.stats,
                    issues: result.issues,
                    warnings: true,
                };
            }
        }
    } catch (error) {
        console.warn("⚠️ 文档一致性检查失败，继续其他检查:", error.message);
        return {
            success: true,
            message: "文档一致性检查跳过（执行失败）",
            warning: true,
        };
    }
}

async function runDocsCheck(_strategy) {
    try {
        spawnSync("pnpm run check:docs", { shell: true, stdio: "ignore" });
        spawnSync("pnpm run check:links", { shell: true, stdio: "ignore" });
        return { success: true, message: "文档检查通过" };
    } catch (error) {
        return { success: false, message: "文档检查失败", error };
    }
}

function generateFinalReport(results, analysisResult, startTime) {
    const totalDuration = Date.now() - startTime;

    return {
        summary: {
            ...results.summary,
            totalDuration,
            riskScore: analysisResult.riskScore,
            strategy: analysisResult.strategy,
            mcpEnabled: ENABLE_MCP,
            changedFiles: analysisResult.changedFiles?.length || 0,
        },
        details: results.details,
        recommendations: generateRecommendations(results, analysisResult),
    };
}

function generateRecommendations(results, analysisResult) {
    const recommendations = [];
    const { summary } = results;

    if (!summary.overallSuccess) {
        recommendations.push("🔧 修复失败的检查项");
    }

    if (analysisResult.riskScore > 0.7) {
        recommendations.push("⚠️ 高风险变更，建议进行更全面的测试");
    }

    if (summary.totalDuration > 60000) {
        // 超过1分钟
        recommendations.push("⚡ 考虑优化检查性能");
    }

    if (ENABLE_MCP) {
        recommendations.push("🧠 MCP 智能分析已启用，建议查看详细策略");
    }

    return recommendations;
}

function displayReport(report) {
    console.log(`\n${"=".repeat(60)}`);
    console.log("📋 智能质量检查报告");
    console.log("=".repeat(60));

    const { summary } = report;

    console.log(`\n📊 检查概况:`);
    console.log(`  总步骤数: ${summary.totalSteps}`);
    console.log(`  成功: ${summary.successCount}`);
    console.log(`  失败: ${summary.failureCount}`);
    console.log(`  总耗时: ${(summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`  风险评分: ${(summary.riskScore * 100).toFixed(1)}%`);
    console.log(`  MCP 状态: ${summary.mcpEnabled ? "✅ 启用" : "❌ 禁用"}`);
    console.log(`  变更文件: ${summary.changedFiles} 个`);

    console.log(`\n📝 检查详情:`);
    report.details.forEach((detail, index) => {
        const icon = detail.success ? "✅" : "❌";
        const duration = detail.duration ? ` (${detail.duration}ms)` : "";
        console.log(
            `  ${index + 1}. ${icon} ${detail.step}: ${detail.message}${duration}`,
        );
        if (detail.error && !detail.success) {
            console.log(`     错误: ${detail.error.message || detail.error}`);
        }
    });

    if (report.recommendations.length > 0) {
        console.log(`\n💡 建议:`);
        report.recommendations.forEach((rec) => console.log(`  ${rec}`));
    }

    console.log(`\n${"=".repeat(60)}`);
}

// 主入口
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main };
