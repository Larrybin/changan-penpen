#!/usr/bin/env node

/**
 * 文档一致性检查器 - 智能化文档一致性检查系统
 * 集成MCP工具提供智能文档分析和一致性验证
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocConsistencyChecker {
    constructor(options = {}) {
        this.options = {
            enableMCP: process.env.ENABLE_MCP === "1",
            strictMode: process.env.DOC_STRICT_MODE === "1",
            checkLinks: process.env.CHECK_LINKS !== "0",
            checkAPI: process.env.CHECK_API !== "0",
            checkCode: process.env.CHECK_CODE !== "0",
            checkReadme: process.env.CHECK_README !== "0",
            maxFileSize: 1024 * 1024, // 1MB
            timeout: 30000,
            ...options,
        };

        this.issues = [];
        this.stats = {
            filesChecked: 0,
            issuesFound: 0,
            warningsFound: 0,
            linksChecked: 0,
            apiDocsChecked: 0,
            codeBlocksChecked: 0,
        };
    }

    /**
     * 执行完整的文档一致性检查
     */
    async checkAll() {
        console.log("📚 开始文档一致性检查...");
        console.log(
            `📋 配置: MCP=${this.options.enableMCP ? "启用" : "禁用"}, 严格模式=${this.options.strictMode ? "启用" : "禁用"}`,
        );

        try {
            // 1. 收集所有文档文件
            const docFiles = await this.collectDocFiles();
            console.log(`📁 发现 ${docFiles.length} 个文档文件`);

            // 2. 执行各种一致性检查
            await this.performConsistencyChecks(docFiles);

            // 3. 生成报告
            const report = await this.generateReport();

            return {
                success:
                    this.issues.filter((i) => i.severity === "error").length ===
                    0,
                stats: this.stats,
                issues: this.issues,
                report,
                recommendations: await this.generateRecommendations(),
            };
        } catch (error) {
            console.error("❌ 文档一致性检查失败:", error.message);
            return {
                success: false,
                error: error.message,
                stats: this.stats,
                issues: this.issues,
            };
        }
    }

    /**
     * 收集所有文档文件
     */
    async collectDocFiles() {
        const docFiles = [];

        // 定义文档文件扩展名
        const docExtensions = [".md", ".mdx", ".txt", ".rst"];

        // 递归搜索文档文件
        const searchDirectory = async (dir, baseDir = "") => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.join(baseDir, entry.name);

                    if (entry.isDirectory()) {
                        // 跳过某些目录
                        if (this.shouldSkipDirectory(entry.name)) {
                            continue;
                        }
                        await searchDirectory(fullPath, relativePath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (docExtensions.includes(ext)) {
                            docFiles.push({
                                path: fullPath,
                                relativePath,
                                extension: ext,
                                size: (await fs.stat(fullPath)).size,
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ 无法读取目录 ${dir}: ${error.message}`);
            }
        };

        // 搜索项目根目录
        await searchDirectory(path.join(__dirname, "../.."));

        // 按文件大小排序，大文件优先检查
        return docFiles.sort((a, b) => b.size - a.size);
    }

    /**
     * 执行各种一致性检查
     */
    async performConsistencyChecks(docFiles) {
        console.log("🔍 执行文档一致性检查...");

        // 并行执行检查以提高性能
        const checks = [
            this.checkFileStructure(docFiles),
            this.checkLinkConsistency(docFiles),
            this.checkAPIDocumentation(docFiles),
            this.checkCodeBlockConsistency(docFiles),
            this.checkTableOfContents(docFiles),
            this.checkMetadataConsistency(docFiles),
        ];

        // 如果启用MCP，添加MCP增强检查
        if (this.options.enableMCP) {
            checks.push(this.performMCPEnhancedChecks(docFiles));
        }

        await Promise.allSettled(checks);
    }

    /**
     * 检查文件结构一致性
     */
    async checkFileStructure(docFiles) {
        console.log("  📂 检查文件结构一致性...");

        // 检查重复文件
        const fileHashes = new Map();
        for (const file of docFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");
                const hash = this.simpleHash(content);

                if (fileHashes.has(hash)) {
                    const duplicate = fileHashes.get(hash);
                    this.addIssue({
                        type: "duplicate_file",
                        severity: "warning",
                        file: file.relativePath,
                        duplicateFile: duplicate.relativePath,
                        message: `发现重复文件: ${file.relativePath} 与 ${duplicate.relativePath}`,
                    });
                } else {
                    fileHashes.set(hash, file);
                }
            } catch (error) {
                this.addIssue({
                    type: "file_read_error",
                    severity: "warning",
                    file: file.relativePath,
                    message: `无法读取文件: ${error.message}`,
                });
            }
        }

        // 检查文件命名规范
        const namingPatterns = {
            "README.md": /^README\.md$/i,
            "CONTRIBUTING.md": /^CONTRIBUTING\.md$/i,
            "CHANGELOG.md": /^CHANGELOG\.md$/i,
            "API.md": /^API(\..*)?\.md$/i,
            "GUIDE.md": /^.*GUIDE\.md$/i,
        };

        for (const file of docFiles) {
            const fileName = path.basename(file.relativePath);

            for (const [pattern, regex] of Object.entries(namingPatterns)) {
                if (regex.test(fileName)) {
                    // 检查文件是否在正确的位置
                    const expectedPath = this.getExpectedFilePath(
                        pattern,
                        file.relativePath,
                    );
                    if (expectedPath && expectedPath !== file.relativePath) {
                        this.addIssue({
                            type: "file_location",
                            severity: "info",
                            file: file.relativePath,
                            expectedLocation: expectedPath,
                            message: `建议将文件移动到: ${expectedPath}`,
                        });
                    }
                }
            }
        }

        this.stats.filesChecked = docFiles.length;
    }

    /**
     * 检查链接一致性
     */
    async checkLinkConsistency(docFiles) {
        if (!this.options.checkLinks) {
            console.log("  🔗 跳过链接一致性检查");
            return;
        }

        console.log("  🔗 检查链接一致性...");

        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const localFiles = new Set(
            docFiles.map((f) => f.relativePath.toLowerCase()),
        );

        for (const file of docFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");
                const matches = [...content.matchAll(linkRegex)];

                for (const match of matches) {
                    const linkText = match[1];
                    const linkTarget = match[2];
                    this.stats.linksChecked++;

                    // 检查本地文件链接
                    if (
                        !linkTarget.startsWith("http") &&
                        !linkTarget.startsWith("#")
                    ) {
                        const targetPath = this.resolveLinkPath(
                            file.relativePath,
                            linkTarget,
                        );

                        if (
                            !localFiles.has(targetPath.toLowerCase()) &&
                            !localFiles.has(`${targetPath.toLowerCase()}.md`)
                        ) {
                            this.addIssue({
                                type: "broken_link",
                                severity: "error",
                                file: file.relativePath,
                                linkText,
                                linkTarget,
                                resolvedPath: targetPath,
                                message: `损坏的本地链接: ${linkText} -> ${linkTarget}`,
                            });
                        }
                    }

                    // 检查锚点链接
                    if (linkTarget.startsWith("#")) {
                        const anchor = linkTarget.slice(1);
                        const hasAnchor =
                            content.includes(`#${anchor}`) ||
                            content.includes(`## ${anchor}`);

                        if (!hasAnchor) {
                            this.addIssue({
                                type: "broken_anchor",
                                severity: "warning",
                                file: file.relativePath,
                                linkText,
                                linkTarget,
                                message: `损坏的锚点链接: ${linkTarget}`,
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn(
                    `⚠️ 检查文件链接失败 ${file.relativePath}: ${error.message}`,
                );
            }
        }
    }

    /**
     * 检查API文档一致性
     */
    async checkAPIDocumentation(docFiles) {
        if (!this.options.checkAPI) {
            console.log("  📡 跳过API文档一致性检查");
            return;
        }

        console.log("  📡 检查API文档一致性...");

        // 查找API文档文件
        const apiDocFiles = docFiles.filter(
            (f) =>
                f.relativePath.includes("api") ||
                f.relativePath.includes("API") ||
                f.relativePath.toLowerCase().includes("reference"),
        );

        this.stats.apiDocsChecked = apiDocFiles.length;

        // 检查API代码块格式
        const apiBlockRegex =
            /```(http|bash|curl|javascript|typescript)\n([\s\S]*?)```/g;

        for (const file of apiDocFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");
                const matches = [...content.matchAll(apiBlockRegex)];

                for (const match of matches) {
                    const language = match[1];
                    const code = match[2];

                    // 检查HTTP方法的一致性
                    if (
                        language === "http" ||
                        language === "bash" ||
                        language === "curl"
                    ) {
                        this.checkHTTPMethodConsistency(
                            code,
                            file.relativePath,
                        );
                    }

                    // 检查JSON格式
                    if (code.includes("json") || code.includes("{")) {
                        this.checkJSONFormatConsistency(
                            code,
                            file.relativePath,
                        );
                    }
                }

                // 检查API端点格式一致性
                this.checkAPIEndpointConsistency(content, file.relativePath);
            } catch (error) {
                console.warn(
                    `⚠️ 检查API文档失败 ${file.relativePath}: ${error.message}`,
                );
            }
        }
    }

    /**
     * 检查代码块一致性
     */
    async checkCodeBlockConsistency(docFiles) {
        if (!this.options.checkCode) {
            console.log("  💻 跳过代码块一致性检查");
            return;
        }

        console.log("  💻 检查代码块一致性...");

        const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;

        for (const file of docFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");
                const matches = [...content.matchAll(codeBlockRegex)];

                this.stats.codeBlocksChecked += matches.length;

                for (const match of matches) {
                    const language = match[1];
                    const code = match[2];

                    // 检查代码语法
                    await this.checkCodeSyntax(
                        code,
                        language,
                        file.relativePath,
                    );

                    // 检查代码与实际文件的一致性
                    if (this.isProjectFile(language)) {
                        await this.checkCodeFileConsistency(
                            code,
                            language,
                            file.relativePath,
                        );
                    }
                }
            } catch (error) {
                console.warn(
                    `⚠️ 检查代码块失败 ${file.relativePath}: ${error.message}`,
                );
            }
        }
    }

    /**
     * 检查目录结构一致性
     */
    async checkTableOfContents(docFiles) {
        console.log("  📋 检查目录结构一致性...");

        // 查找README文件
        const readmeFiles = docFiles.filter(
            (f) => path.basename(f.relativePath).toLowerCase() === "readme.md",
        );

        for (const readme of readmeFiles) {
            try {
                const content = await fs.readFile(readme.path, "utf8");

                // 检查是否有目录
                const hasTOC =
                    content.includes("## 目录") ||
                    content.includes("## Table of Contents");

                if (hasTOC) {
                    const headers = this.extractHeaders(content);
                    const tocLinks = this.extractTOCLinks(content);

                    // 检查目录项与实际标题的一致性
                    for (const link of tocLinks) {
                        const matchingHeader = headers.find(
                            (h) =>
                                this.normalizeHeader(h.text) ===
                                this.normalizeHeader(link.text),
                        );

                        if (!matchingHeader) {
                            this.addIssue({
                                type: "toc_mismatch",
                                severity: "warning",
                                file: readme.relativePath,
                                linkText: link.text,
                                linkTarget: link.target,
                                message: `目录项 "${link.text}" 在文档中找不到对应的标题`,
                            });
                        } else if (link.target !== matchingHeader.anchor) {
                            this.addIssue({
                                type: "toc_link_mismatch",
                                severity: "warning",
                                file: readme.relativePath,
                                linkText: link.text,
                                actualAnchor: matchingHeader.anchor,
                                expectedAnchor: link.target,
                                message: `目录链接 "${link.text}" 指向错误的锚点`,
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn(
                    `⚠️ 检查目录失败 ${readme.relativePath}: ${error.message}`,
                );
            }
        }
    }

    /**
     * 检查元数据一致性
     */
    async checkMetadataConsistency(docFiles) {
        console.log("  📊 检查元数据一致性...");

        for (const file of docFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");

                // 检查YAML前置元数据
                const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
                if (yamlMatch) {
                    const metadata = yamlMatch[1];
                    this.checkYAMLMetadata(metadata, file.relativePath);
                }

                // 检查标题一致性
                const titleMatch = content.match(/^#\s+(.+)$/m);
                if (titleMatch) {
                    const title = titleMatch[1].trim();

                    // 检查文件名与标题的一致性
                    const fileName = path
                        .basename(file.relativePath, ".md")
                        .toLowerCase();
                    const normalizedTitle = title
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "-");

                    if (
                        !fileName.includes(normalizedTitle) &&
                        normalizedTitle.length > 3
                    ) {
                        this.addIssue({
                            type: "title_filename_mismatch",
                            severity: "info",
                            file: file.relativePath,
                            title,
                            suggestedFileName: `${normalizedTitle}.md`,
                            message: `建议将文件名改为: ${normalizedTitle}.md`,
                        });
                    }
                }

                // 检查最后更新时间
                const dateMatch = content.match(
                    /(?:最后更新|updated|last modified):\s*(.+)/i,
                );
                if (dateMatch) {
                    const dateStr = dateMatch[1].trim();
                    if (!this.isValidDate(dateStr)) {
                        this.addIssue({
                            type: "invalid_date",
                            severity: "warning",
                            file: file.relativePath,
                            date: dateStr,
                            message: `无效的日期格式: ${dateStr}`,
                        });
                    }
                }
            } catch (error) {
                console.warn(
                    `⚠️ 检查元数据失败 ${file.relativePath}: ${error.message}`,
                );
            }
        }
    }

    /**
     * MCP增强检查
     */
    async performMCPEnhancedChecks(docFiles) {
        console.log("  🧠 执行MCP增强检查...");

        try {
            // Context7: 获取文档最佳实践
            const bestPractices = await this.getMCPDocBestPractices();

            // Memory: 检索历史文档问题模式
            const historicalPatterns = await this.getMCPHistoricalPatterns();

            // Sequential-thinking: 分析文档质量策略
            const qualityStrategy = await this.getMCPQualityStrategy(docFiles);

            // 应用MCP分析结果
            await this.applyMCPAnalysis(
                bestPractices,
                historicalPatterns,
                qualityStrategy,
                docFiles,
            );
        } catch (error) {
            console.warn("⚠️ MCP增强检查失败，使用基础检查:", error.message);
        }
    }

    /**
     * MCP工具集成方法
     */
    async getMCPDocBestPractices() {
        // 模拟Context7 MCP调用
        return {
            source: "context7",
            practices: [
                {
                    category: "structure",
                    rule: "每个文档应该有清晰的标题结构",
                    check: "检查H1-H6标题层级",
                },
                {
                    category: "links",
                    rule: "所有内部链接应该有效",
                    check: "验证本地文件链接",
                },
                {
                    category: "code",
                    rule: "代码块应该有语法高亮且可执行",
                    check: "验证代码语法和引用",
                },
                {
                    category: "api",
                    rule: "API文档应该包含完整的示例",
                    check: "检查API示例完整性",
                },
            ],
        };
    }

    async getMCPHistoricalPatterns() {
        // 模拟Memory MCP调用
        return {
            source: "memory",
            patterns: [
                {
                    type: "common_issues",
                    issues: [
                        "README.md经常缺少更新日期",
                        "API文档中的curl示例经常过时",
                        "代码示例缺少错误处理",
                        "目录链接经常损坏",
                    ],
                    frequency: {
                        missing_date: 0.8,
                        outdated_curl: 0.6,
                        missing_error_handling: 0.7,
                        broken_toc_links: 0.5,
                    },
                },
            ],
        };
    }

    async getMCPQualityStrategy(docFiles) {
        // 模拟Sequential-thinking MCP调用
        return {
            source: "sequential-thinking",
            strategy: [
                {
                    step: 1,
                    focus: "优先检查核心文档",
                    reasoning: "README和API文档是用户最常查看的文档",
                    files: docFiles.filter(
                        (f) =>
                            f.relativePath.includes("README") ||
                            f.relativePath.includes("API"),
                    ),
                },
                {
                    step: 2,
                    focus: "检查文档间的交叉引用",
                    reasoning: "确保文档间的链接一致性",
                    action: "验证所有内部链接",
                },
                {
                    step: 3,
                    focus: "验证代码示例的准确性",
                    reasoning: "代码示例应该能实际运行",
                    action: "检查代码语法和文件引用",
                },
            ],
        };
    }

    /**
     * 应用MCP分析结果
     */
    async applyMCPAnalysis(
        bestPractices,
        historicalPatterns,
        qualityStrategy,
        docFiles,
    ) {
        // 应用最佳实践检查
        if (bestPractices.practices) {
            for (const practice of bestPractices.practices) {
                await this.applyBestPractice(practice, docFiles);
            }
        }

        // 应用历史模式检查
        if (historicalPatterns.patterns) {
            for (const pattern of historicalPatterns.patterns) {
                await this.applyHistoricalPattern(pattern, docFiles);
            }
        }

        // 应用质量策略
        if (qualityStrategy.strategy) {
            for (const step of qualityStrategy.strategy) {
                await this.applyQualityStrategyStep(step, docFiles);
            }
        }
    }

    /**
     * 生成报告
     */
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.stats.filesChecked,
                totalIssues: this.issues.length,
                errors: this.issues.filter((i) => i.severity === "error")
                    .length,
                warnings: this.issues.filter((i) => i.severity === "warning")
                    .length,
                info: this.issues.filter((i) => i.severity === "info").length,
                linksChecked: this.stats.linksChecked,
                apiDocsChecked: this.stats.apiDocsChecked,
                codeBlocksChecked: this.stats.codeBlocksChecked,
            },
            issuesByType: this.groupIssuesByType(),
            issuesByFile: this.groupIssuesByFile(),
            recommendations: await this.generateRecommendations(),
        };

        // 保存报告
        const reportPath = path.join(
            __dirname,
            "../../.cache/doc-consistency-report.json",
        );
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    /**
     * 生成改进建议
     */
    async generateRecommendations() {
        const recommendations = [];

        // 基于问题类型生成建议
        const issueTypes = [...new Set(this.issues.map((i) => i.type))];

        for (const type of issueTypes) {
            const issues = this.issues.filter((i) => i.type === type);

            switch (type) {
                case "broken_link":
                    recommendations.push({
                        priority: "high",
                        category: "链接维护",
                        description: `修复 ${issues.length} 个损坏的链接`,
                        action: "运行 `pnpm run check:links` 修复链接",
                        affectedFiles: [...new Set(issues.map((i) => i.file))],
                    });
                    break;

                case "duplicate_file":
                    recommendations.push({
                        priority: "medium",
                        category: "文件整理",
                        description: `处理 ${issues.length} 个重复文件`,
                        action: "合并或删除重复文件",
                        affectedFiles: [
                            ...new Set(
                                issues.flatMap((i) => [
                                    i.file,
                                    i.duplicateFile,
                                ]),
                            ),
                        ],
                    });
                    break;

                case "toc_mismatch":
                    recommendations.push({
                        priority: "medium",
                        category: "目录更新",
                        description: `更新 ${issues.length} 个目录项`,
                        action: "同步目录与实际标题",
                        affectedFiles: [...new Set(issues.map((i) => i.file))],
                    });
                    break;

                case "title_filename_mismatch":
                    recommendations.push({
                        priority: "low",
                        category: "文件命名",
                        description: `标准化 ${issues.length} 个文件名`,
                        action: "按照标题重命名文件",
                        affectedFiles: [...new Set(issues.map((i) => i.file))],
                    });
                    break;
            }
        }

        // 排序建议
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * 辅助方法
     */
    addIssue(issue) {
        this.issues.push({
            id: this.generateIssueId(),
            timestamp: new Date().toISOString(),
            ...issue,
        });

        if (issue.severity === "error") {
            this.stats.issuesFound++;
        } else if (issue.severity === "warning") {
            this.stats.warningsFound++;
        }
    }

    generateIssueId() {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    shouldSkipDirectory(dirName) {
        const skipDirs = [
            ".git",
            "node_modules",
            ".next",
            "dist",
            "build",
            ".cache",
            "coverage",
        ];
        return skipDirs.includes(dirName) || dirName.startsWith(".");
    }

    getExpectedFilePath(pattern, _currentPath) {
        const patterns = {
            "README.md": "README.md",
            "CONTRIBUTING.md": "CONTRIBUTING.md",
            "CHANGELOG.md": "CHANGELOG.md",
            "API.md": "docs/API.md",
        };
        return patterns[pattern];
    }

    resolveLinkPath(basePath, link) {
        const baseDir = path.dirname(basePath);
        const resolved = path.resolve(baseDir, link);
        return path.relative(".", resolved);
    }

    extractHeaders(content) {
        const headerRegex = /^(#{1,6})\s+(.+)$/gm;
        const headers = [];
        let match = headerRegex.exec(content);

        while (match !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const anchor = text
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");

            headers.push({ level, text, anchor });

            match = headerRegex.exec(content);
        }

        return headers;
    }

    extractTOCLinks(content) {
        const linkRegex = /^\s*[-*+]\s*\[([^\]]+)\]\(([^)]+)\)/gm;
        const links = [];
        let match = linkRegex.exec(content);

        while (match !== null) {
            links.push({
                text: match[1].trim(),
                target: match[2].trim(),
            });

            match = linkRegex.exec(content);
        }

        return links;
    }

    normalizeHeader(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .trim();
    }

    isProjectFile(language) {
        const projectLanguages = [
            "javascript",
            "typescript",
            "jsx",
            "tsx",
            "css",
            "scss",
            "json",
            "yaml",
            "yml",
        ];
        return projectLanguages.includes(language);
    }

    async checkCodeSyntax(code, language, filePath) {
        // 简化的语法检查
        const brackets = { "(": ")", "[": "]", "{": "}" };
        const stack = [];

        for (const char of code) {
            if (brackets[char]) {
                stack.push(brackets[char]);
            } else if (Object.values(brackets).includes(char)) {
                if (stack.length === 0 || stack.pop() !== char) {
                    this.addIssue({
                        type: "syntax_error",
                        severity: "warning",
                        file: filePath,
                        language,
                        message: `代码块中存在语法错误: 不匹配的括号`,
                    });
                    break;
                }
            }
        }

        if (stack.length > 0) {
            this.addIssue({
                type: "syntax_error",
                severity: "warning",
                file: filePath,
                language,
                message: `代码块中存在语法错误: 未闭合的括号`,
            });
        }
    }

    async checkCodeFileConsistency(code, _language, filePath) {
        // 检查代码是否引用了实际存在的文件
        const importRegex = /import.*from\s+['"`]([^'"`]+)['"`]/g;
        let match = importRegex.exec(code);

        while (match !== null) {
            const importPath = match[1];
            if (!importPath.startsWith(".")) continue; // 跳过外部依赖

            try {
                const fullPath = path.resolve(
                    path.dirname(filePath),
                    importPath,
                );
                await fs.access(fullPath);
            } catch {
                this.addIssue({
                    type: "missing_import",
                    severity: "warning",
                    file: filePath,
                    importPath,
                    message: `代码块引用的文件不存在: ${importPath}`,
                });
            }

            match = importRegex.exec(code);
        }
    }

    checkHTTPMethodConsistency(code, filePath) {
        const methods = [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "HEAD",
            "OPTIONS",
        ];
        const foundMethods = [];

        for (const method of methods) {
            if (code.includes(method)) {
                foundMethods.push(method);
            }
        }

        if (foundMethods.length > 0) {
            // 检查HTTP方法格式的一致性
            const inconsistent = foundMethods.some((method) => {
                const variations = [method, method.toLowerCase()];
                return variations.some(
                    (variation) =>
                        code.includes(variation) && !code.includes(method),
                );
            });

            if (inconsistent) {
                this.addIssue({
                    type: "http_method_inconsistency",
                    severity: "info",
                    file: filePath,
                    foundMethods,
                    message: "HTTP方法格式不一致，建议统一使用大写",
                });
            }
        }
    }

    checkJSONFormatConsistency(code, filePath) {
        const jsonMatches = code.match(/\{[\s\S]*\}/g);
        if (!jsonMatches) return;

        for (const jsonStr of jsonMatches) {
            try {
                JSON.parse(jsonStr);
            } catch {
                this.addIssue({
                    type: "invalid_json",
                    severity: "warning",
                    file: filePath,
                    jsonSnippet: `${jsonStr.substring(0, 100)}...`,
                    message: "代码块中包含无效的JSON格式",
                });
            }
        }
    }

    checkAPIEndpointConsistency(content, filePath) {
        // 检查API端点格式的一致性
        const endpointRegex = /\/api\/[a-zA-Z0-9/{}-]+/g;
        const endpoints = [...new Set(content.match(endpointRegex) || [])];

        for (const endpoint of endpoints) {
            // 检查端点命名规范
            if (
                endpoint.includes("//") ||
                endpoint.endsWith("/") ||
                endpoint.includes(" ")
            ) {
                this.addIssue({
                    type: "api_endpoint_format",
                    severity: "warning",
                    file: filePath,
                    endpoint,
                    message: `API端点格式不规范: ${endpoint}`,
                });
            }
        }
    }

    checkYAMLMetadata(metadata, filePath) {
        // 简单的YAML格式检查
        const lines = metadata.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(":") && !line.includes("---")) {
                const [key, ...valueParts] = line.split(":");
                const value = valueParts.join(":").trim();

                if (key && !value) {
                    this.addIssue({
                        type: "yaml_metadata",
                        severity: "info",
                        file: filePath,
                        line: i + 1,
                        key: key.trim(),
                        message: `YAML元数据项 "${key.trim()}" 缺少值`,
                    });
                }
            }
        }
    }

    isValidDate(dateStr) {
        const date = new Date(dateStr);
        return !Number.isNaN(date.getTime());
    }

    groupIssuesByType() {
        const grouped = {};
        for (const issue of this.issues) {
            if (!grouped[issue.type]) {
                grouped[issue.type] = [];
            }
            grouped[issue.type].push(issue);
        }
        return grouped;
    }

    groupIssuesByFile() {
        const grouped = {};
        for (const issue of this.issues) {
            if (!grouped[issue.file]) {
                grouped[issue.file] = [];
            }
            grouped[issue.file].push(issue);
        }
        return grouped;
    }

    async applyBestPractice(practice, docFiles) {
        // 应用最佳实践检查
        switch (practice.category) {
            case "structure":
                await this.checkDocumentStructure(docFiles);
                break;
            case "links":
                // 已经在checkLinkConsistency中处理
                break;
            case "code":
                await this.checkCodeExamples(docFiles);
                break;
            case "api":
                await this.checkAPIDocumentationCompleteness(docFiles);
                break;
        }
    }

    async applyHistoricalPattern(pattern, docFiles) {
        // 应用历史模式检查
        if (pattern.type === "common_issues" && pattern.issues) {
            for (const issue of pattern.issues) {
                if (issue.includes("README.md经常缺少更新日期")) {
                    await this.checkReadmeDates(docFiles);
                }
                // 可以添加更多模式检查
            }
        }
    }

    async applyQualityStrategyStep(step, _docFiles) {
        // 应用质量策略步骤
        if (step.focus === "优先检查核心文档") {
            await this.checkCoreDocuments(step.files);
        } else if (step.focus === "检查文档间的交叉引用") {
            // 已经在checkLinkConsistency中处理
        } else if (step.focus === "验证代码示例的准确性") {
            // 已经在checkCodeBlockConsistency中处理
        }
    }

    async checkDocumentStructure(docFiles) {
        for (const file of docFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");
                const headers = this.extractHeaders(content);

                if (headers.length === 0) {
                    this.addIssue({
                        type: "missing_structure",
                        severity: "warning",
                        file: file.relativePath,
                        message: "文档缺少标题结构",
                    });
                } else if (headers[0].level !== 1) {
                    this.addIssue({
                        type: "missing_h1",
                        severity: "info",
                        file: file.relativePath,
                        message: "文档应该以H1标题开始",
                    });
                }
            } catch (_error) {
                // 忽略读取错误
            }
        }
    }

    async checkCodeExamples(docFiles) {
        // 检查代码示例的完整性
        const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;

        for (const file of docFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");
                const matches = [...content.matchAll(codeBlockRegex)];

                for (const match of matches) {
                    const code = match[2].trim();
                    if (code.length === 0) {
                        this.addIssue({
                            type: "empty_code_block",
                            severity: "info",
                            file: file.relativePath,
                            language: match[1],
                            message: "发现空的代码块",
                        });
                    }
                }
            } catch (_error) {
                // 忽略读取错误
            }
        }
    }

    async checkAPIDocumentationCompleteness(docFiles) {
        const apiDocFiles = docFiles.filter(
            (f) =>
                f.relativePath.includes("api") ||
                f.relativePath.includes("API"),
        );

        for (const file of apiDocFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");

                // 检查是否有示例代码
                const hasExamples = /```(bash|curl|javascript|typescript)/.test(
                    content,
                );
                if (!hasExamples) {
                    this.addIssue({
                        type: "missing_api_examples",
                        severity: "warning",
                        file: file.relativePath,
                        message: "API文档缺少示例代码",
                    });
                }

                // 检查是否有错误处理示例
                const hasErrorHandling =
                    /error|catch|throw|status.*[4-5]\d\d/.test(content);
                if (!hasErrorHandling) {
                    this.addIssue({
                        type: "missing_error_handling",
                        severity: "info",
                        file: file.relativePath,
                        message: "API文档缺少错误处理示例",
                    });
                }
            } catch (_error) {
                // 忽略读取错误
            }
        }
    }

    async checkReadmeDates(docFiles) {
        const readmeFiles = docFiles.filter(
            (f) => path.basename(f.relativePath).toLowerCase() === "readme.md",
        );

        for (const file of readmeFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");
                const hasDate = /(?:最后更新|updated|last modified):/.test(
                    content,
                );

                if (!hasDate) {
                    this.addIssue({
                        type: "missing_readme_date",
                        severity: "info",
                        file: file.relativePath,
                        message: "README.md缺少最后更新日期",
                    });
                }
            } catch (_error) {
                // 忽略读取错误
            }
        }
    }

    async checkCoreDocuments(coreDocFiles) {
        // 重点检查核心文档的质量
        for (const file of coreDocFiles) {
            try {
                const content = await fs.readFile(file.path, "utf8");

                // 检查文档长度
                if (content.length < 500) {
                    this.addIssue({
                        type: "short_core_document",
                        severity: "warning",
                        file: file.relativePath,
                        length: content.length,
                        message: "核心文档内容过短，可能缺少重要信息",
                    });
                }

                // 检查是否有结构化的内容
                const hasStructure =
                    /^#+\s+/m.test(content) && /\n\n/.test(content);
                if (!hasStructure) {
                    this.addIssue({
                        type: "unstructured_content",
                        severity: "info",
                        file: file.relativePath,
                        message: "文档缺乏结构化内容",
                    });
                }
            } catch (_error) {
                // 忽略读取错误
            }
        }
    }
}

/**
 * 主程序入口
 */
async function main() {
    const args = process.argv.slice(2);
    const _command = args[0] || "check";

    console.log("📚 文档一致性检查器启动");

    const checker = new DocConsistencyChecker({
        enableMCP: process.env.ENABLE_MCP === "1",
        strictMode: process.env.DOC_STRICT_MODE === "1",
    });

    try {
        const result = await checker.checkAll();

        // 显示结果摘要
        console.log(`\n${"=".repeat(60)}`);
        console.log("📋 文档一致性检查报告");
        console.log("=".repeat(60));

        console.log(`\n📊 检查概况:`);
        console.log(`  检查文件: ${result.stats.filesChecked}`);
        console.log(
            `  发现问题: ${result.stats.issuesFound + result.stats.warningsFound}`,
        );
        console.log(`  链接检查: ${result.stats.linksChecked}`);
        console.log(`  API文档: ${result.stats.apiDocsChecked}`);
        console.log(`  代码块: ${result.stats.codeBlocksChecked}`);

        if (result.issues.length > 0) {
            console.log(`\n❌ 发现的问题:`);
            const errors = result.issues.filter((i) => i.severity === "error");
            const warnings = result.issues.filter(
                (i) => i.severity === "warning",
            );

            if (errors.length > 0) {
                console.log(`  错误 (${errors.length}):`);
                errors.slice(0, 5).forEach((issue) => {
                    console.log(`    - ${issue.file}: ${issue.message}`);
                });
                if (errors.length > 5) {
                    console.log(`    ... 还有 ${errors.length - 5} 个错误`);
                }
            }

            if (warnings.length > 0) {
                console.log(`  警告 (${warnings.length}):`);
                warnings.slice(0, 5).forEach((issue) => {
                    console.log(`    - ${issue.file}: ${issue.message}`);
                });
                if (warnings.length > 5) {
                    console.log(`    ... 还有 ${warnings.length - 5} 个警告`);
                }
            }
        }

        if (result.recommendations && result.recommendations.length > 0) {
            console.log(`\n💡 改进建议:`);
            result.recommendations.slice(0, 3).forEach((rec) => {
                console.log(`  ${rec.description}`);
                console.log(`    建议: ${rec.action}`);
            });
            if (result.recommendations.length > 3) {
                console.log(
                    `  ... 还有 ${result.recommendations.length - 3} 个建议`,
                );
            }
        }

        console.log(`\n${"=".repeat(60)}`);

        if (result.success) {
            console.log("✅ 文档一致性检查通过");
            process.exit(0);
        } else {
            console.log("❌ 文档一致性检查失败");
            process.exit(1);
        }
    } catch (error) {
        console.error("💥 文档检查过程中发生错误:", error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default DocConsistencyChecker;
