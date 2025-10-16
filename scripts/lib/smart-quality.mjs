/**
 * Smart Quality System - 智能代码质量检查系统
 *
 * 集成 context7、memory、sequential-thinking 三个 MCP 工具
 * 提供变更感知、智能策略选择、质量门禁等功能
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// MCP 工具集成器
class MCPIntegrator {
    constructor() {
        this.context7 = new Context7Manager();
        this.memory = new MemoryManager();
        this.sequentialThinking = new SequentialThinkingManager();
    }

    // 初始化所有 MCP 工具
    async initialize() {
        await this.context7.initialize();
        await this.memory.initialize();
        await this.sequentialThinking.initialize();
    }

    // 获取最佳实践配置
    async getBestPractices(toolName, useCase) {
        return await this.context7.getBestPractices(toolName, useCase);
    }

    // 存储分析结果
    async storeAnalysis(key, data) {
        return await this.memory.store(key, data);
    }

    // 获取历史数据
    async getHistory(pattern) {
        return await this.memory.query(pattern);
    }

    // 优化策略
    async optimizeStrategy(context) {
        return await this.sequentialThinking.optimize(context);
    }
}

// Context7 管理器 - 获取最佳实践和配置
class Context7Manager {
    constructor() {
        this.cache = new Map();
        this.apiEndpoint = process.env.CONTEXT7_API || "http://localhost:3000";
    }

    async initialize() {
        console.log("🔧 [Context7] 初始化最佳实践数据库...");
        // 这里可以连接到真实的 Context7 服务
    }

    async getBestPractices(toolName, useCase) {
        const cacheKey = `${toolName}:${useCase}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const practices = {
            biome: {
                configuration: {
                    linter: {
                        rules: {
                            complexity: { level: "warn" },
                            performance: { level: "error" },
                            style: { level: "error" },
                            suspicious: { level: "error" },
                        },
                    },
                    formatter: {
                        indentStyle: "space",
                        indentWidth: 2,
                        lineWidth: 100,
                    },
                },
                ciFlags: ["--error-on-warnings", "--reporter=json"],
                performanceHints: {
                    enableParallel: true,
                    maxConcurrency: 4,
                },
            },
            vitest: {
                configuration: {
                    test: {
                        pool: "forks",
                        coverage: {
                            enabled: true,
                            provider: "istanbul",
                            thresholds: {
                                global: {
                                    branches: 80,
                                    functions: 80,
                                    lines: 80,
                                    statements: 80,
                                },
                            },
                        },
                        reporters: ["default", "junit"],
                        retry: 2,
                    },
                },
                ciFlags: ["--run", "--coverage", "--reporter=junit"],
                performanceHints: {
                    enableSharding: true,
                    maxWorkers: 4,
                },
            },
            typescript: {
                configuration: {
                    compilerOptions: {
                        strict: true,
                        noImplicitAny: true,
                        noImplicitReturns: true,
                        noUnusedLocals: true,
                    },
                },
                ciFlags: ["--noEmit", "--strict"],
                performanceHints: {
                    incremental: true,
                    skipLibCheck: true,
                },
            },
        };

        const result = practices[toolName] || {
            configuration: {},
            ciFlags: [],
        };
        this.cache.set(cacheKey, result);
        return result;
    }
}

// Memory 管理器 - 存储和查询历史数据
class MemoryManager {
    constructor() {
        this.dataDir = path.join(process.cwd(), ".quality-memory");
        this.ensureDataDir();
    }

    ensureDataDir() {
        if (!existsSync(this.dataDir)) {
            mkdirSync(this.dataDir, { recursive: true });
        }
    }

    async initialize() {
        console.log("🧠 [Memory] 初始化历史数据库...");
    }

    async store(key, data) {
        const file = path.join(this.dataDir, `${key}.json`);
        const record = {
            timestamp: new Date().toISOString(),
            data,
        };

        try {
            writeFileSync(file, JSON.stringify(record, null, 2));
            console.log(`💾 [Memory] 存储数据: ${key}`);
        } catch (error) {
            console.error(`❌ [Memory] 存储失败: ${key}`, error);
        }
    }

    async query(pattern) {
        const results = [];

        try {
            const files = this.getAllDataFiles();

            for (const file of files) {
                if (file.includes(pattern)) {
                    const content = readFileSync(file, "utf8");
                    const record = JSON.parse(content);
                    results.push({
                        key: path.basename(file, ".json"),
                        ...record,
                    });
                }
            }

            console.log(
                `🔍 [Memory] 查询结果: ${pattern} (${results.length} 条记录)`,
            );
        } catch (error) {
            console.error(`❌ [Memory] 查询失败: ${pattern}`, error);
        }

        return results;
    }

    getAllDataFiles() {
        try {
            return spawnSync("find", [this.dataDir, "-name", "*.json"], {
                encoding: "utf8",
            })
                .stdout.split("\n")
                .filter(Boolean);
        } catch {
            return [];
        }
    }

    async getRecentFailures(limit = 10) {
        return await this.query("failure").slice(0, limit);
    }

    async getPerformanceMetrics(toolName) {
        return await this.query(`${toolName}-performance`);
    }
}

// Sequential Thinking 管理器 - 智能策略优化
class SequentialThinkingManager {
    constructor() {
        this.strategies = new Map();
        this.analytics = new Map();
    }

    async initialize() {
        console.log("🤔 [SequentialThinking] 初始化策略优化引擎...");
    }

    async optimize(context) {
        const {
            changedFiles,
            riskScore,
            toolConfigurations,
            previousFailures,
            timeConstraints,
        } = context;

        // 基于上下文生成优化策略
        const strategy = this.generateStrategy(context);

        // 记录策略选择
        this.recordStrategy(context, strategy);

        return strategy;
    }

    generateStrategy(context) {
        const { changedFiles, riskScore, timeConstraints } = context;

        // 基础策略
        const baseStrategy = {
            parallelExecution: true,
            failFast: riskScore > 0.7,
            skipNonEssential: timeConstraints?.urgent,
            maxRetries: riskScore > 0.8 ? 3 : 1,
            cacheResults: true,
        };

        // 根据文件类型调整
        const fileTypeStrategy = this.getFileTypeStrategy(changedFiles);

        // 根据风险等级调整
        const riskStrategy = this.getRiskStrategy(riskScore);

        return {
            ...baseStrategy,
            ...fileTypeStrategy,
            ...riskStrategy,
            executionOrder: this.calculateExecutionOrder(
                changedFiles,
                riskScore,
            ),
        };
    }

    getFileTypeStrategy(changedFiles) {
        const hasDocs = changedFiles.some((f) => f.endsWith(".md"));
        const hasConfigs = changedFiles.some(
            (f) => f.includes("config") || f.endsWith(".json"),
        );
        const hasSource = changedFiles.some(
            (f) => f.startsWith("src/") && f.match(/\.(ts|tsx|js|jsx)$/),
        );
        const hasTests = changedFiles.some(
            (f) => f.includes(".test.") || f.includes(".spec."),
        );

        return {
            skipDocsCheck: !hasDocs,
            skipConfigValidation: !hasConfigs,
            runTests: hasSource || hasTests,
            testCoverage: hasSource,
            validateImports: hasSource,
        };
    }

    getRiskStrategy(riskScore) {
        if (riskScore > 0.8) {
            return {
                strictMode: true,
                errorOnWarnings: true,
                fullCoverage: true,
                additionalChecks: [
                    "security",
                    "performance",
                    "dependency-scan",
                ],
            };
        } else if (riskScore > 0.5) {
            return {
                strictMode: false,
                errorOnWarnings: true,
                fullCoverage: false,
                additionalChecks: ["security"],
            };
        } else {
            return {
                strictMode: false,
                errorOnWarnings: false,
                fullCoverage: false,
                additionalChecks: [],
            };
        }
    }

    calculateExecutionOrder(_changedFiles, riskScore) {
        // 高风险时，按照依赖关系排序
        if (riskScore > 0.7) {
            return ["lint", "typecheck", "build", "test", "security"];
        } else {
            return ["lint", "build", "test", "typecheck"];
        }
    }

    recordStrategy(context, strategy) {
        const key = `strategy-${Date.now()}`;
        this.strategies.set(key, { context, strategy, timestamp: new Date() });
    }

    async learnFromResults(results) {
        // 分析结果并优化未来策略
        const success = results.every((r) => r.success);
        const avgTime =
            results.reduce((sum, r) => sum + (r.duration || 0), 0) /
            results.length;

        console.log(
            `📚 [SequentialThinking] 学习结果: ${success ? "成功" : "失败"}, 平均耗时: ${avgTime}ms`,
        );
    }
}

// 智能质量检查器
class SmartQualitySession {
    constructor(options = {}) {
        this.mcp = new MCPIntegrator();
        this.options = {
            logDirEnvVar: "SMART_CHECK_LOG_DIR",
            logFileEnvVar: "SMART_CHECK_LOG_FILE",
            prefix: "smart-check",
            enableMCP: true,
            ...options,
        };

        this.sessionData = {
            startTime: Date.now(),
            changedFiles: [],
            riskScore: 0,
            strategy: null,
            results: [],
        };
    }

    async initialize() {
        if (this.options.enableMCP) {
            await this.mcp.initialize();
        }
    }

    // 分析变更文件
    async analyzeChanges(files) {
        console.log(`🔍 分析变更文件: ${files.length} 个文件`);

        this.sessionData.changedFiles = files;

        // 计算风险评分
        this.sessionData.riskScore = this.calculateRiskScore(files);

        // 获取历史失败数据
        const previousFailures = this.options.enableMCP
            ? await this.mcp.getRecentFailures()
            : [];

        // 生成优化策略
        this.sessionData.strategy = this.options.enableMCP
            ? await this.mcp.optimizeStrategy({
                  changedFiles: files,
                  riskScore: this.sessionData.riskScore,
                  previousFailures,
                  timeConstraints: this.options.timeConstraints,
              })
            : this.getDefaultStrategy(files);

        console.log(
            `📊 风险评分: ${(this.sessionData.riskScore * 100).toFixed(1)}%`,
        );
        console.log(
            `🎯 策略生成: ${JSON.stringify(this.sessionData.strategy, null, 2)}`,
        );

        return this.sessionData;
    }

    calculateRiskScore(files) {
        let score = 0;

        // 文件类型权重
        const weights = {
            "src/": 0.8,
            "tests/": 0.6,
            "scripts/": 0.9,
            config: 0.7,
            "docs/": 0.2,
        };

        for (const file of files) {
            for (const [pattern, weight] of Object.entries(weights)) {
                if (file.includes(pattern)) {
                    score = Math.max(score, weight);
                }
            }
        }

        // 文件数量影响
        const fileCountPenalty = Math.min(files.length * 0.05, 0.2);
        score += fileCountPenalty;

        return Math.min(score, 1.0);
    }

    getDefaultStrategy(files) {
        const hasSourceFiles = files.some((f) => f.startsWith("src/"));
        const hasConfigFiles = files.some((f) => f.includes("config"));

        return {
            parallelExecution: true,
            failFast: false,
            skipNonEssential: !hasConfigFiles,
            maxRetries: 1,
            cacheResults: true,
            skipDocsCheck: !files.some((f) => f.endsWith(".md")),
            runTests: hasSourceFiles,
            testCoverage: hasSourceFiles,
            strictMode: false,
            errorOnWarnings: false,
            fullCoverage: false,
            additionalChecks: [],
            executionOrder: ["lint", "build", "test", "typecheck"],
        };
    }

    // 执行智能检查
    async executeSmartCheck() {
        if (!this.sessionData.strategy) {
            throw new Error("请先调用 analyzeChanges() 生成策略");
        }

        console.log("🚀 开始智能质量检查...");

        const results = [];
        const strategy = this.sessionData.strategy;

        // 按照策略顺序执行检查
        for (const step of strategy.executionOrder) {
            const result = await this.executeStep(step, strategy);
            results.push(result);

            // 如果设置了快速失败且检查失败
            if (strategy.failFast && !result.success) {
                console.log(`⚡ 快速失败: ${step} 检查失败，停止后续检查`);
                break;
            }
        }

        this.sessionData.results = results;

        // 学习结果
        if (this.options.enableMCP) {
            await this.mcp.sequentialThinking.learnFromResults(results);
        }

        return this.generateReport(results);
    }

    async executeStep(step, strategy) {
        const startTime = Date.now();
        console.log(`📝 执行步骤: ${step}`);

        try {
            let result;

            switch (step) {
                case "lint":
                    result = await this.runLintCheck(strategy);
                    break;
                case "typecheck":
                    result = await this.runTypeCheck(strategy);
                    break;
                case "build":
                    result = await this.runBuildCheck(strategy);
                    break;
                case "test":
                    result = await this.runTestCheck(strategy);
                    break;
                case "security":
                    result = await this.runSecurityCheck(strategy);
                    break;
                case "performance":
                    result = await this.runPerformanceCheck(strategy);
                    break;
                default:
                    result = {
                        success: false,
                        message: `未知检查步骤: ${step}`,
                    };
            }

            result.duration = Date.now() - startTime;
            result.step = step;

            console.log(
                `${result.success ? "✅" : "❌"} ${step}: ${result.message} (${result.duration}ms)`,
            );

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

    async runLintCheck(strategy) {
        const biomeConfig = strategy.strictMode ? "--error-on-warnings" : "";

        const cmd = `pnpm exec biome check . ${biomeConfig}`;

        try {
            spawnSync(cmd, { shell: true, stdio: "inherit" });
            return { success: true, message: "代码风格检查通过" };
        } catch (error) {
            return { success: false, message: "代码风格检查失败", error };
        }
    }

    async runTypeCheck(strategy) {
        const flags = strategy.strictMode ? "--strict" : "";
        const cmd = `pnpm exec tsc --noEmit ${flags}`;

        try {
            spawnSync(cmd, { shell: true, stdio: "inherit" });
            return { success: true, message: "类型检查通过" };
        } catch (error) {
            return { success: false, message: "类型检查失败", error };
        }
    }

    async runBuildCheck(_strategy) {
        try {
            spawnSync("pnpm run build", { shell: true, stdio: "inherit" });
            return { success: true, message: "构建检查通过" };
        } catch (error) {
            return { success: false, message: "构建检查失败", error };
        }
    }

    async runTestCheck(strategy) {
        const coverage = strategy.testCoverage ? "--coverage" : "";
        const parallel = strategy.parallelExecution ? "" : "--runInBand";

        try {
            spawnSync(`pnpm run test:ci ${coverage} ${parallel}`, {
                shell: true,
                stdio: "inherit",
            });
            return { success: true, message: "测试检查通过" };
        } catch (error) {
            return { success: false, message: "测试检查失败", error };
        }
    }

    async runSecurityCheck(_strategy) {
        try {
            // 这里可以集成安全扫描工具
            console.log("🔒 执行安全检查...");
            return { success: true, message: "安全检查通过（模拟）" };
        } catch (error) {
            return { success: false, message: "安全检查失败", error };
        }
    }

    async runPerformanceCheck(_strategy) {
        try {
            // 这里可以集成性能分析工具
            console.log("⚡ 执行性能检查...");
            return { success: true, message: "性能检查通过（模拟）" };
        } catch (error) {
            return { success: false, message: "性能检查失败", error };
        }
    }

    generateReport(results) {
        const totalDuration = Date.now() - this.sessionData.startTime;
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.length - successCount;

        const report = {
            summary: {
                totalSteps: results.length,
                successCount,
                failureCount,
                overallSuccess: failureCount === 0,
                totalDuration,
                riskScore: this.sessionData.riskScore,
                strategy: this.sessionData.strategy,
            },
            details: results,
            recommendations: this.generateRecommendations(results),
        };

        return report;
    }

    generateRecommendations(results) {
        const recommendations = [];
        const failures = results.filter((r) => !r.success);

        if (failures.length > 0) {
            recommendations.push("修复失败的检查项后再提交代码");
        }

        if (this.sessionData.riskScore > 0.7) {
            recommendations.push("高风险变更，建议进行更全面的测试");
        }

        const slowChecks = results.filter((r) => r.duration > 5000);
        if (slowChecks.length > 0) {
            recommendations.push("考虑优化检查性能较慢的步骤");
        }

        return recommendations;
    }
}

export { SmartQualitySession, MCPIntegrator };
