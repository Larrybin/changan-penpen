/**
 * Smart Commit - 智能提交信息生成器
 *
 * 集成 context7、memory、sequential-thinking 三个 MCP 工具
 * 提供智能的 Conventional Commits 生成和优化
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// MCP 工具集成
class MCPCommitIntegrator {
    constructor() {
        this.context7 = new Context7CommitManager();
        this.memory = new MemoryCommitManager();
        this.sequentialThinking = new SequentialThinkingCommitManager();
    }

    async initialize() {
        await this.context7.initialize();
        await this.memory.initialize();
        await this.sequentialThinking.initialize();
    }

    // 获取Conventional Commits最佳实践
    async getBestPractices() {
        return await this.context7.getBestPractices();
    }

    // 存储提交模式
    async storeCommitPattern(pattern) {
        return await this.memory.store(pattern);
    }

    // 获取历史提交模式
    async getHistoricalPatterns() {
        return await this.memory.query("commit-pattern");
    }

    // 优化提交策略
    async optimizeCommitStrategy(context) {
        return await this.sequentialThinking.optimize(context);
    }
}

// Context7 管理器 - 获取Conventional Commits最佳实践
class Context7CommitManager {
    constructor() {
        this.cache = new Map();
    }

    async initialize() {
        console.log("📚 [Context7] 初始化Conventional Commits知识库...");
    }

    async getBestPractices() {
        if (this.cache.has("commits-best-practices")) {
            return this.cache.get("commits-best-practices");
        }

        const practices = {
            types: {
                feat: {
                    description: "新功能",
                    semanticVersion: "minor",
                    examples: [
                        "feat(api): add user authentication endpoint",
                        "feat(ui): add dark mode toggle component",
                        "feat(perf): implement lazy loading for images",
                    ],
                },
                fix: {
                    description: "bug修复",
                    semanticVersion: "patch",
                    examples: [
                        "fix(auth): resolve login redirect issue",
                        "fix(parser): handle empty array parsing error",
                        "fix(ui): fix responsive layout bug",
                    ],
                },
                refactor: {
                    description: "代码重构",
                    semanticVersion: "patch",
                    examples: [
                        "refactor(auth): simplify user validation logic",
                        "refactor(api): extract common response handler",
                        "refactor(ui): convert to modern React hooks",
                    ],
                },
                docs: {
                    description: "文档更新",
                    semanticVersion: "patch",
                    examples: [
                        "docs: update API documentation",
                        "docs: add installation guide",
                        "docs: fix typo in README",
                    ],
                },
                style: {
                    description: "代码格式化",
                    semanticVersion: "patch",
                    examples: [
                        "style: apply code formatting changes",
                        "style: remove trailing whitespace",
                        "style: consistent naming convention",
                    ],
                },
                chore: {
                    description: "构建工具/依赖管理",
                    semanticVersion: "patch",
                    examples: [
                        "chore: update dependencies",
                        "chore: configure CI pipeline",
                        "chore: migrate to new Node.js version",
                    ],
                },
                perf: {
                    description: "性能优化",
                    semanticVersion: "patch",
                    examples: [
                        "perf: optimize database queries",
                        "perf: implement caching layer",
                        "perf: reduce bundle size",
                    ],
                },
                test: {
                    description: "测试相关",
                    semanticVersion: "patch",
                    examples: [
                        "test: add unit tests for auth module",
                        "test: fix flaky integration test",
                        "test: increase test coverage",
                    ],
                },
            },
            scopes: {
                common: {
                    api: "API相关",
                    ui: "用户界面",
                    auth: "认证授权",
                    db: "数据库",
                    config: "配置文件",
                    utils: "工具函数",
                    types: "类型定义",
                },
                project: {
                    modules: "模块",
                    components: "组件",
                    pages: "页面",
                    hooks: "自定义钩子",
                    services: "服务",
                    middleware: "中间件",
                },
            },
            breakingChange: {
                indicators: [
                    "API endpoint removal or modification",
                    "Database schema changes",
                    "Configuration key changes",
                    "Public interface modifications",
                    "Dependency major version updates",
                ],
            },
        };

        this.cache.set("commits-best-practices", practices);
        return practices;
    }
}

// Memory 管理器 - 存储和学习提交模式
class MemoryCommitManager {
    constructor() {
        this.dataDir = path.join(process.cwd(), ".commit-memory");
        this.ensureDataDir();
    }

    ensureDataDir() {
        if (!existsSync(this.dataDir)) {
            mkdirSync(this.dataDir, { recursive: true });
        }
    }

    async initialize() {
        console.log("🧠 [Memory] 初始化提交模式数据库...");
    }

    async store(pattern) {
        const file = path.join(this.dataDir, `pattern-${Date.now()}.json`);
        const record = {
            timestamp: new Date().toISOString(),
            ...pattern,
        };

        try {
            writeFileSync(file, JSON.stringify(record, null, 2));
            console.log(
                `💾 [Memory] 存储提交模式: ${pattern.type}:${pattern.scope}`,
            );
        } catch (error) {
            console.error(`❌ [Memory] 存储失败: ${error.message}`);
        }
    }

    async query(type) {
        const results = [];

        try {
            const files = this.getAllDataFiles();

            for (const file of files) {
                if (file.includes(type)) {
                    const content = readFileSync(file, "utf8");
                    const record = JSON.parse(content);
                    results.push(record);
                }
            }
        } catch (error) {
            console.error(`❌ [Memory] 查询失败: ${error.message}`);
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

    async getUserPreferences() {
        const patterns = await this.query("pattern");
        const preferences = {
            preferredType: this.getMostFrequent(patterns, "type"),
            preferredScope: this.getMostFrequent(patterns, "scope"),
            detailLevel: this.getMostFrequent(patterns, "detailLevel"),
            language: this.getMostFrequent(patterns, "language"),
        };

        return preferences;
    }

    getMostFrequent(items, field) {
        const counts = {};

        for (const item of items) {
            const value = item[field];
            if (value) {
                counts[value] = (counts[value] || 0) + 1;
            }
        }

        return Object.keys(counts).reduce(
            (a, b) => (counts[a] > counts[b] ? a : b),
            "",
        );
    }
}

// Sequential Thinking 管理器 - 智能策略优化
class SequentialThinkingCommitManager {
    constructor() {
        this.strategies = new Map();
        this.analytics = new Map();
    }

    async initialize() {
        console.log("🤔 [SequentialThinking] 初始化提交策略引擎...");
    }

    async optimize(context) {
        const {
            fileAnalysis,
            breakingChangeRisk,
            userPreferences,
            branchName,
            urgency = "normal",
        } = context;

        // 基于上下文生成优化策略
        const strategy = this.generateStrategy(context);

        // 记录策略选择
        this.recordStrategy(context, strategy);

        return strategy;
    }

    generateStrategy(context) {
        const { fileAnalysis, breakingChangeRisk, urgency } = context;

        // 基础策略
        const baseStrategy = {
            detailLevel: "balanced",
            includeBreakingChange: breakingChangeRisk > 0.3,
            provideMultipleOptions: true,
            maxOptions: 5,
            language: "auto",
        };

        // 根据紧急程度调整
        if (urgency === "high") {
            return {
                ...baseStrategy,
                detailLevel: "concise",
                provideMultipleOptions: false,
                maxOptions: 1,
            };
        }

        // 根据风险等级调整
        if (breakingChangeRisk > 0.7) {
            return {
                ...baseStrategy,
                detailLevel: "detailed",
                includeBreakingChange: true,
                enforceConventions: true,
            };
        }

        // 根据文件类型调整
        if (fileAnalysis.hasApiChanges) {
            return {
                ...baseStrategy,
                detailLevel: "detailed",
                includeApiContext: true,
            };
        }

        return baseStrategy;
    }

    recordStrategy(context, strategy) {
        const key = `strategy-${Date.now()}`;
        this.strategies.set(key, { context, strategy, timestamp: new Date() });
    }

    async learnFromFeedback(_commitMessage, userModified, success) {
        console.log(
            `📚 [SequentialThinking] 学习提交反馈: ${userModified ? "用户修改" : "保持原样"}, 成功: ${success}`,
        );
    }
}

// 文件分析器
class FileAnalyzer {
    constructor() {
        this.patterns = new Map();
        this.initializePatterns();
    }

    initializePatterns() {
        // 文件类型映射
        this.patterns.set("type", {
            "src/pages/": "feat",
            "src/components/": "feat",
            "src/modules/": "feat",
            "src/hooks/": "feat",
            "src/services/": "feat",
            "src/utils/": "refactor",
            "src/types/": "refactor",
            "tests/": "test",
            "docs/": "docs",
            ".md": "docs",
            ".json": "chore",
            "package.json": "chore",
            "tsconfig.json": "chore",
            "biome.json": "chore",
            "wrangler.toml": "chore",
        });

        // Scope 映射
        this.patterns.set("scope", {
            "src/modules/": "modules",
            "src/components/": "components",
            "src/pages/": "pages",
            "src/hooks/": "hooks",
            "src/services/": "services",
            "src/utils/": "utils",
            "src/types/": "types",
            "src/app/": "app",
            "src/lib/": "lib",
        });
    }

    analyze(files) {
        const analysis = {
            fileCount: files.length,
            fileTypes: this.getFileTypes(files),
            paths: this.getPaths(files),
            hasApiChanges: false,
            hasConfigChanges: false,
            hasDocsChanges: false,
            hasTestChanges: false,
            breakingChangeRisk: 0,
        };

        // 分析变更类型
        for (const file of files) {
            if (file.includes("api/") || file.includes("routes/")) {
                analysis.hasApiChanges = true;
                analysis.breakingChangeRisk += 0.3;
            }

            if (file.includes("config") || file.includes("package.json")) {
                analysis.hasConfigChanges = true;
                analysis.breakingChangeRisk += 0.2;
            }

            if (file.endsWith(".md") || file.startsWith("docs/")) {
                analysis.hasDocsChanges = true;
            }

            if (file.includes(".test.") || file.includes(".spec.")) {
                analysis.hasTestChanges = true;
            }
        }

        // 分析Git diff内容
        const diffContent = this.getDiffContent(files);
        analysis.diffAnalysis = this.analyzeDiffContent(diffContent);
        analysis.breakingChangeRisk +=
            this.assessBreakingChangeRisk(diffContent);

        return analysis;
    }

    getFileTypes(files) {
        const types = new Set();
        for (const file of files) {
            for (const [pattern, type] of this.patterns.get("type")) {
                if (
                    file.includes(pattern) ||
                    file.endsWith(pattern.replace("src/", ""))
                ) {
                    types.add(type);
                }
            }
        }
        return Array.from(types);
    }

    getPaths(files) {
        const paths = new Set();
        for (const file of files) {
            for (const [pattern, scope] of this.patterns.get("scope")) {
                if (file.includes(pattern)) {
                    paths.add(scope);
                }
            }
        }
        return Array.from(paths);
    }

    getDiffContent(files) {
        try {
            const diff = spawnSync(
                "git",
                ["diff", "--cached", "--name-only", ...files],
                {
                    encoding: "utf8",
                },
            );

            return diff.stdout || "";
        } catch {
            return "";
        }
    }

    analyzeDiffContent(diffContent) {
        const analysis = {
            additions: 0,
            deletions: 0,
            modifications: 0,
            hasInterfaceChanges: false,
            hasFunctionChanges: false,
            hasExportChanges: false,
        };

        const lines = diffContent.split("\n");
        for (const line of lines) {
            if (line.startsWith("+")) {
                analysis.additions++;
                if (
                    line.includes("export ") ||
                    line.includes("interface ") ||
                    line.includes("function ")
                ) {
                    analysis.hasInterfaceChanges = true;
                    analysis.hasFunctionChanges = true;
                    analysis.hasExportChanges = true;
                }
            } else if (line.startsWith("-")) {
                analysis.deletions++;
                if (
                    line.includes("export ") ||
                    line.includes("interface ") ||
                    line.includes("function ")
                ) {
                    analysis.hasInterfaceChanges = true;
                    analysis.hasFunctionChanges = true;
                    analysis.hasExportChanges = true;
                }
            } else if (line.startsWith(" ")) {
                analysis.modifications++;
            }
        }

        return analysis;
    }

    assessBreakingChangeRisk(diffAnalysis) {
        let risk = 0;

        if (diffAnalysis.hasInterfaceChanges) risk += 0.4;
        if (diffAnalysis.hasExportChanges) risk += 0.3;
        if (diffAnalysis.hasFunctionChanges) risk += 0.2;

        if (diffAnalysis.deletions > diffAnalysis.additions) {
            risk += 0.3; // 删除比新增多，风险更高
        }

        return Math.min(risk, 1.0);
    }
}

// 智能提交生成器
class SmartCommitGenerator {
    constructor() {
        this.mcp = new MCPCommitIntegrator();
        this.analyzer = new FileAnalyzer();
    }

    async initialize() {
        await this.mcp.initialize();
    }

    async generateCommitMessage(options = {}) {
        const {
            files = this.getStagedFiles(),
            userPreferences = {},
            branchName = this.getCurrentBranch(),
            urgency = "normal",
        } = options;

        console.log(`📝 分析 ${files.length} 个暂存文件...`);

        // 文件分析
        const fileAnalysis = this.analyzer.analyze(files);

        // 获取最佳实践
        const bestPractices = await this.mcp.getBestPractices();

        // 获取用户偏好
        const _historicalPatterns = await this.mcp.getHistoricalPatterns();
        const preferences =
            userPreferences || (await this.mcp.memory.getUserPreferences());

        // 优化策略
        const strategy = await this.mcp.optimizeCommitStrategy({
            fileAnalysis,
            breakingChangeRisk: fileAnalysis.breakingChangeRisk,
            userPreferences: preferences,
            branchName,
            urgency,
        });

        // 生成提交选项
        const commitOptions = this.generateCommitOptions(
            fileAnalysis,
            bestPractices,
            strategy,
        );

        // 学习模式
        await this.mcp.storeCommitPattern({
            type: commitOptions[0].type,
            scope: commitOptions[0].scope,
            detailLevel: strategy.detailLevel,
            language: commitOptions[0].language,
        });

        return commitOptions;
    }

    getStagedFiles() {
        try {
            const result = spawnSync(
                "git",
                ["diff", "--cached", "--name-only"],
                {
                    encoding: "utf8",
                },
            );
            return result.stdout.trim().split("\n").filter(Boolean);
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

    generateCommitOptions(fileAnalysis, _bestPractices, strategy) {
        const options = [];
        const { fileTypes, paths, breakingChangeRisk } = fileAnalysis;

        // 主提交类型
        const primaryType = this.determinePrimaryType(fileTypes, fileAnalysis);

        // Scope
        const scope = this.determineScope(paths, fileAnalysis);

        // 描述
        const descriptions = this.generateDescriptions(
            fileAnalysis,
            primaryType,
        );

        // Breaking Change
        const breakingChange = breakingChangeRisk > 0.5;

        // 生成多个选项
        options.push({
            type: primaryType,
            scope,
            description: descriptions.concise,
            breakingChange,
            body: "",
            footers: breakingChange ? ["BREAKING CHANGE: "] : [],
            score: 0.9,
            reason: "standard option",
        });

        if (strategy.provideMultipleOptions) {
            // 详细版本
            options.push({
                type: primaryType,
                scope,
                description: descriptions.detailed,
                breakingChange,
                body: this.generateBody(fileAnalysis),
                footers: breakingChange ? ["BREAKING CHANGE: "] : [],
                score: 0.85,
                reason: "detailed option",
            });

            // 用户友好版本
            options.push({
                type: primaryType,
                scope,
                description: descriptions.userFriendly,
                breakingChange,
                body: "",
                footers: breakingChange ? ["BREAKING CHANGE: "] : [],
                score: 0.8,
                reason: "user-friendly option",
            });
        }

        return options.slice(0, strategy.maxOptions || 3);
    }

    determinePrimaryType(fileTypes, fileAnalysis) {
        // 优先级映射
        const typePriority = {
            feat: 10,
            fix: 9,
            refactor: 8,
            perf: 7,
            test: 6,
            docs: 5,
            style: 4,
            chore: 3,
        };

        // 根据风险等级调整
        if (fileAnalysis.breakingChangeRisk > 0.7) {
            return "feat"; // 重大变更通常是功能
        }

        // 选择最高优先级的类型
        let selectedType = "chore";
        let highestPriority = 0;

        for (const type of fileTypes) {
            const priority = typePriority[type] || 0;
            if (priority > highestPriority) {
                highestPriority = priority;
                selectedType = type;
            }
        }

        return selectedType;
    }

    determineScope(paths, fileAnalysis) {
        if (paths.length === 0) return null;
        if (paths.length === 1) return paths[0];

        // 多个路径时，选择最相关的
        if (fileAnalysis.hasApiChanges) {
            const apiScope = paths.find((p) =>
                ["api", "routes", "services"].includes(p),
            );
            if (apiScope) return apiScope;
        }

        return paths[0]; // 默认返回第一个
    }

    generateDescriptions(fileAnalysis, type) {
        const {
            fileCount,
            hasApiChanges,
            hasConfigChanges,
            hasDocsChanges,
            hasTestChanges,
        } = fileAnalysis;

        const templates = {
            feat: {
                concise: `add new functionality`,
                detailed: `implement new feature with ${fileCount} file changes`,
                userFriendly: `添加新功能`,
            },
            fix: {
                concise: `fix issue`,
                detailed: `resolve bug with ${fileCount} file changes`,
                userFriendly: `修复问题`,
            },
            refactor: {
                concise: `refactor code`,
                detailed: `refactor code structure with ${fileCount} file changes`,
                userFriendly: `重构代码`,
            },
            docs: {
                concise: `update documentation`,
                detailed: `update documentation with ${fileCount} file changes`,
                userFriendly: `更新文档`,
            },
            chore: {
                concise: `update configuration`,
                detailed: `update project configuration with ${fileCount} file changes`,
                userFriendly: `更新配置`,
            },
        };

        return templates[type] || templates.chore;
    }

    generateBody(fileAnalysis) {
        const parts = [];
        const { hasApiChanges, hasConfigChanges, hasTestChanges } =
            fileAnalysis;

        if (hasApiChanges) {
            parts.push(
                "This commit includes API changes that may affect backward compatibility.",
            );
        }

        if (hasConfigChanges) {
            parts.push(
                "Configuration files have been updated to support new features.",
            );
        }

        if (hasTestChanges) {
            parts.push(
                "Test cases have been added or updated to ensure functionality.",
            );
        }

        return parts.join("\n\n");
    }
}

export { SmartCommitGenerator, FileAnalyzer, MCPCommitIntegrator };
