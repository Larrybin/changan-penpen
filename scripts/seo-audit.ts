#!/usr/bin/env node

/**
 * SEO审计脚本
 *
 * 检查项目是否满足SEO最佳实践要求
 * 包括HTML语义化、结构化数据、响应式设计等
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface AuditResult {
    name: string;
    status: "pass" | "fail" | "warning";
    description: string;
    recommendations?: string[];
}

class SEOAuditor {
    private results: AuditResult[] = [];
    private projectRoot: string;

    constructor(projectRoot: string = process.cwd()) {
        this.projectRoot = projectRoot;
    }

    /**
     * 检查HTML语义化标签使用
     */
    checkSemanticHTML(): AuditResult {
        const result: AuditResult = {
            name: "HTML语义化标签检查",
            status: "pass",
            description: "检查HTML5语义化标签的使用情况",
            recommendations: [],
        };

        try {
            const landingPagePath = join(
                this.projectRoot,
                "src/modules/marketing/landing.page.tsx",
            );
            const headerPath = join(
                this.projectRoot,
                "src/modules/marketing/components/public-header.tsx",
            );
            const footerPath = join(
                this.projectRoot,
                "src/modules/marketing/components/public-footer.tsx",
            );

            if (!existsSync(landingPagePath)) {
                result.status = "fail";
                result.description = "找不到landing页面文件";
                return result;
            }

            // 检查语义化标签使用
            const landingPage = readFileSync(landingPagePath, "utf8");
            const headerContent = existsSync(headerPath)
                ? readFileSync(headerPath, "utf8")
                : "";
            const footerContent = existsSync(footerPath)
                ? readFileSync(footerPath, "utf8")
                : "";

            const semanticTags = [
                "<main",
                "<header",
                "<nav",
                "<section",
                "<article",
                "<aside",
                "<footer",
            ];

            let semanticCount = 0;
            const missingTags: string[] = [];

            // 检查landing页面
            semanticTags.forEach((tag) => {
                const count = (landingPage.match(new RegExp(tag, "g")) || [])
                    .length;
                semanticCount += count;
                if (count === 0 && tag !== "<article" && tag !== "<aside") {
                    // article和aside可能不需要
                    missingTags.push(tag);
                }
            });

            // 检查header和footer文件
            const hasHeaderTag = headerContent.includes("<header");
            const hasFooterTag = footerContent.includes("<footer");

            if (hasHeaderTag && hasFooterTag) {
                semanticCount += 2;
            }

            if (semanticCount >= 4) {
                result.status = "pass";
                result.description = `发现${semanticCount}个语义化标签使用`;
            } else {
                result.status = "warning";
                result.description = `语义化标签使用较少 (${semanticCount}个)`;
                result.recommendations = [
                    "增加<main>标签包裹主要内容",
                    "增加<header>标签包裹页头",
                    "增加<nav>标签包裹导航",
                    "增加<section>标签分割内容区块",
                    "考虑使用<article>和<aside>标签",
                ];
            }

            // 检查是否有适当的ARIA标签
            const hasAriaLabels =
                landingPage.includes("aria-") ||
                landingPage.includes("role=") ||
                headerContent.includes("aria-") ||
                headerContent.includes("role=");

            if (!hasAriaLabels) {
                result.recommendations?.push("添加适当的ARIA标签提升可访问性");
            }
        } catch (error) {
            result.status = "fail";
            result.description = `检查失败: ${error}`;
        }

        this.results.push(result);
        return result;
    }

    /**
     * 检查结构化数据
     */
    checkStructuredData(): AuditResult {
        const result: AuditResult = {
            name: "结构化数据检查",
            status: "pass",
            description: "检查JSON-LD结构化数据的实现",
            recommendations: [],
        };

        try {
            const landingPagePath = join(
                this.projectRoot,
                "src/modules/marketing/landing.page.tsx",
            );

            if (!existsSync(landingPagePath)) {
                result.status = "fail";
                result.description = "找不到landing页面文件";
                return result;
            }

            const landingPage = readFileSync(landingPagePath, "utf8");

            // 检查JSON-LD实现
            const hasJsonLd =
                landingPage.includes("application/ld+json") ||
                landingPage.includes("JSON.stringify(structuredDataPayload)");

            // 检查schema.org结构
            const hasSchemaOrg =
                landingPage.includes('@context": "https://schema.org"') ||
                landingPage.includes('@type":');

            // 检查主要schema类型
            const schemaTypes = [
                "SoftwareApplication",
                "Organization",
                "WebSite",
                "FAQPage",
            ];

            let schemaCount = 0;
            schemaTypes.forEach((type) => {
                if (landingPage.includes(`"@type": "${type}"`)) {
                    schemaCount++;
                }
            });

            if (hasJsonLd && hasSchemaOrg && schemaCount >= 3) {
                result.status = "pass";
                result.description = `完整的结构化数据实现 (${schemaCount}种schema类型)`;
            } else if (hasJsonLd && hasSchemaOrg) {
                result.status = "warning";
                result.description = `基础结构化数据实现 (${schemaCount}种schema类型)`;
                result.recommendations = [
                    "考虑添加更多schema类型",
                    "添加产品/服务相关信息",
                    "添加评价和评分信息",
                ];
            } else {
                result.status = "fail";
                result.description = "缺少结构化数据实现";
                result.recommendations = [
                    "添加JSON-LD格式的结构化数据",
                    "实现SoftwareApplication schema",
                    "添加Organization和WebSite schema",
                    "考虑添加FAQPage schema",
                ];
            }
        } catch (error) {
            result.status = "fail";
            result.description = `检查失败: ${error}`;
        }

        this.results.push(result);
        return result;
    }

    /**
     * 检查响应式设计
     */
    checkResponsiveDesign(): AuditResult {
        const result: AuditResult = {
            name: "响应式设计检查",
            status: "pass",
            description: "检查移动端适配和响应式实现",
            recommendations: [],
        };

        try {
            const globalsCssPath = join(
                this.projectRoot,
                "src/app/globals.css",
            );

            if (!existsSync(globalsCssPath)) {
                result.status = "warning";
                result.description = "找不到全局CSS文件";
                result.recommendations = [
                    "确保存在全局CSS文件并包含响应式样式",
                ];
                return result;
            }

            const cssContent = readFileSync(globalsCssPath, "utf8");
            const hasViewport = this.hasViewportMeta();
            const responsiveSignals = this.extractResponsiveSignals(cssContent);
            const responsiveScore = this.calculateResponsiveScore([
                hasViewport,
                responsiveSignals.hasMediaQueries,
                responsiveSignals.hasMobileOptimizations,
                responsiveSignals.hasFluidTypography,
            ]);

            this.applyResponsiveStatus(responsiveScore, result);

            if (!responsiveSignals.hasModernLayout) {
                result.recommendations?.push(
                    "考虑使用现代CSS布局技术(Grid/Flexbox)",
                );
            }
        } catch (error) {
            result.status = "fail";
            result.description = `检查失败: ${error}`;
        }

        this.results.push(result);
        return result;
    }

    private hasViewportMeta(): boolean {
        const layoutPath = join(this.projectRoot, "src/app/layout.tsx");
        if (!existsSync(layoutPath)) {
            return false;
        }

        const layoutContent = readFileSync(layoutPath, "utf8");
        return (
            layoutContent.includes("viewport") ||
            layoutContent.includes("width=device-width")
        );
    }

    private extractResponsiveSignals(cssContent: string): {
        hasMediaQueries: boolean;
        hasMobileOptimizations: boolean;
        hasFluidTypography: boolean;
        hasModernLayout: boolean;
    } {
        const hasMediaQueries =
            cssContent.includes("@media") && cssContent.includes("max-width");
        const hasMobileOptimizations =
            cssContent.includes("min-height: 44px") ||
            cssContent.includes("font-size: 16px") ||
            cssContent.includes("box-sizing: border-box");
        const hasFluidTypography =
            cssContent.includes("clamp(") ||
            cssContent.includes("vw") ||
            cssContent.includes("rem");
        const hasModernLayout =
            cssContent.includes("display: grid") ||
            cssContent.includes("display: flex") ||
            cssContent.includes("container-type");

        return {
            hasMediaQueries,
            hasMobileOptimizations,
            hasFluidTypography,
            hasModernLayout,
        };
    }

    private calculateResponsiveScore(indicators: boolean[]): number {
        return indicators.filter(Boolean).length;
    }

    private applyResponsiveStatus(score: number, result: AuditResult): void {
        if (score >= 3) {
            result.status = "pass";
            result.description = "优秀的响应式设计实现";
            return;
        }

        if (score >= 2) {
            result.status = "warning";
            result.description = "基础响应式设计实现";
            result.recommendations = [
                "确保viewport meta标签正确设置",
                "添加移动端触摸目标优化",
                "使用流体排版提升可读性",
                "添加更多设备断点支持",
            ];
            return;
        }

        result.status = "fail";
        result.description = "响应式设计实现不完整";
        result.recommendations = [
            "添加viewport meta标签",
            "实现响应式媒体查询",
            "优化移动端触摸体验",
            "使用现代CSS布局技术",
        ];
    }

    /**
     * 检查SEO文件和配置
     */
    checkSEOFiles(): AuditResult {
        const result: AuditResult = {
            name: "SEO文件和配置检查",
            status: "pass",
            description: "检查robots.txt、sitemap.xml等SEO文件",
            recommendations: [],
        };

        try {
            const seoFiles = [
                { path: "public/robots.txt", name: "robots.txt" },
                {
                    path: "src/app/sitemap.xml/route.ts",
                    name: "sitemap.xml路由",
                },
                { path: "src/lib/seo-metadata.ts", name: "SEO元数据工具" },
                { path: "src/lib/seo/breadcrumbs.ts", name: "面包屑工具" },
                { path: "src/lib/seo/canonical.ts", name: "Canonical URL工具" },
            ];

            let existingFiles = 0;
            const missingFiles: string[] = [];

            seoFiles.forEach((file) => {
                const filePath = join(this.projectRoot, file.path);
                if (existsSync(filePath)) {
                    existingFiles++;
                } else {
                    missingFiles.push(file.name);
                }
            });

            // 检查package.json中的SEO相关脚本
            const packageJsonPath = join(this.projectRoot, "package.json");
            let hasSEOScripts = false;

            if (existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(
                    readFileSync(packageJsonPath, "utf8"),
                );
                const scripts = packageJson.scripts || {};

                hasSEOScripts = Object.keys(scripts).some(
                    (script) =>
                        script.includes("seo") ||
                        script.includes("quality") ||
                        script.includes("performance"),
                );
            }

            if (existingFiles >= 4 && hasSEOScripts) {
                result.status = "pass";
                result.description = `完整的SEO文件配置 (${existingFiles}/${seoFiles.length})`;
            } else if (existingFiles >= 2) {
                result.status = "warning";
                result.description = `基础SEO文件配置 (${existingFiles}/${seoFiles.length})`;
                result.recommendations = [
                    ...missingFiles.map((file) => `添加${file}`),
                ];
                if (!hasSEOScripts) {
                    result.recommendations.push("添加SEO相关的npm脚本");
                }
            } else {
                result.status = "fail";
                result.description = `SEO文件配置不完整 (${existingFiles}/${seoFiles.length})`;
                result.recommendations = [
                    ...missingFiles.map((file) => `创建${file}`),
                    "添加SEO自动化检查脚本",
                    "配置站点地图生成",
                ];
            }
        } catch (error) {
            result.status = "fail";
            result.description = `检查失败: ${error}`;
        }

        this.results.push(result);
        return result;
    }

    /**
     * 检查可访问性
     */
    checkAccessibility(): AuditResult {
        const result: AuditResult = {
            name: "可访问性检查",
            status: "pass",
            description: "检查WCAG可访问性实现",
            recommendations: [],
        };

        try {
            const accessibilityFilePath = join(
                this.projectRoot,
                "src/styles/accessibility.css",
            );
            const skipLinkPath = join(
                this.projectRoot,
                "src/components/accessibility/skip-link.tsx",
            );

            let accessibilityScore = 0;
            const missingFeatures: string[] = [];

            // 检查可访问性样式文件
            if (existsSync(accessibilityFilePath)) {
                accessibilityScore++;
                const cssContent = readFileSync(accessibilityFilePath, "utf8");

                // 检查关键可访问性特性
                const features = [
                    { pattern: "skip-link", name: "跳转链接样式" },
                    { pattern: "focus-visible", name: "焦点指示器" },
                    { pattern: "sr-only", name: "屏幕阅读器样式" },
                    { pattern: "prefers-reduced-motion", name: "动画偏好支持" },
                    { pattern: "prefers-contrast", name: "高对比度支持" },
                ];

                features.forEach((feature) => {
                    if (cssContent.includes(feature.pattern)) {
                        accessibilityScore++;
                    } else {
                        missingFeatures.push(feature.name);
                    }
                });
            } else {
                missingFeatures.push("可访问性样式文件");
            }

            // 检查跳转链接组件
            if (existsSync(skipLinkPath)) {
                accessibilityScore++;
            } else {
                missingFeatures.push("跳转链接组件");
            }

            // 检查landing页面的可访问性实现
            const landingPagePath = join(
                this.projectRoot,
                "src/modules/marketing/landing.page.tsx",
            );
            if (existsSync(landingPagePath)) {
                const landingContent = readFileSync(landingPagePath, "utf8");

                const a11yFeatures = [
                    { pattern: "aria-label", name: "ARIA标签" },
                    { pattern: "role=", name: "语义化角色" },
                    { pattern: "alt=", name: "图片alt属性" },
                    { pattern: "tabIndex", name: "焦点管理" },
                ];

                a11yFeatures.forEach((feature) => {
                    if (landingContent.includes(feature.pattern)) {
                        accessibilityScore++;
                    }
                });
            }

            const totalChecks = 8; // 基础检查项目数

            if (accessibilityScore >= totalChecks * 0.8) {
                result.status = "pass";
                result.description = `优秀的可访问性实现 (${accessibilityScore}/${totalChecks})`;
            } else if (accessibilityScore >= totalChecks * 0.6) {
                result.status = "warning";
                result.description = `基础可访问性实现 (${accessibilityScore}/${totalChecks})`;
                result.recommendations = [
                    ...missingFeatures.slice(0, 3),
                    "添加更多ARIA标签",
                    "改进键盘导航支持",
                    "确保颜色对比度符合标准",
                ];
            } else {
                result.status = "fail";
                result.description = `可访问性实现不完整 (${accessibilityScore}/${totalChecks})`;
                result.recommendations = [
                    ...missingFeatures,
                    "实现完整的可访问性样式",
                    "添加跳转链接组件",
                    "改善焦点管理和键盘导航",
                ];
            }
        } catch (error) {
            result.status = "fail";
            result.description = `检查失败: ${error}`;
        }

        this.results.push(result);
        return result;
    }

    /**
     * 生成审计报告
     */
    generateReport(): void {
        console.info("\n🔍 SEO审计报告");
        console.info("=".repeat(60));

        const passed = this.results.filter((r) => r.status === "pass").length;
        const warnings = this.results.filter(
            (r) => r.status === "warning",
        ).length;
        const failed = this.results.filter((r) => r.status === "fail").length;

        this.results.forEach((result) => {
            const icon =
                result.status === "pass"
                    ? "✅"
                    : result.status === "warning"
                      ? "⚠️"
                      : "❌";

            console.info(`\n${icon} ${result.name}`);
            console.info(`   ${result.description}`);

            if (result.recommendations && result.recommendations.length > 0) {
                console.info("   💡 建议:");
                result.recommendations.forEach((rec) => {
                    console.info(`     • ${rec}`);
                });
            }
        });

        console.info("\n📊 审计统计:");
        console.info(`   ✅ 通过: ${passed}`);
        console.info(`   ⚠️  警告: ${warnings}`);
        console.info(`   ❌ 失败: ${failed}`);
        console.info(
            `   📈 总分: ${Math.round((passed / this.results.length) * 100)}%`,
        );

        // 总体评估
        if (failed === 0 && warnings <= 1) {
            console.info("\n🎉 SEO优化优秀！项目具备了完整的SEO基础设施。");
        } else if (failed === 0) {
            console.info("\n👍 SEO优化良好！有少量改进空间。");
        } else if (failed <= 2) {
            console.info("\n👌 SEO优化一般，需要关注失败的检查项目。");
        } else {
            console.info("\n⚠️  需要重点改进SEO配置，多个检查项目未通过。");
        }

        console.info("\n🚀 下一步行动建议:");
        if (failed > 0) {
            console.info("1. 优先修复失败的检查项目");
        }
        if (warnings > 0) {
            console.info("2. 根据建议改进警告项目");
        }
        console.info("3. 定期运行SEO审计检查");
        console.info("4. 监控Core Web Vitals指标");
        console.info("5. 持续优化用户体验");
    }

    /**
     * 运行完整的SEO审计
     */
    runAudit(): void {
        console.info("🚀 开始SEO审计...\n");

        this.checkSemanticHTML();
        this.checkStructuredData();
        this.checkResponsiveDesign();
        this.checkSEOFiles();
        this.checkAccessibility();

        this.generateReport();

        // 设置退出码
        const hasFailures = this.results.some((r) => r.status === "fail");
        process.exit(hasFailures ? 1 : 0);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const auditor = new SEOAuditor();
    auditor.runAudit();
}

export { SEOAuditor };
