#!/usr/bin/env node
/**
 * Smart Push - 智能Git提交和推送脚本
 *
 * 集成 context7、memory、sequential-thinking 三个 MCP 工具
 * 提供智能提交信息生成、冲突检测、质量检查等功能
 */

import { SmartCommitGenerator } from "./lib/smart-commit.mjs";
import { SmartQualitySession } from "./lib/smart-quality.mjs";
import WorkflowOptimizer from "./lib/workflow-optimizer.mjs";

// 配置选项
const ENABLE_MCP =
    process.env.ENABLE_MCP === "1" || process.env.SMART_PUSH === "1";
const STRICT_MODE = process.env.SMART_STRICT === "1";
const AUTO_COMMIT = process.env.AUTO_COMMIT !== "0";
const SKIP_QUALITY_CHECK = process.env.SKIP_QUALITY_CHECK === "1";
const ENABLE_CONFLICT_DETECTION = process.env.ENABLE_CONFLICT_DETECTION === "1";

console.log(`🚀 Smart Push - 智能Git提交和推送`);
console.log(
    `📋 配置: MCP=${ENABLE_MCP ? "启用" : "禁用"}, 严格模式=${STRICT_MODE ? "启用" : "禁用"}, 自动提交=${AUTO_COMMIT ? "启用" : "禁用"}`,
);

class SmartPushSession {
    constructor(options = {}) {
        this.options = {
            enableMCP: ENABLE_MCP,
            strictMode: STRICT_MODE,
            autoCommit: AUTO_COMMIT,
            skipQualityCheck: SKIP_QUALITY_CHECK,
            enableConflictDetection: ENABLE_CONFLICT_DETECTION,
            ...options,
        };

        this.sessionData = {
            startTime: Date.now(),
            commitOptions: [],
            selectedCommit: null,
            conflicts: [],
            qualityResults: null,
        };
    }

    async initialize() {
        if (this.options.enableMCP) {
            this.commitGenerator = new SmartCommitGenerator();
            await this.commitGenerator.initialize();
        }

        this.qualitySession = new SmartQualitySession({
            enableMCP: this.options.enableMCP,
            strictMode: this.options.strictMode,
        });
        await this.qualitySession.initialize();

        // 初始化工作流优化器
        this.workflowOptimizer = new WorkflowOptimizer({
            enableMCP: this.options.enableMCP,
            autoApplyLowRisk: true,
        });
    }

    // 执行智能推送流程
    async execute() {
        console.log("\n🔍 开始智能推送流程...");

        try {
            // 1. 生成智能提交信息
            await this.generateCommitMessages();

            // 2. 质量检查（可选）
            if (!this.options.skipQualityCheck) {
                await this.runQualityChecks();
            }

            // 3. 集成优化建议
            await this.integrateOptimizationSuggestions();

            // 4. 冲突检测
            if (this.options.enableConflictDetection) {
                await this.detectConflicts();
            }

            // 5. 提交变更
            await this.commitChanges();

            // 6. 同步和推送
            await this.syncAndPush();

            // 7. 生成报告
            this.generateReport();
        } catch (error) {
            console.error("\n💥 推送过程中发生错误:", error.message);
            if (this.options.enableMCP) {
                console.error("\n📝 建议检查:");
                console.error("  - 确保所有检查已通过");
                console.error("  - 解决任何Git冲突");
                console.error("  - 检查提交信息格式");
            }
            process.exit(1);
        }
    }

    async generateCommitMessages() {
        console.log("\n📝 生成智能提交信息...");

        try {
            if (this.options.enableMCP) {
                this.sessionData.commitOptions =
                    await this.commitGenerator.generateCommitMessage();
            } else {
                this.sessionData.commitOptions =
                    this.generateFallbackCommitMessage();
            }

            console.log(
                `\n📋 生成了 ${this.sessionData.commitOptions.length} 个提交选项:`,
            );
            this.sessionData.commitOptions.forEach((option, index) => {
                console.log(
                    `\n${index + 1}. ${option.type}${option.scope ? `(${option.scope})` : ""}: ${option.description}`,
                );
                if (option.body) {
                    console.log(`   ${option.body.split("\n")[0]}...`);
                }
                if (option.breakingChange) {
                    console.log(`   ⚠️  BREAKING CHANGE`);
                }
            });

            // 选择最佳提交选项
            this.sessionData.selectedCommit = this.selectBestCommit();
        } catch (error) {
            throw new Error(`生成提交信息失败: ${error.message}`);
        }
    }

    async integrateOptimizationSuggestions() {
        console.log("\n🔧 集成自动化优化建议...");

        try {
            // 获取暂存文件
            const stagedFiles = this.getStagedFiles();

            if (stagedFiles.length === 0) {
                console.log("ℹ️ 没有暂存文件，跳过优化建议");
                return;
            }

            // 获取质量检查结果
            const qualityResults = this.sessionData.qualityResults || {};

            // 集成优化建议到提交工作流
            const optimizationResult =
                await this.workflowOptimizer.integrateWithSmartCommit(
                    {
                        commitAnalysis: this.sessionData.selectedCommit,
                        stagedFiles: stagedFiles,
                        qualityResults: qualityResults,
                    },
                    stagedFiles,
                );

            // 显示优化建议
            if (
                optimizationResult.recommendedActions &&
                optimizationResult.recommendedActions.length > 0
            ) {
                console.log(
                    `\n💡 发现 ${optimizationResult.recommendedActions.length} 项优化建议:`,
                );
                optimizationResult.recommendedActions.forEach(
                    (action, index) => {
                        console.log(`  ${index + 1}. ${action.description}`);
                        if (action.command) {
                            console.log(`     执行命令: ${action.command}`);
                        }
                        if (action.priority) {
                            console.log(`     优先级: ${action.priority}`);
                        }
                    },
                );
            }

            // 应用安全的优化建议
            if (
                optimizationResult.optimizedCommitStrategy
                    ?.autoApplyOptimizations
            ) {
                const safeOptimizations =
                    optimizationResult.optimizedCommitStrategy.autoApplyOptimizations.filter(
                        (opt) => opt.effort < 0.4 && opt.impact > 0.6,
                    );

                if (safeOptimizations.length > 0) {
                    console.log(
                        `\n🔧 自动应用 ${safeOptimizations.length} 项安全优化:`,
                    );
                    for (const optimization of safeOptimizations) {
                        try {
                            await this.workflowOptimizer.applyOptimization(
                                optimization,
                            );
                            console.log(`  ✅ ${optimization.issue}`);
                        } catch (error) {
                            console.error(
                                `  ❌ ${optimization.issue}: ${error.message}`,
                            );
                        }
                    }
                }
            }

            // 更新提交策略
            if (optimizationResult.optimizedCommitStrategy) {
                console.log("\n📝 优化后的提交策略:");
                const strategy = optimizationResult.optimizedCommitStrategy;
                console.log(`  风险评估: ${strategy.riskLevel || "medium"}`);
                console.log(
                    `  推荐操作: ${strategy.recommendedAction || "proceed"}`,
                );

                if (strategy.modifiedCommit) {
                    console.log("  提交信息已优化");
                    this.sessionData.selectedCommit = {
                        ...this.sessionData.selectedCommit,
                        ...strategy.modifiedCommit,
                    };
                }
            }

            console.log("✅ 优化建议集成完成");
        } catch (error) {
            console.warn("⚠️ 优化建议集成失败，继续提交流程:", error.message);
        }
    }

    generateFallbackCommitMessage() {
        const _status = this.getGitStatus();
        const files = this.getStagedFiles();
        const scope = this.inferScope(files);

        return [
            {
                type: "chore",
                scope,
                description: "local push",
                breakingChange: false,
                body: "",
                footers: [],
                score: 0.5,
                reason: "fallback option",
            },
        ];
    }

    selectBestCommit() {
        // 选择评分最高的选项
        const best = this.sessionData.commitOptions.reduce((prev, curr) =>
            curr.score > prev.score ? curr : prev,
        );

        console.log(
            `\n✅ 选择最佳提交选项: ${best.type}${best.scope ? `(${best.scope})` : ""}: ${best.description}`,
        );
        return best;
    }

    async runQualityChecks() {
        console.log("\n🔍 执行质量检查...");

        try {
            const changedFiles = this.getStagedFiles();
            const _analysisResult =
                await this.qualitySession.analyzeChanges(changedFiles);
            this.sessionData.qualityResults =
                await this.qualitySession.executeSmartCheck();

            if (!this.sessionData.qualityResults.summary.overallSuccess) {
                throw new Error("质量检查失败");
            }

            console.log("✅ 质量检查通过");
        } catch (error) {
            if (this.options.strictMode) {
                throw error;
            } else {
                console.warn("⚠️ 质量检查失败，继续推送（非严格模式）");
            }
        }
    }

    async detectConflicts() {
        console.log("\n🔍 检测潜在冲突...");

        try {
            // 获取当前分支
            const currentBranch = this.getCurrentBranch();
            const _remoteBranch = this.getRemoteBranch(currentBranch);

            // 模拟rebase以检测冲突
            const conflicts = await this.simulateRebase();

            if (conflicts.length > 0) {
                this.sessionData.conflicts = conflicts;
                console.log(`\n⚠️ 检测到 ${conflicts.length} 个潜在冲突:`);
                conflicts.forEach((conflict) => {
                    console.log(`  - ${conflict.file}: ${conflict.type}`);
                });

                // 提供冲突解决建议
                this.provideConflictResolution(conflicts);
                throw new Error("检测到Git冲突，请解决后重试");
            }

            console.log("✅ 未检测到冲突");
        } catch (error) {
            if (error.message.includes("冲突")) {
                throw error;
            }
            console.warn("⚠️ 冲突检测失败，继续推送");
        }
    }

    async simulateRebase() {
        try {
            // 尝试获取远程状态
            const remote = spawnSync("git", ["remote", "get-url", "origin"], {
                encoding: "utf8",
            }).stdout.trim();

            if (!remote) {
                return []; // 没有远程仓库
            }

            // 检查是否需要fetch
            const fetchResult = spawnSync("git", ["fetch", "origin"], {
                stdio: "pipe",
                stderr: "pipe",
            });

            if (fetchResult.status !== 0) {
                console.warn("⚠️ 无法获取远程更新，跳过冲突检测");
                return [];
            }

            // 检查是否有未推送的提交
            const ahead = spawnSync("git", ["rev-list", "--count", "@{u}"], {
                encoding: "utf8",
            }).stdout.trim();

            if (ahead === "0") {
                return []; // 没有未推送的提交
            }

            // 这里可以添加更复杂的冲突检测逻辑
            return [];
        } catch {
            return [];
        }
    }

    provideConflictResolution(conflicts) {
        console.log("\n💡 冲突解决建议:");
        console.log("1. 运行 git status 查看冲突文件");
        console.log("2. 手动解决冲突并标记为已解决");
        console.log("3. 运行 git add <resolved-files>");
        console.log("4. 重新运行 pnpm smart-push");

        // 根据冲突类型提供具体建议
        const apiConflicts = conflicts.filter((c) => c.file.includes("api"));
        const configConflicts = conflicts.filter((c) =>
            c.file.includes("config"),
        );

        if (apiConflicts.length > 0) {
            console.log("\n📡 API冲突处理:");
            console.log("- 检查API端点是否被删除或修改");
            console.log("- 更新相关的API文档");
            console.log("- 通知使用API变更的团队");
        }

        if (configConflicts.length > 0) {
            console.log("\n⚙️ 配置冲突处理:");
            console.log("- 比较配置差异并选择合适的版本");
            console.log("- 测试配置更改是否影响功能");
            console.log("- 更新环境配置文件");
        }
    }

    async commitChanges() {
        if (!this.options.autoCommit) {
            console.log("\n📝 跳过自动提交（AUTO_COMMIT=0）");
            return;
        }

        console.log("\n📝 提交变更...");

        try {
            const commit = this.sessionData.selectedCommit;
            const commitMessage = this.formatCommitMessage(commit);

            // 添加所有变更
            spawnSync("git", ["add", "-A"], { stdio: "inherit" });

            // 提交
            const result = spawnSync("git", ["commit", "-m", commitMessage], {
                stdio: "inherit",
            });

            if (result.status !== 0) {
                throw new Error("提交失败");
            }

            console.log(
                `✅ 提交成功: ${commit.type}${commit.scope ? `(${commit.scope})` : ""}: ${commit.description}`,
            );
        } catch (error) {
            throw new Error(`提交变更失败: ${error.message}`);
        }
    }

    formatCommitMessage(commit) {
        let message = `${commit.type}`;
        if (commit.scope) {
            message += `(${commit.scope})`;
        }
        message += `: ${commit.description}`;

        if (commit.body) {
            message += `\n\n${commit.body}`;
        }

        if (commit.breakingChange) {
            message += `\n\nBREAKING CHANGE: `;
        }

        if (commit.footers && commit.footers.length > 0) {
            message += `\n\n${commit.footers.join("\n")}`;
        }

        return message;
    }

    async syncAndPush() {
        console.log("\n🔄 同步和推送...");

        try {
            // 拉取远程更新
            console.log("  获取远程更新...");
            spawnSync("git", ["pull", "--rebase", "--autostash"], {
                stdio: "inherit",
            });

            // 检查是否有新的冲突
            const conflicts = this.checkForConflicts();
            if (conflicts.length > 0) {
                throw new Error(
                    `Rebase后产生新的冲突: ${conflicts.join(", ")}`,
                );
            }

            // 推送到远程
            console.log("  推送到远程仓库...");
            spawnSync("git", ["push"], {
                stdio: "inherit",
                env: { ...process.env, PNPM_PUSH_RUNNING: "1" },
            });

            console.log("✅ 推送成功");
        } catch (error) {
            throw new Error(`同步和推送失败: ${error.message}`);
        }
    }

    checkForConflicts() {
        try {
            const result = spawnSync(
                "git",
                ["diff", "--name-only", "--diff-filter=U"],
                {
                    encoding: "utf8",
                },
            );
            return result.stdout.trim().split("\n").filter(Boolean);
        } catch {
            return [];
        }
    }

    generateReport() {
        const duration = Date.now() - this.sessionData.startTime;
        const { summary, details, recommendations } =
            this.sessionData.qualityResults || {};

        console.log(`\n${"=".repeat(60)}`);
        console.log("📋 智能推送报告");
        console.log("=".repeat(60));

        console.log(`\n📊 推送概况:`);
        console.log(`  总耗时: ${(duration / 1000).toFixed(2)}s`);
        console.log(
            `  MCP 状态: ${this.options.enableMCP ? "✅ 启用" : "❌ 禁用"}`,
        );
        console.log(
            `  自动提交: ${this.options.autoCommit ? "✅ 启用" : "❌ 禁用"}`,
        );
        console.log(
            `  冲突检测: ${this.options.enableConflictDetection ? "✅ 启用" : "❌ 禁用"}`,
        );

        if (this.sessionData.selectedCommit) {
            console.log(`\n📝 提交信息:`);
            const commit = this.sessionData.selectedCommit;
            console.log(`  类型: ${commit.type}`);
            console.log(`  范围: ${commit.scope || "无"}`);
            console.log(`  描述: ${commit.description}`);
            if (commit.breakingChange) {
                console.log(`  破坏性变更: ⚠️ 是`);
            }
        }

        if (this.sessionData.qualityResults) {
            console.log(`\n🔍 质量检查:`);
            console.log(`  总步骤: ${summary.totalSteps}`);
            console.log(`  成功: ${summary.successCount}`);
            console.log(`  失败: ${summary.failureCount}`);
            console.log(
                `  总体: ${summary.overallSuccess ? "✅ 通过" : "❌ 失败"}`,
            );
        }

        if (recommendations && recommendations.length > 0) {
            console.log(`\n💡 建议:`);
            recommendations.forEach((rec) => console.log(`  ${rec}`));
        }

        console.log(`\n${"=".repeat(60)}`);
    }

    // 工具方法
    getGitStatus() {
        try {
            return spawnSync("git", ["status", "--porcelain"], {
                encoding: "utf8",
            }).stdout;
        } catch {
            return "";
        }
    }

    getStagedFiles() {
        try {
            return spawnSync("git", ["diff", "--cached", "--name-only"], {
                encoding: "utf8",
            })
                .stdout.trim()
                .split("\n")
                .filter(Boolean);
        } catch {
            return [];
        }
    }

    getCurrentBranch() {
        try {
            return spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
                encoding: "utf8",
            }).stdout.trim();
        } catch {
            return "main";
        }
    }

    getRemoteBranch(currentBranch) {
        try {
            // 尝试获取对应的远程分支
            const remote = spawnSync(
                "git",
                ["config", "branch.${currentBranch}.remote"],
                {
                    encoding: "utf8",
                },
            ).stdout.trim();

            if (remote) {
                const merge = spawnSync(
                    "git",
                    ["config", "branch.${currentBranch}.merge"],
                    {
                        encoding: "utf8",
                    },
                ).stdout.trim();

                if (merge?.includes("refs/heads/")) {
                    return merge.replace("refs/heads/", "");
                }
            }

            return `origin/${currentBranch}`;
        } catch {
            return `origin/${currentBranch}`;
        }
    }

    inferScope(files) {
        if (files.length === 0) return null;

        const pathCounts = {};
        for (const file of files) {
            const parts = file.split("/");
            if (parts.length > 1) {
                const path = parts[1]; // src/后面的部分
                pathCounts[path] = (pathCounts[path] || 0) + 1;
            }
        }

        // 返回最常见的路径
        return (
            Object.entries(pathCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
            null
        );
    }
}

// 主入口
async function main() {
    const session = new SmartPushSession();
    await session.initialize();
    await session.execute();
}

// 检查是否直接运行
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { SmartPushSession };
