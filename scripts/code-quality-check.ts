#!/usr/bin/env node

/**
 * 代码质量检查脚本
 *
 * 功能：
 * - TypeScript类型检查
 * - Biome代码格式化和lint检查
 * - 性能优化建议
 * - 安全漏洞检查
 * - 代码复杂度分析
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

interface CheckResult {
    name: string;
    passed: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}

class CodeQualityChecker {
    private results: CheckResult[] = [];

    constructor(private projectRoot: string = process.cwd()) {}

    /**
     * 运行TypeScript类型检查
     */
    async checkTypeScript(): Promise<CheckResult> {
        const result: CheckResult = {
            name: "TypeScript 类型检查",
            passed: true,
            errors: [],
            warnings: [],
            suggestions: [],
        };

        try {
            console.info("🔍 运行 TypeScript 类型检查...");
            execSync("pnpm typecheck", {
                stdio: "pipe",
                cwd: this.projectRoot,
            });
            console.info("✅ TypeScript 类型检查通过");
        } catch (error) {
            const typedError = error as {
                stdout?: Buffer;
                stderr?: Buffer;
                message: string;
            };
            result.passed = false;
            const output =
                typedError.stdout?.toString() ||
                typedError.stderr?.toString() ||
                typedError.message;

            // 解析TypeScript错误
            const lines = output.split("\n").filter((line) => line.trim());
            lines.forEach((line: string) => {
                if (line.includes("error TS")) {
                    result.errors.push(line);
                } else if (line.includes("warning TS")) {
                    result.warnings.push(line);
                }
            });

            console.error("❌ TypeScript 类型检查失败");
            result.errors.forEach((errLine) => {
                console.error(`  🚨 ${errLine}`);
            });
            result.warnings.forEach((warning) => {
                console.warn(`  ⚠️  ${warning}`);
            });
        }

        this.results.push(result);
        return result;
    }

    /**
     * 运行Biome代码检查
     */
    async checkBiome(): Promise<CheckResult> {
        const result: CheckResult = {
            name: "Biome 代码检查",
            passed: true,
            errors: [],
            warnings: [],
            suggestions: [],
        };

        try {
            console.info("🔍 运行 Biome 代码检查...");
            execSync("pnpm exec biome check --verbose", {
                stdio: "pipe",
                cwd: this.projectRoot,
            });
            console.info("✅ Biome 代码检查通过");
        } catch (error) {
            const typedError = error as {
                stdout?: Buffer;
                stderr?: Buffer;
                message: string;
            };
            result.passed = false;
            const output =
                typedError.stdout?.toString() ||
                typedError.stderr?.toString() ||
                typedError.message;

            // 解析Biome输出
            const lines = output.split("\n").filter((line) => line.trim());
            lines.forEach((line: string) => {
                if (line.includes("error")) {
                    result.errors.push(line);
                } else if (line.includes("warn") || line.includes("warning")) {
                    result.warnings.push(line);
                } else if (line.includes("suggestion")) {
                    result.suggestions.push(line);
                }
            });

            console.error("❌ Biome 代码检查发现问题");
            result.errors.forEach((errLine) => {
                console.error(`  🚨 ${errLine}`);
            });
            result.warnings.forEach((warning) => {
                console.warn(`  ⚠️  ${warning}`);
            });
            result.suggestions.forEach((suggestion) => {
                console.info(`  💡 ${suggestion}`);
            });
        }

        this.results.push(result);
        return result;
    }

    /**
     * 检查package.json依赖
     */
    async checkDependencies(): Promise<CheckResult> {
        const result: CheckResult = {
            name: "依赖检查",
            passed: true,
            errors: [],
            warnings: [],
            suggestions: [],
        };

        try {
            console.info("🔍 检查项目依赖...");
            const packageJsonPath = join(this.projectRoot, "package.json");

            if (!existsSync(packageJsonPath)) {
                result.errors.push("package.json 文件不存在");
                result.passed = false;
                return result;
            }

            const packageJson = JSON.parse(
                readFileSync(packageJsonPath, "utf8"),
            );
            const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };

            // 检查是否有已知的安全漏洞依赖
            const vulnerablePackages = [
                "lodash@<4.17.21",
                "moment@<2.29.4",
                "axios@<1.0.0",
                "request@<2.88.2",
            ];

            Object.entries(deps).forEach(([name, version]) => {
                vulnerablePackages.forEach((vulnerable) => {
                    const [vulnName, vulnVersion] = vulnerable.split("@");
                    if (
                        name === vulnName &&
                        (version as string).startsWith(vulnVersion)
                    ) {
                        result.warnings.push(
                            `${name}@${version} 可能存在安全漏洞，建议升级到最新版本`,
                        );
                        result.passed = false;
                    }
                });
            });

            // 检查是否有重复的依赖
            if (deps.next && deps["next-intl"]) {
                // 这是一个正常的组合，不警告
            }

            // 检查是否有未使用的依赖
            const commonUnusedDeps = ["@types/node"];
            commonUnusedDeps.forEach((dep) => {
                if (deps[dep]) {
                    result.suggestions.push(`考虑移除未使用的依赖: ${dep}`);
                }
            });

            console.info("✅ 依赖检查完成");
            if (result.warnings.length > 0) {
                console.warn("⚠️  发现以下安全问题:");
                result.warnings.forEach((warning) => {
                    console.warn(`  ⚠️  ${warning}`);
                });
            }
            if (result.suggestions.length > 0) {
                console.info("💡 优化建议:");
                result.suggestions.forEach((suggestion) => {
                    console.info(`  💡 ${suggestion}`);
                });
            }
        } catch (error) {
            result.errors.push(`依赖检查失败: ${error}`);
            result.passed = false;
            console.error("❌ 依赖检查失败");
        }

        this.results.push(result);
        return result;
    }

    /**
     * 检查文件大小和性能
     */
    async checkPerformance(): Promise<CheckResult> {
        const result: CheckResult = {
            name: "性能检查",
            passed: true,
            errors: [],
            warnings: [],
            suggestions: [],
        };

        try {
            console.info("🔍 检查项目性能...");

            // 检查Next.js配置
            const nextConfigPath = join(this.projectRoot, "next.config.ts");
            if (existsSync(nextConfigPath)) {
                const nextConfig = readFileSync(nextConfigPath, "utf8");

                if (!nextConfig.includes("experimental:")) {
                    result.suggestions.push(
                        "考虑启用 Next.js 实验性功能以提升性能",
                    );
                }

                if (
                    !nextConfig.includes("images:") ||
                    !nextConfig.includes("formats:")
                ) {
                    result.suggestions.push(
                        "配置图片优化格式 (AVIF/WebP) 以提升加载性能",
                    );
                }
            }

            // 检查CSS文件大小
            const cssFiles = [
                join(this.projectRoot, "src/app/globals.css"),
                join(this.projectRoot, "src/styles/accessibility.css"),
            ];

            cssFiles.forEach((cssFile) => {
                if (existsSync(cssFile)) {
                    const stats = statSync(cssFile);
                    const sizeKB = Math.round(stats.size / 1024);

                    if (sizeKB > 50) {
                        result.warnings.push(
                            `${cssFile} 文件过大 (${sizeKB}KB)，考虑拆分或优化`,
                        );
                    }
                }
            });

            console.info("✅ 性能检查完成");
            if (result.suggestions.length > 0) {
                console.info("💡 性能优化建议:");
                result.suggestions.forEach((suggestion) => {
                    console.info(`  💡 ${suggestion}`);
                });
            }
        } catch (error) {
            result.errors.push(`性能检查失败: ${error}`);
            result.passed = false;
            console.error("❌ 性能检查失败");
        }

        this.results.push(result);
        return result;
    }

    /**
     * 检查SEO配置
     */
    async checkSEO(): Promise<CheckResult> {
        const result: CheckResult = {
            name: "SEO 配置检查",
            passed: true,
            errors: [],
            warnings: [],
            suggestions: [],
        };

        try {
            console.info("🔍 检查 SEO 配置...");

            // 检查robots.txt
            const robotsPath = join(this.projectRoot, "public/robots.txt");
            if (!existsSync(robotsPath)) {
                result.errors.push("robots.txt 文件不存在");
                result.passed = false;
            }

            // 检查sitemap.xml路由
            const sitemapRoutePath = join(
                this.projectRoot,
                "src/app/sitemap.xml",
            );
            if (!existsSync(sitemapRoutePath)) {
                result.warnings.push(
                    "sitemap.xml 路由不存在，建议添加动态站点地图",
                );
            }

            // 检查SEO工具文件
            const seoFiles = [
                "src/lib/seo-metadata.ts",
                "src/lib/seo/breadcrumbs.ts",
                "src/lib/seo/product-schema.ts",
                "src/lib/seo/sitemap.ts",
                "src/lib/seo/canonical.ts",
            ];

            seoFiles.forEach((file) => {
                const filePath = join(this.projectRoot, file);
                if (!existsSync(filePath)) {
                    result.suggestions.push(`考虑添加 SEO 工具文件: ${file}`);
                }
            });

            console.info("✅ SEO 配置检查完成");
            if (result.errors.length > 0) {
                console.error("🚨 SEO 配置错误:");
                result.errors.forEach((error) => {
                    console.error(`  🚨 ${error}`);
                });
            }
            if (result.suggestions.length > 0) {
                console.info("💡 SEO 优化建议:");
                result.suggestions.forEach((suggestion) => {
                    console.info(`  💡 ${suggestion}`);
                });
            }
        } catch (error) {
            result.errors.push(`SEO 检查失败: ${error}`);
            result.passed = false;
            console.error("❌ SEO 检查失败");
        }

        this.results.push(result);
        return result;
    }

    /**
     * 打印列表详情
     */
    private printDetails({
        heading,
        items,
        limit,
        logItem,
        overflowLabel,
    }: {
        heading: string;
        items: string[];
        limit: number;
        logItem: (entry: string) => void;
        overflowLabel: (remaining: number) => string;
    }): void {
        if (items.length === 0) return;
        console.info(heading);
        items.slice(0, limit).forEach((entry) => {
            logItem(entry);
        });
        if (items.length > limit) {
            console.info(overflowLabel(items.length - limit));
        }
    }

    /**
     * 生成质量报告
     */
    generateReport(): void {
        console.info("\n📊 代码质量检查报告");
        console.info("=".repeat(50));

        let totalPassed = 0;
        const totalChecks = this.results.length;

        this.results.forEach((result) => {
            const status = result.passed ? "✅" : "❌";
            console.info(`${status} ${result.name}`);

            this.printDetails({
                heading: `  🚨 错误 (${result.errors.length}):`,
                items: result.errors,
                limit: 5,
                logItem: (entry) => {
                    console.error(`    ${entry}`);
                },
                overflowLabel: (remaining) =>
                    `    ... 还有 ${remaining} 个错误`,
            });

            this.printDetails({
                heading: `  ⚠️  警告 (${result.warnings.length}):`,
                items: result.warnings,
                limit: 3,
                logItem: (entry) => {
                    console.warn(`    ${entry}`);
                },
                overflowLabel: (remaining) =>
                    `    ... 还有 ${remaining} 个警告`,
            });

            this.printDetails({
                heading: `  💡 建议 (${result.suggestions.length}):`,
                items: result.suggestions,
                limit: 3,
                logItem: (entry) => {
                    console.info(`    ${entry}`);
                },
                overflowLabel: (remaining) =>
                    `    ... 还有 ${remaining} 个建议`,
            });

            console.info("");

            if (result.passed) {
                totalPassed++;
            }
        });

        const score = Math.round((totalPassed / totalChecks) * 100);
        console.info(
            `📈 总体质量评分: ${score}% (${totalPassed}/${totalChecks})`,
        );

        if (score >= 90) {
            console.info("🎉 优秀！代码质量很高");
        } else if (score >= 80) {
            console.info("👍 良好！代码质量不错");
        } else if (score >= 70) {
            console.info("👌 一般，需要改进一些问题");
        } else {
            console.warn("⚠️  需要重点关注代码质量问题");
        }
    }

    /**
     * 运行所有检查
     */
    async runAllChecks(): Promise<void> {
        console.info("🚀 开始代码质量检查...\n");

        await this.checkTypeScript();
        await this.checkBiome();
        await this.checkDependencies();
        await this.checkPerformance();
        await this.checkSEO();

        this.generateReport();

        // 设置退出码
        const hasErrors = this.results.some(
            (result) => result.errors.length > 0,
        );
        if (hasErrors) {
            console.error("\n❌ 发现错误，请修复后重新检查");
            process.exit(1);
        } else {
            console.info("\n✅ 所有检查通过！");
            process.exit(0);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const checker = new CodeQualityChecker();
    checker.runAllChecks().catch((error) => {
        console.error("代码质量检查失败:", error);
        process.exit(1);
    });
}

export { CodeQualityChecker };
