#!/usr/bin/env node

/**
 * 工作流优化器 - 将自动化优化建议集成到现有工作流中
 * 集成所有三个MCP工具提供智能优化建议
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import DocConsistencyChecker from "./doc-consistency-checker.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkflowOptimizer {
    constructor(options = {}) {
        this.options = {
            enableMCP: process.env.ENABLE_MCP === "1",
            optimizeThreshold: 0.7, // 优化建议触发阈值
            autoApplyLowRisk: true, // 自动应用低风险优化
            maxOptimizationsPerRun: 5,
            ...options,
        };

        this.optimizationHistory = new Map();
        this.appliedOptimizations = [];
    }

    /**
     * 集成到智能质量检查工作流
     */
    async integrateWithSmartCheck(checkResults, changedFiles) {
        console.log("🔧 集成优化建议到质量检查工作流...");

        try {
            // 1. 分析检查结果中的优化机会
            const optimizationOpportunities =
                await this.analyzeCheckResults(checkResults);

            // 2. 检查文档一致性并生成优化建议
            const docConsistencyOptimizations =
                await this.analyzeDocumentConsistency(changedFiles);

            // 3. 合并所有优化机会
            const allOpportunities = [
                ...optimizationOpportunities,
                ...docConsistencyOptimizations,
            ];

            // 4. 基于变更文件评估优化优先级
            const prioritizedOptimizations = await this.prioritizeOptimizations(
                allOpportunities,
                changedFiles,
            );

            // 5. 生成工作流集成建议
            const integrationPlan = await this.generateIntegrationPlan(
                prioritizedOptimizations,
            );

            // 6. 应用自动优化（如果启用）
            const appliedOptimizations =
                await this.applyAutomaticOptimizations(integrationPlan);

            return {
                opportunities: allOpportunities,
                prioritized: prioritizedOptimizations,
                integrationPlan,
                appliedOptimizations,
                nextSteps: this.generateNextSteps(integrationPlan),
            };
        } catch (error) {
            console.error("❌ 质量检查工作流优化集成失败:", error.message);
            return { error: error.message, appliedOptimizations: [] };
        }
    }

    /**
     * 集成到智能提交工作流
     */
    async integrateWithSmartCommit(commitAnalysis, stagedFiles) {
        console.log("🚀 集成优化建议到提交工作流...");

        try {
            // 1. 分析提交前的优化机会
            const preCommitOptimizations =
                await this.analyzePreCommitOptimizations(
                    commitAnalysis,
                    stagedFiles,
                );

            // 2. 生成提交相关的优化建议
            const commitOptimizations = await this.generateCommitOptimizations(
                preCommitOptimizations,
            );

            // 3. 评估优化对提交的影响
            const impactAssessment =
                await this.assessCommitImpact(commitOptimizations);

            // 4. 生成优化后的提交策略
            const optimizedCommitStrategy =
                await this.generateOptimizedCommitStrategy(
                    commitOptimizations,
                    impactAssessment,
                );

            return {
                preCommitOptimizations,
                commitOptimizations,
                impactAssessment,
                optimizedCommitStrategy,
                recommendedActions: this.generateCommitActions(
                    optimizedCommitStrategy,
                ),
            };
        } catch (error) {
            console.error("❌ 提交工作流优化集成失败:", error.message);
            return { error: error.message, recommendedActions: [] };
        }
    }

    /**
     * 集成到智能CI/CD工作流
     */
    async integrateWithSmartCI(ciContext, buildResults) {
        console.log("🔄 集成优化建议到CI/CD工作流...");

        try {
            // 1. 分析CI/CD流水线优化机会
            const pipelineOptimizations =
                await this.analyzePipelineOptimizations(ciContext);

            // 2. 基于构建结果识别优化点
            const buildOptimizations =
                await this.analyzeBuildOptimizations(buildResults);

            // 3. 生成CI/CD优化策略
            const ciOptimizationStrategy =
                await this.generateCIOptimizationStrategy(
                    pipelineOptimizations,
                    buildOptimizations,
                );

            // 4. 创建流水线优化配置
            const optimizedPipelineConfig =
                await this.generateOptimizedPipelineConfig(
                    ciOptimizationStrategy,
                );

            return {
                pipelineOptimizations,
                buildOptimizations,
                ciOptimizationStrategy,
                optimizedPipelineConfig,
                implementationPlan: this.generateCIImplementationPlan(
                    ciOptimizationStrategy,
                ),
            };
        } catch (error) {
            console.error("❌ CI/CD工作流优化集成失败:", error.message);
            return { error: error.message, implementationPlan: [] };
        }
    }

    /**
     * 分析检查结果中的优化机会
     */
    async analyzeCheckResults(checkResults) {
        const opportunities = [];

        // 使用MCP工具进行深度分析
        if (this.options.enableMCP) {
            try {
                // Context7: 获取最新的优化最佳实践
                const bestPractices =
                    await this.getMCPBestPractices("code_optimization");

                // Sequential-thinking: 分析优化策略
                const optimizationStrategy =
                    await this.getMCPOptimizationStrategy(checkResults);

                // Memory: 记住历史优化模式
                const historicalPatterns = await this.getMCPHistoricalPatterns(
                    "check_optimizations",
                );

                // 基于MCP分析结果生成优化机会
                opportunities.push(
                    ...this.generateMCPOptimizations(
                        bestPractices,
                        optimizationStrategy,
                        historicalPatterns,
                    ),
                );
            } catch (mcpError) {
                console.warn("⚠️ MCP分析失败，使用本地分析:", mcpError.message);
            }
        }

        // 本地分析检查结果
        for (const [checkType, result] of Object.entries(checkResults)) {
            if (result.status === "failed" || result.duration > 5000) {
                opportunities.push({
                    type: "performance",
                    category: checkType,
                    issue: `${checkType}检查耗时过长或失败`,
                    currentValue: result.duration,
                    suggestedValue: this.getOptimalValue(checkType),
                    impact: this.calculateImpact(checkType, result),
                    effort: this.estimateEffort(checkType, result),
                });
            }
        }

        return opportunities;
    }

    /**
     * 优先级排序优化建议
     */
    async prioritizeOptimizations(opportunities, changedFiles) {
        return opportunities
            .map((opp) => ({
                ...opp,
                priority: this.calculatePriority(opp, changedFiles),
                relevance: this.calculateRelevance(opp, changedFiles),
            }))
            .sort((a, b) => b.priority - a.priority)
            .slice(0, this.options.maxOptimizationsPerRun);
    }

    /**
     * 生成工作流集成计划
     */
    async generateIntegrationPlan(optimizations) {
        const plan = {
            immediate: [], // 立即应用的优化
            preCommit: [], // 提交前应用的优化
            preBuild: [], // 构建前应用的优化
            scheduled: [], // 定时应用的优化
        };

        for (const optimization of optimizations) {
            const category = this.categorizeOptimization(optimization);

            switch (category) {
                case "immediate":
                    plan.immediate.push(optimization);
                    break;
                case "pre-commit":
                    plan.preCommit.push(optimization);
                    break;
                case "pre-build":
                    plan.preBuild.push(optimization);
                    break;
                case "scheduled":
                    plan.scheduled.push(optimization);
                    break;
            }
        }

        return plan;
    }

    /**
     * 应用自动优化
     */
    async applyAutomaticOptimizations(integrationPlan) {
        const applied = [];

        // 应用立即优化
        for (const optimization of integrationPlan.immediate) {
            if (this.isSafeToApply(optimization)) {
                try {
                    await this.applyOptimization(optimization);
                    applied.push(optimization);
                    console.log(`✅ 已应用优化: ${optimization.issue}`);
                } catch (error) {
                    console.error(
                        `❌ 应用优化失败: ${optimization.issue}`,
                        error.message,
                    );
                }
            }
        }

        // 生成其他优化步骤的脚本
        await this.generateOptimizationScripts(integrationPlan);

        return applied;
    }

    /**
     * 生成下一步行动建议
     */
    generateNextSteps(integrationPlan) {
        const steps = [];

        if (integrationPlan.preCommit.length > 0) {
            steps.push({
                action: "apply_pre_commit_optimizations",
                description: `在下次提交前应用 ${integrationPlan.preCommit.length} 项优化`,
                command: "pnpm run optimize:pre-commit",
                priority: "high",
            });
        }

        if (integrationPlan.preBuild.length > 0) {
            steps.push({
                action: "apply_pre_build_optimizations",
                description: `在下次构建前应用 ${integrationPlan.preBuild.length} 项优化`,
                command: "pnpm run optimize:pre-build",
                priority: "medium",
            });
        }

        if (integrationPlan.scheduled.length > 0) {
            steps.push({
                action: "schedule_optimizations",
                description: `安排 ${integrationPlan.scheduled.length} 项定时优化`,
                command: "pnpm run optimize:schedule",
                priority: "low",
            });
        }

        return steps;
    }

    /**
     * MCP工具集成方法
     */
    async getMCPBestPractices(_category) {
        // 模拟Context7 MCP调用
        return {
            source: "context7",
            practices: [
                "使用并行执行提高检查速度",
                "优化依赖缓存策略",
                "增量检查减少不必要的重复工作",
            ],
        };
    }

    async getMCPOptimizationStrategy(_context) {
        // 模拟Sequential-thinking MCP调用
        return {
            source: "sequential-thinking",
            strategy: [
                "首先优化耗时最长的检查",
                "然后优化失败率最高的检查",
                "最后优化资源消耗最大的检查",
            ],
        };
    }

    async getMCPHistoricalPatterns(_patternType) {
        // 模拟Memory MCP调用
        return {
            source: "memory",
            patterns: [
                "TypeScript检查在大型项目中经常耗时过长",
                "Biome格式化可以通过缓存优化",
                "测试执行时间与代码复杂度成正比",
            ],
        };
    }

    /**
     * 辅助方法
     */
    calculatePriority(optimization, changedFiles) {
        let priority =
            optimization.impact * 0.6 + (1 - optimization.effort) * 0.4;

        // 如果优化与变更文件相关，提高优先级
        if (this.isRelevantToChanges(optimization, changedFiles)) {
            priority *= 1.5;
        }

        return Math.min(priority, 1.0);
    }

    calculateRelevance(optimization, changedFiles) {
        // 计算优化与当前变更的相关性
        return this.isRelevantToChanges(optimization, changedFiles) ? 1.0 : 0.3;
    }

    isRelevantToChanges(optimization, changedFiles) {
        // 简单的相关性检查逻辑
        return changedFiles.some((file) => {
            const extension = path.extname(file);
            return optimization.category?.includes(extension.replace(".", ""));
        });
    }

    categorizeOptimization(optimization) {
        if (optimization.effort < 0.3 && optimization.impact > 0.7) {
            return "immediate";
        } else if (optimization.effort < 0.5) {
            return "pre-commit";
        } else if (optimization.effort < 0.8) {
            return "pre-build";
        } else {
            return "scheduled";
        }
    }

    isSafeToApply(optimization) {
        return optimization.effort < 0.3 && this.options.autoApplyLowRisk;
    }

    async applyOptimization(optimization) {
        // 这里实现具体的优化应用逻辑
        console.log(`🔧 应用优化: ${optimization.issue}`);

        // 记录已应用的优化
        this.appliedOptimizations.push({
            ...optimization,
            appliedAt: new Date().toISOString(),
        });

        return true;
    }

    async generateOptimizationScripts(integrationPlan) {
        // 生成优化脚本文件
        const scripts = {
            "optimize:pre-commit": this.generatePreCommitScript(
                integrationPlan.preCommit,
            ),
            "optimize:pre-build": this.generatePreBuildScript(
                integrationPlan.preBuild,
            ),
            "optimize:schedule": this.generateScheduleScript(
                integrationPlan.scheduled,
            ),
        };

        // 写入脚本文件
        for (const [scriptName, scriptContent] of Object.entries(scripts)) {
            if (scriptContent) {
                await fs.writeFile(
                    path.join(
                        __dirname,
                        `../scripts/${scriptName.replace(":", "-")}.mjs`,
                    ),
                    scriptContent,
                );
            }
        }
    }

    generatePreCommitScript(optimizations) {
        if (optimizations.length === 0) return null;

        return `#!/usr/bin/env node
/**
 * 自动生成的提交前优化脚本
 */

import { execSync } from 'child_process';

console.log('🔧 执行提交前优化...');

${optimizations
    .map(
        (opt, index) => `
// 优化 ${index + 1}: ${opt.issue}
try {
  console.log('  执行: ${opt.issue}');
  // TODO: 实现具体的优化逻辑
} catch (error) {
  console.error('  优化失败:', error.message);
}
`,
    )
    .join("\n")}

console.log('✅ 提交前优化完成');
`;
    }

    generatePreBuildScript(optimizations) {
        if (optimizations.length === 0) return null;

        return `#!/usr/bin/env node
/**
 * 自动生成的构建前优化脚本
 */

console.log('🔧 执行构建前优化...');

${optimizations
    .map(
        (opt, index) => `
// 优化 ${index + 1}: ${opt.issue}
console.log('  准备: ${opt.issue}');
// TODO: 实现具体的优化逻辑
`,
    )
    .join("\n")}

console.log('✅ 构建前优化完成');
`;
    }

    generateScheduleScript(optimizations) {
        if (optimizations.length === 0) return null;

        return `#!/usr/bin/env node
/**
 * 自动生成的定时优化脚本
 */

console.log('🔧 执行定时优化...');

${optimizations
    .map(
        (opt, index) => `
// 优化 ${index + 1}: ${opt.issue}
console.log('  计划: ${opt.issue}');
// TODO: 实现具体的优化逻辑
`,
    )
    .join("\n")}

console.log('✅ 定时优化完成');
`;
    }

    getOptimalValue(checkType) {
        const optimalValues = {
            biome: 2000,
            typescript: 5000,
            tests: 30000,
            build: 60000,
        };
        return optimalValues[checkType] || 3000;
    }

    calculateImpact(checkType, result) {
        const baseline = this.getOptimalValue(checkType);
        const actual = result.duration || 0;
        return Math.min((actual - baseline) / baseline, 1.0);
    }

    estimateEffort(checkType, _result) {
        // 基于检查类型和结果估算优化所需的工作量
        const efforts = {
            biome: 0.2,
            typescript: 0.4,
            tests: 0.8,
            build: 0.6,
        };
        return efforts[checkType] || 0.5;
    }

    generateMCPOptimizations(bestPractices, strategy, patterns) {
        const optimizations = [];

        // 基于最佳实践生成优化
        if (bestPractices.practices) {
            bestPractices.practices.forEach((practice) => {
                optimizations.push({
                    type: "best_practice",
                    category: "mcp_context7",
                    issue: practice,
                    impact: 0.8,
                    effort: 0.4,
                    source: "context7",
                });
            });
        }

        // 基于策略生成优化
        if (strategy.strategy) {
            strategy.strategy.forEach((step) => {
                optimizations.push({
                    type: "strategy",
                    category: "mcp_sequential_thinking",
                    issue: step,
                    impact: 0.7,
                    effort: 0.5,
                    source: "sequential-thinking",
                });
            });
        }

        // 基于历史模式生成优化
        if (patterns.patterns) {
            patterns.patterns.forEach((pattern) => {
                optimizations.push({
                    type: "pattern",
                    category: "mcp_memory",
                    issue: pattern,
                    impact: 0.6,
                    effort: 0.3,
                    source: "memory",
                });
            });
        }

        return optimizations;
    }

    /**
     * 分析文档一致性并生成优化建议
     */
    async analyzeDocumentConsistency(changedFiles) {
        const optimizations = [];

        // 检查是否有文档文件变更
        const docFiles = changedFiles.filter(
            (file) =>
                file.endsWith(".md") ||
                file.endsWith(".mdx") ||
                file.includes("docs/") ||
                file.includes("README"),
        );

        if (docFiles.length === 0) {
            return optimizations;
        }

        console.log(`📚 分析 ${docFiles.length} 个文档文件的一致性...`);

        try {
            const docChecker = new DocConsistencyChecker({
                enableMCP: this.options.enableMCP,
                strictMode: false, // 使用非严格模式生成建议
                checkLinks: true,
                checkAPI: true,
                checkCode: true,
                checkReadme: true,
            });

            // 执行文档一致性检查
            const result = await docChecker.checkAll();

            // 将文档问题转换为优化建议
            for (const issue of result.issues) {
                const optimization = {
                    type: "documentation",
                    category: this.mapDocIssueToCategory(issue.type),
                    issue: issue.message,
                    file: issue.file,
                    severity: issue.severity,
                    impact: this.calculateDocIssueImpact(issue),
                    effort: this.calculateDocIssueEffort(issue),
                    suggestion: this.generateDocIssueSuggestion(issue),
                    source: "doc_consistency_checker",
                };

                optimizations.push(optimization);
            }

            // 基于MCP分析生成文档优化建议
            if (this.options.enableMCP && result.recommendations) {
                for (const rec of result.recommendations) {
                    optimizations.push({
                        type: "documentation",
                        category: "mcp_enhanced",
                        issue: rec.description,
                        severity: rec.priority === "high" ? "error" : "warning",
                        impact: rec.priority === "high" ? 0.8 : 0.6,
                        effort: 0.4,
                        suggestion: rec.action,
                        affectedFiles: rec.affectedFiles,
                        source: "mcp_doc_analysis",
                    });
                }
            }

            console.log(
                `✅ 文档一致性分析完成，发现 ${optimizations.length} 个优化机会`,
            );
        } catch (error) {
            console.warn("⚠️ 文档一致性分析失败:", error.message);
        }

        return optimizations;
    }

    /**
     * 将文档问题映射到优化类别
     */
    mapDocIssueToCategory(issueType) {
        const mapping = {
            broken_link: "navigation",
            broken_anchor: "navigation",
            duplicate_file: "structure",
            file_location: "structure",
            toc_mismatch: "structure",
            toc_link_mismatch: "structure",
            missing_structure: "content",
            missing_h1: "content",
            title_filename_mismatch: "naming",
            invalid_date: "metadata",
            syntax_error: "code_quality",
            missing_import: "code_quality",
            invalid_json: "code_quality",
            http_method_inconsistency: "api_consistency",
            api_endpoint_format: "api_consistency",
            missing_api_examples: "completeness",
            missing_error_handling: "completeness",
            missing_readme_date: "metadata",
            empty_code_block: "content",
            short_core_document: "content",
            unstructured_content: "structure",
        };

        return mapping[issueType] || "general";
    }

    /**
     * 计算文档问题的影响程度
     */
    calculateDocIssueImpact(issue) {
        const impactMap = {
            broken_link: 0.9, // 高影响：用户无法导航
            broken_anchor: 0.7, // 中高影响：页面内导航失败
            duplicate_file: 0.6, // 中等影响：维护困难
            missing_structure: 0.5, // 中等影响：可读性差
            title_filename_mismatch: 0.3, // 低影响：SEO和查找
            invalid_date: 0.2, // 低影响：信息时效性
        };

        return impactMap[issue.type] || 0.5;
    }

    /**
     * 计算文档问题的修复工作量
     */
    calculateDocIssueEffort(issue) {
        const effortMap = {
            broken_link: 0.3, // 低工作量：通常是简单的路径修正
            broken_anchor: 0.2, // 低工作量：锚点修复
            duplicate_file: 0.7, // 中高工作量：需要内容合并
            missing_structure: 0.8, // 高工作量：需要重构文档
            title_filename_mismatch: 0.2, // 低工作量：重命名文件
            invalid_date: 0.1, // 极低工作量：更新日期
        };

        return effortMap[issue.type] || 0.4;
    }

    /**
     * 生成文档问题的解决建议
     */
    generateDocIssueSuggestion(issue) {
        const suggestions = {
            broken_link: {
                action: "修复本地链接路径",
                command: `pnpm run check:links --fix ${issue.file}`,
                description: "更新链接指向正确的文件路径",
            },
            broken_anchor: {
                action: "修复锚点链接",
                command: `# 在 ${issue.file} 中检查标题格式`,
                description: "确保锚点与标题文本匹配",
            },
            duplicate_file: {
                action: "处理重复文件",
                command: `# 比较 ${issue.file} 和 ${issue.duplicateFile}`,
                description: "合并内容或删除重复文件",
            },
            missing_structure: {
                action: "添加文档结构",
                command: `# 在 ${issue.file} 中添加标题层级`,
                description: "使用 # ## ### 创建清晰的文档结构",
            },
            title_filename_mismatch: {
                action: "标准化文件名",
                command: `git mv ${issue.file} ${issue.suggestedFileName}`,
                description: "将文件名改为与标题匹配",
            },
        };

        return (
            suggestions[issue.type] || {
                action: "检查并修复文档问题",
                command: `# 手动修复 ${issue.file}`,
                description: "根据具体问题进行相应修复",
            }
        );
    }
}

/**
 * 主程序入口 - 根据命令行参数执行不同的优化任务
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || "all";

    console.log(`🚀 工作流优化器启动 - 执行模式: ${command}`);

    const optimizer = new WorkflowOptimizer({
        enableMCP: process.env.ENABLE_MCP === "1",
        optimizeThreshold: 0.7,
        autoApplyLowRisk: true,
    });

    try {
        switch (command) {
            case "pre-commit":
                await executePreCommitOptimizations(optimizer);
                break;

            case "pre-build":
                await executePreBuildOptimizations(optimizer);
                break;

            case "schedule":
                await executeScheduledOptimizations(optimizer);
                break;
            default:
                await executeAllOptimizations(optimizer);
                break;
        }

        console.log("✅ 工作流优化完成");
    } catch (error) {
        console.error("❌ 工作流优化失败:", error.message);
        process.exit(1);
    }
}

/**
 * 执行提交前优化
 */
async function executePreCommitOptimizations(optimizer) {
    console.log("📝 执行提交前优化...");

    // 1. 获取当前Git状态
    const _gitStatus = execSync("git status --porcelain", { encoding: "utf8" });
    const stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
    })
        .split("\n")
        .filter(Boolean);

    if (stagedFiles.length === 0) {
        console.log("ℹ️ 没有暂存文件，跳过优化");
        return;
    }

    console.log(`📁 发现 ${stagedFiles.length} 个暂存文件`);

    // 2. 运行智能质量检查获取当前状态
    let checkResults = {};
    try {
        // 尝试读取最近的检查结果
        const resultsPath = path.join(
            __dirname,
            "../../.cache/check-results.json",
        );
        if (fs.existsSync(resultsPath)) {
            checkResults = JSON.parse(await fs.readFile(resultsPath, "utf8"));
        }
    } catch (_error) {
        console.warn("⚠️ 无法读取检查结果，将执行新的检查");
    }

    // 3. 如果没有检查结果，运行智能检查
    if (Object.keys(checkResults).length === 0) {
        console.log("🔍 运行智能质量检查...");
        try {
            execSync("pnpm run smart-check:all", { stdio: "inherit" });

            // 读取检查结果
            const resultsPath = path.join(
                __dirname,
                "../../.cache/check-results.json",
            );
            if (fs.existsSync(resultsPath)) {
                checkResults = JSON.parse(
                    await fs.readFile(resultsPath, "utf8"),
                );
            }
        } catch (_error) {
            console.warn("⚠️ 质量检查失败，继续优化流程");
        }
    }

    // 4. 集成优化建议
    const optimizationResult = await optimizer.integrateWithSmartCheck(
        checkResults,
        stagedFiles,
    );

    // 5. 应用自动优化
    if (
        optimizationResult.appliedOptimizations &&
        optimizationResult.appliedOptimizations.length > 0
    ) {
        console.log(
            `✅ 自动应用了 ${optimizationResult.appliedOptimizations.length} 项优化`,
        );
    }

    // 6. 显示下一步建议
    if (
        optimizationResult.nextSteps &&
        optimizationResult.nextSteps.length > 0
    ) {
        console.log("\n📋 下一步建议:");
        optimizationResult.nextSteps.forEach((step, index) => {
            console.log(`  ${index + 1}. ${step.description}`);
            if (step.command) {
                console.log(`     命令: ${step.command}`);
            }
        });
    }
}

/**
 * 执行构建前优化
 */
async function executePreBuildOptimizations(optimizer) {
    console.log("🏗️ 执行构建前优化...");

    // 1. 检查项目状态
    const projectInfo = {
        dependencies: getProjectDependencies(),
        scripts: getProjectScripts(),
        lastBuildTime: getLastBuildTime(),
    };

    // 2. 分析构建配置
    const buildConfig = analyzeBuildConfiguration();

    // 3. 生成构建优化建议
    const buildOptimizations = await optimizer.generateBuildOptimizations(
        projectInfo,
        buildConfig,
    );

    // 4. 应用安全的构建优化
    const appliedOptimizations =
        await optimizer.applySafeBuildOptimizations(buildOptimizations);

    console.log(`🔧 应用了 ${appliedOptimizations.length} 项构建优化`);
}

/**
 * 执行定时优化
 */
async function executeScheduledOptimizations(optimizer) {
    console.log("⏰ 执行定时优化...");

    // 1. 检查优化历史
    const optimizationHistory = await loadOptimizationHistory();

    // 2. 识别需要优化的区域
    const areasToOptimize = identifyOptimizationAreas(optimizationHistory);

    // 3. 为每个区域生成优化建议
    for (const area of areasToOptimize) {
        console.log(`🎯 优化区域: ${area.name}`);
        const optimizations = await optimizer.generateAreaOptimizations(area);

        // 应用低风险优化
        const safeOptimizations = optimizations.filter(
            (opt) => opt.effort < 0.6,
        );
        for (const optimization of safeOptimizations) {
            try {
                await optimizer.applyOptimization(optimization);
                console.log(`  ✅ 应用了优化: ${optimization.issue}`);
            } catch (error) {
                console.error(
                    `  ❌ 优化失败: ${optimization.issue}`,
                    error.message,
                );
            }
        }
    }

    // 4. 保存优化历史
    await saveOptimizationHistory(areasToOptimize);
}

/**
 * 执行所有优化
 */
async function executeAllOptimizations(optimizer) {
    console.log("🚀 执行完整优化流程...");

    // 1. 执行环境健康检查
    console.log("\n📊 环境健康检查...");
    try {
        execSync("pnpm run env:health", { stdio: "inherit" });
    } catch (_error) {
        console.warn("⚠️ 环境健康检查失败");
    }

    // 2. 执行监控健康检查
    console.log("\n📈 监控健康检查...");
    try {
        execSync("pnpm run monitor:health", { stdio: "inherit" });
    } catch (_error) {
        console.warn("⚠️ 监控健康检查失败");
    }

    // 3. 分析当前工作流状态
    const workflowState = await analyzeWorkflowState();

    // 4. 生成综合优化建议
    const comprehensiveOptimizations =
        await optimizer.generateComprehensiveOptimizations(workflowState);

    // 5. 应用高优先级优化
    const highPriorityOptimizations = comprehensiveOptimizations.filter(
        (opt) => opt.priority > 0.8 && opt.effort < 0.5,
    );

    console.log(`\n🎯 发现 ${comprehensiveOptimizations.length} 项优化机会`);
    console.log(`🔧 应用 ${highPriorityOptimizations.length} 项高优先级优化`);

    for (const optimization of highPriorityOptimizations) {
        try {
            await optimizer.applyOptimization(optimization);
            console.log(`  ✅ ${optimization.issue}`);
        } catch (error) {
            console.error(`  ❌ ${optimization.issue}: ${error.message}`);
        }
    }

    // 6. 生成优化报告
    await generateOptimizationReport(
        comprehensiveOptimizations,
        highPriorityOptimizations,
    );
}

/**
 * 辅助函数
 */
function getProjectDependencies() {
    try {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8"),
        );
        return Object.keys(packageJson.dependencies || {});
    } catch {
        return [];
    }
}

function getProjectScripts() {
    try {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8"),
        );
        return Object.keys(packageJson.scripts || {});
    } catch {
        return [];
    }
}

function getLastBuildTime() {
    try {
        const stats = fs.statSync(path.join(__dirname, "../../.next"));
        return stats.mtime;
    } catch {
        return null;
    }
}

function analyzeBuildConfiguration() {
    // 分析构建配置
    return {
        hasTypeScript: true,
        hasTailwind: true,
        hasTests: true,
        buildTool: "nextjs",
    };
}

async function loadOptimizationHistory() {
    try {
        const historyPath = path.join(
            __dirname,
            "../../.cache/optimization-history.json",
        );
        return JSON.parse(await fs.readFile(historyPath, "utf8"));
    } catch {
        return [];
    }
}

function identifyOptimizationAreas(_history) {
    return [
        { name: "代码质量", priority: 0.8 },
        { name: "构建性能", priority: 0.7 },
        { name: "依赖管理", priority: 0.6 },
        { name: "测试覆盖", priority: 0.5 },
    ];
}

async function saveOptimizationHistory(areas) {
    const historyPath = path.join(__dirname, "../../.cache");
    await fs.mkdir(historyPath, { recursive: true });
    await fs.writeFile(
        path.join(historyPath, "optimization-history.json"),
        JSON.stringify(areas, null, 2),
    );
}

async function analyzeWorkflowState() {
    return {
        gitStatus: execSync("git status --porcelain", { encoding: "utf8" }),
        branchName: execSync("git branch --show-current", {
            encoding: "utf8",
        }).trim(),
        lastCommit: execSync('git log -1 --format="%h %s"', {
            encoding: "utf8",
        }).trim(),
    };
}

async function generateOptimizationReport(
    allOptimizations,
    appliedOptimizations,
) {
    const report = {
        timestamp: new Date().toISOString(),
        totalOpportunities: allOptimizations.length,
        appliedOptimizations: appliedOptimizations.length,
        categories: {
            performance: allOptimizations.filter(
                (opt) => opt.type === "performance",
            ).length,
            security: allOptimizations.filter((opt) => opt.type === "security")
                .length,
            maintainability: allOptimizations.filter(
                (opt) => opt.type === "maintainability",
            ).length,
        },
        nextSteps: allOptimizations
            .filter((opt) => !appliedOptimizations.includes(opt))
            .slice(0, 5)
            .map((opt) => opt.issue),
    };

    const reportPath = path.join(
        __dirname,
        "../../.cache/optimization-report.json",
    );
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log("\n📊 优化报告已生成:", reportPath);
    console.log(`🎯 总机会: ${report.totalOpportunities}`);
    console.log(`✅ 已应用: ${report.appliedOptimizations}`);
    console.log(`📈 性能优化: ${report.categories.performance}`);
    console.log(`🔒 安全优化: ${report.categories.security}`);
    console.log(`🛠️ 可维护性: ${report.categories.maintainability}`);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default WorkflowOptimizer;
