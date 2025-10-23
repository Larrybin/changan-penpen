#!/usr/bin/env node

/**
 * 文档优化脚本 - 专门用于文档一致性检查和优化
 * 集成到智能DevOps系统中
 */

import DocConsistencyChecker from "./lib/doc-consistency-checker.mjs";
import WorkflowOptimizer from "./lib/workflow-optimizer.mjs";

console.info("📚 文档优化工具启动");

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || "check";

    console.info(`📋 执行模式: ${command}`);

    try {
        switch (command) {
            case "check":
                await performDocCheck();
                break;
            case "fix":
                await performDocFix();
                break;
            case "optimize":
                await performDocOptimize();
                break;
            case "report":
                await generateDocReport();
                break;
            default:
                await performFullDocOptimization();
                break;
        }

        console.info("✅ 文档优化完成");
    } catch (error) {
        console.error("❌ 文档优化失败:", error.message);
        process.exit(1);
    }
}

/**
 * 执行文档检查
 */
async function performDocCheck() {
    console.info("🔍 执行文档一致性检查...");

    const checker = new DocConsistencyChecker({
        enableMCP: process.env.ENABLE_MCP === "1",
        strictMode: process.env.DOC_STRICT_MODE === "1",
        checkLinks: true,
        checkAPI: true,
        checkCode: true,
        checkReadme: true,
    });

    const result = await checker.checkAll();

    if (result.success) {
        console.info("✅ 文档一致性检查通过");
    } else {
        console.warn("❌ 文档一致性检查失败");

        // 显示关键问题
        const errors = result.issues.filter((i) => i.severity === "error");
        if (errors.length > 0) {
            console.info("\n关键错误:");
            errors.slice(0, 5).forEach((error) => {
                console.info(`  - ${error.file}: ${error.message}`);
            });
        }

        process.exit(1);
    }
}

/**
 * 执行文档修复
 */
async function performDocFix() {
    console.info("🔧 执行文档修复...");

    // 1. 首先执行检查
    const checker = new DocConsistencyChecker({
        enableMCP: process.env.ENABLE_MCP === "1",
        strictMode: false,
        checkLinks: true,
        checkAPI: true,
        checkCode: true,
        checkReadme: true,
    });

    const result = await checker.checkAll();

    // 2. 自动修复可修复的问题
    const fixableIssues = result.issues.filter((issue) =>
        [
            "title_filename_mismatch",
            "invalid_date",
            "empty_code_block",
        ].includes(issue.type),
    );

    if (fixableIssues.length > 0) {
        console.info(`🔧 发现 ${fixableIssues.length} 个可自动修复的问题`);

        for (const issue of fixableIssues) {
            try {
                await autoFixDocIssue(issue);
                console.info(`  ✅ 修复: ${issue.message}`);
            } catch (error) {
                console.error(
                    `  ❌ 修复失败: ${issue.message} - ${error.message}`,
                );
            }
        }
    }

    // 3. 重新检查
    console.info("\n🔄 重新检查文档...");
    const recheckResult = await checker.checkAll();

    if (recheckResult.success) {
        console.info("✅ 文档修复完成");
    } else {
        console.warn("⚠️ 部分问题需要手动修复");

        const remainingIssues = recheckResult.issues.filter(
            (i) => i.severity === "error",
        );
        if (remainingIssues.length > 0) {
            console.info(`\n需要手动修复的问题 (${remainingIssues.length}):`);
            remainingIssues.forEach((issue) => {
                console.info(`  - ${issue.file}: ${issue.message}`);
            });
        }
    }
}

/**
 * 执行文档优化
 */
async function performDocOptimize() {
    console.info("⚡ 执行文档优化...");

    const optimizer = new WorkflowOptimizer({
        enableMCP: process.env.ENABLE_MCP === "1",
        autoApplyLowRisk: true,
    });

    // 模拟文档变更
    const docFiles = await getDocFiles();

    if (docFiles.length === 0) {
        console.info("ℹ️ 未发现文档文件");
        return;
    }

    // 集成文档优化建议
    const optimizationResult =
        await optimizer.analyzeDocumentConsistency(docFiles);

    if (optimizationResult.length > 0) {
        console.info(`💡 发现 ${optimizationResult.length} 个文档优化机会`);

        // 显示优化建议
        optimizationResult.forEach((opt, index) => {
            console.info(`\n${index + 1}. ${opt.issue}`);
            console.info(`   文件: ${opt.file}`);
            console.info(`   影响: ${(opt.impact * 100).toFixed(1)}%`);
            console.info(`   工作量: ${(opt.effort * 100).toFixed(1)}%`);

            if (opt.suggestion) {
                console.info(`   建议: ${opt.suggestion.description}`);
                if (opt.suggestion.command) {
                    console.info(`   命令: ${opt.suggestion.command}`);
                }
            }
        });
    } else {
        console.info("✅ 文档结构良好，无需优化");
    }
}

/**
 * 生成文档报告
 */
async function generateDocReport() {
    console.info("📊 生成文档报告...");

    const checker = new DocConsistencyChecker({
        enableMCP: process.env.ENABLE_MCP === "1",
        strictMode: false,
        checkLinks: true,
        checkAPI: true,
        checkCode: true,
        checkReadme: true,
    });

    const result = await checker.checkAll();

    // 生成详细报告
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: result.stats.filesChecked,
            totalIssues: result.issues.length,
            errors: result.issues.filter((i) => i.severity === "error").length,
            warnings: result.issues.filter((i) => i.severity === "warning")
                .length,
            linksChecked: result.stats.linksChecked,
            apiDocsChecked: result.stats.apiDocsChecked,
            codeBlocksChecked: result.stats.codeBlocksChecked,
        },
        issuesByType: {},
        issuesByFile: {},
        recommendations: result.recommendations,
        qualityScore: calculateDocQualityScore(result),
    };

    // 按类型分组问题
    for (const issue of result.issues) {
        if (!report.issuesByType[issue.type]) {
            report.issuesByType[issue.type] = [];
        }
        report.issuesByType[issue.type].push(issue);
    }

    // 按文件分组问题
    for (const issue of result.issues) {
        if (!report.issuesByFile[issue.file]) {
            report.issuesByFile[issue.file] = [];
        }
        report.issuesByFile[issue.file].push(issue);
    }

    // 保存报告
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const reportPath = path.join(
        process.cwd(),
        ".cache/doc-quality-report.json",
    );

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // 显示报告摘要
    console.info("\n📋 文档质量报告摘要:");
    console.info(`  质量评分: ${report.qualityScore}/100`);
    console.info(`  检查文件: ${report.summary.totalFiles}`);
    console.info(`  发现问题: ${report.summary.totalIssues}`);
    console.info(`  错误: ${report.summary.errors}`);
    console.info(`  警告: ${report.summary.warnings}`);
    console.info(`  链接检查: ${report.summary.linksChecked}`);
    console.info(`  API文档: ${report.summary.apiDocsChecked}`);
    console.info(`  代码块: ${report.summary.codeBlocksChecked}`);

    if (report.recommendations && report.recommendations.length > 0) {
        console.info(`\n💡 改进建议:`);
        report.recommendations.slice(0, 3).forEach((rec) => {
            console.info(`  - ${rec.description}`);
        });
    }

    console.info(`\n📄 完整报告: ${reportPath}`);
}

/**
 * 执行完整的文档优化流程
 */
async function performFullDocOptimization() {
    console.info("🚀 执行完整文档优化流程...");

    // 1. 执行检查
    await performDocCheck();

    // 2. 执行优化
    await performDocOptimize();

    // 3. 生成报告
    await generateDocReport();
}

/**
 * 自动修复文档问题
 */
async function autoFixDocIssue(issue) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    switch (issue.type) {
        case "title_filename_mismatch":
            // 重命名文件
            if (issue.suggestedFileName) {
                const oldPath = path.join(process.cwd(), issue.file);
                const newPath = path.join(
                    process.cwd(),
                    issue.suggestedFileName,
                );
                await fs.rename(oldPath, newPath);
            }
            break;

        case "invalid_date": {
            // 更新日期
            const filePath = path.join(process.cwd(), issue.file);
            let content = await fs.readFile(filePath, "utf8");
            const today = new Date().toISOString().split("T")[0];

            // 查找并替换日期行
            const dateRegex = /(?:最后更新|updated|last modified):\s*(.+)/i;
            if (dateRegex.test(content)) {
                content = content.replace(dateRegex, `最后更新: ${today}`);
            } else {
                // 如果没有找到日期行，在文件开头添加
                const titleMatch = content.match(/^#\s+(.+)$/m);
                if (titleMatch) {
                    content = content.replace(
                        titleMatch[0],
                        `${titleMatch[0]}\n\n最后更新: ${today}`,
                    );
                }
            }

            await fs.writeFile(filePath, content, "utf8");
            break;
        }

        case "empty_code_block": {
            // 删除空代码块
            const emptyBlockPath = path.join(process.cwd(), issue.file);
            let blockContent = await fs.readFile(emptyBlockPath, "utf8");

            // 移除空代码块
            const emptyBlockRegex = /```\w+\n\s*```/g;
            blockContent = blockContent.replace(emptyBlockRegex, "");

            await fs.writeFile(emptyBlockPath, blockContent, "utf8");
            break;
        }

        default:
            throw new Error(`不支持自动修复的问题类型: ${issue.type}`);
    }
}

/**
 * 获取所有文档文件
 */
async function getDocFiles() {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const docFiles = [];
    const includeExtensions = new Set([".md", ".mdx"]);
    const shouldTraverseDirectory = (name) =>
        !name.startsWith(".") && name !== "node_modules";

    const readDirectory = async (directory) => {
        try {
            return await fs.readdir(directory, { withFileTypes: true });
        } catch (_error) {
            return [];
        }
    };

    const stack = [{ dir: process.cwd(), baseDir: "" }];

    while (stack.length > 0) {
        const { dir, baseDir } = stack.pop();
        const entries = await readDirectory(dir);

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(baseDir, entry.name);

            if (entry.isDirectory()) {
                if (shouldTraverseDirectory(entry.name)) {
                    stack.push({ dir: fullPath, baseDir: relativePath });
                }
                continue;
            }

            if (
                entry.isFile() &&
                includeExtensions.has(path.extname(entry.name))
            ) {
                docFiles.push(relativePath);
            }
        }
    }

    return docFiles;
}

/**
 * 计算文档质量评分
 */
function calculateDocQualityScore(result) {
    let score = 100;

    // 根据错误数量扣分
    const errors = result.issues.filter((i) => i.severity === "error").length;
    const warnings = result.issues.filter(
        (i) => i.severity === "warning",
    ).length;

    score -= errors * 10; // 每个错误扣10分
    score -= warnings * 3; // 每个警告扣3分

    // 根据完整性加分
    if (result.stats.apiDocsChecked > 0) score += 5;
    if (result.stats.codeBlocksChecked > 0) score += 5;
    if (result.stats.linksChecked > 0) score += 5;

    return Math.max(0, Math.min(100, score));
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
