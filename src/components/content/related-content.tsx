"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
    ArrowRightIcon,
    BookOpenIcon,
    UsersIcon,
    SettingsIcon,
    FileTextIcon,
    TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RelatedContentItem {
    title: string;
    description: string;
    href: string;
    category?: string;
    icon?: React.ReactNode;
    tags?: readonly string[];
    readTime?: string;
    featured?: boolean;
}

interface RelatedContentProps {
    className?: string;
    title?: string;
    maxItems?: number;
    showCategory?: boolean;
    showTags?: boolean;
    showReadTime?: boolean;
    layout?: "grid" | "list" | "carousel";
    cardStyle?: "default" | "bordered" | "elevated";
}

/**
 * SEO友好的相关内容推荐组件
 *
 * 功能：
 * - 基于当前页面智能推荐相关内容
 * - 支持多种布局样式
 * - 优化锚文本和内部链接
 * - 提升页面停留时间
 * - 改善用户导航体验
 *
 * 使用方法：
 * ```tsx
 * <RelatedContent maxItems={6} layout="grid" />
 * ```
 */
export function RelatedContent({
    className,
    title,
    maxItems = 6,
    showCategory = true,
    showTags = true,
    showReadTime = true,
    layout = "grid",
    cardStyle = "default",
}: RelatedContentProps) {
    const pathname = usePathname();
    const t = useTranslations("Common");
    const [relatedItems, setRelatedItems] = useState<RelatedContentItem[]>([]);

    useEffect(() => {
        // 根据当前路径生成相关内容推荐
        const items = generateRelatedContent(pathname, t);
        setRelatedItems(items.slice(0, maxItems));
    }, [pathname, t, maxItems]);

    if (relatedItems.length === 0) {
        return null;
    }

    const containerClasses = cn("space-y-6", className);

    const titleClasses = cn(
        "text-2xl font-bold tracking-tight text-foreground mb-6",
        "flex items-center gap-2",
    );

    const gridClasses = {
        grid: "grid gap-6 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        list: "space-y-4",
        carousel: "flex gap-4 overflow-x-auto pb-2",
    };

    const cardClasses = {
        default:
            "group flex flex-col space-y-2 rounded-lg border p-6 transition-all hover:shadow-md hover:border-primary/50",
        bordered:
            "group flex flex-col space-y-2 rounded-lg border-2 border-border bg-background p-6 transition-all hover:border-primary/50",
        elevated:
            "group flex flex-col space-y-2 rounded-lg border bg-background shadow-sm p-6 transition-all hover:shadow-md hover:border-primary/50",
    };

    return (
        <section
            className={containerClasses}
            aria-labelledby="related-content-title"
        >
            {title && (
                <h2 id="related-content-title" className={titleClasses}>
                    <FileTextIcon className="w-6 h-6" />
                    {title}
                </h2>
            )}

            <div className={gridClasses[layout]}>
                {relatedItems.map((item, index) => (
                    <Link
                        key={`${item.href}-${index}`}
                        href={item.href}
                        className={cn(
                            cardClasses[cardStyle],
                            "block no-underline text-foreground hover:text-primary transition-colors",
                        )}
                        aria-labelledby={`related-item-${index}-title`}
                    >
                        {/* 分类标签 */}
                        {showCategory && item.category && (
                            <Badge variant="secondary" className="w-fit">
                                {getCategoryIcon(item.category)}
                                <span className="ml-1">{item.category}</span>
                            </Badge>
                        )}

                        {/* 标题 */}
                        <h3
                            id={`related-item-${index}-title`}
                            className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors"
                        >
                            {item.title}
                        </h3>

                        {/* 描述 */}
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
                            {item.description}
                        </p>

                        {/* 标签 */}
                        {showTags && item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {item.tags.slice(0, 3).map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        <TagIcon className="w-3 h-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        +{item.tags.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* 底部信息 */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {showReadTime && item.readTime && (
                                <div className="flex items-center gap-1">
                                    <BookOpenIcon className="w-3 h-3" />
                                    <span>{item.readTime}</span>
                                </div>
                            )}
                            <ArrowRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* 特色标记 */}
                        {item.featured && (
                            <div className="absolute top-2 right-2">
                                <Badge variant="default" className="text-xs">
                                    特色
                                </Badge>
                            </div>
                        )}
                    </Link>
                ))}
            </div>

            {/* 查看更多链接 */}
            {relatedItems.length >= maxItems && (
                <div className="text-center pt-6">
                    <Link
                        href="/blog" // 这里应该是相关内容的聚合页面
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        查看更多相关内容
                        <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </section>
    );
}

// 根据分类返回图标
function getCategoryIcon(category: string): React.ReactNode {
    const iconMap: Record<string, React.ReactNode> = {
        功能: <SettingsIcon className="w-3 h-3" />,
        教程: <BookOpenIcon className="w-3 h-3" />,
        案例: <UsersIcon className="w-3 h-3" />,
        团队: <UsersIcon className="w-3 h-3" />,
        产品: <SettingsIcon className="w-3 h-3" />,
    };

    return iconMap[category] || <FileTextIcon className="w-3 h-3" />;
}

// 根据当前路径生成相关内容
function generateRelatedContent(
    pathname: string,
    t: (key: string) => string,
): RelatedContentItem[] {
    const currentPath = pathname.replace(/^\/+/, "");

    // 预定义的相关内容映射
    const contentMap: Record<string, RelatedContentItem[]> = {
        "": [
            {
                title: "功能介绍",
                description:
                    "了解我们产品的核心功能，包括任务管理、团队协作和数据分析等模块。",
                href: "/features",
                category: "功能",
                tags: ["任务管理", "团队协作", "数据分析"],
                readTime: "5分钟阅读",
                featured: true,
                icon: <SettingsIcon className="w-5 h-5" />,
            },
            {
                title: "价格方案",
                description:
                    "选择适合您需求的价格方案，灵活订阅，随时升级或降级。",
                href: "/pricing",
                category: "产品",
                tags: ["订阅", "价格", "方案"],
                readTime: "3分钟阅读",
                icon: <UsersIcon className="w-5 h-5" />,
            },
            {
                title: "用户指南",
                description:
                    "详细的使用指南，帮助您快速上手并充分利用所有功能。",
                href: "/docs",
                category: "教程",
                tags: ["指南", "教程", "帮助"],
                readTime: "8分钟阅读",
                icon: <BookOpenIcon className="w-5 h-5" />,
            },
        ],

        about: [
            {
                title: "团队成员",
                description: "认识我们的团队，了解我们的专业背景和服务理念。",
                href: "/team",
                category: "团队",
                tags: ["团队", "文化", "价值观"],
                readTime: "4分钟阅读",
                icon: <UsersIcon className="w-5 h-5" />,
            },
            {
                title: "公司历史",
                description: "了解我们的发展历程，从创立到现在的成长故事。",
                href: "/company/history",
                category: "案例",
                tags: ["历史", "里程碑", "发展"],
                readTime: "6分钟阅读",
                icon: <FileTextIcon className="w-5 h-5" />,
            },
            {
                title: "联系方式",
                description: "多种方式与我们取得联系，我们随时为您提供支持。",
                href: "/contact",
                category: "功能",
                tags: ["联系", "支持", "服务"],
                readTime: "2分钟阅读",
                icon: <SettingsIcon className="w-5 h-5" />,
            },
        ],

        contact: [
            {
                title: "常见问题",
                description: "查看用户常问的问题和详细解答，快速找到解决方案。",
                href: "/faq",
                category: "教程",
                tags: ["FAQ", "问题", "解答"],
                readTime: "10分钟阅读",
                icon: <BookOpenIcon className="w-5 h-5" />,
            },
            {
                title: "技术支持",
                description:
                    "专业技术支持团队为您提供及时的技术帮助和问题解决。",
                href: "/support",
                category: "功能",
                tags: ["支持", "技术", "帮助"],
                readTime: "3分钟阅读",
                icon: <SettingsIcon className="w-5 h-5" />,
            },
        ],

        dashboard: [
            {
                title: "任务管理",
                description: "深入了解任务管理功能，创建、分配和跟踪任务进度。",
                href: "/dashboard/todos",
                category: "功能",
                tags: ["任务", "管理", "跟踪"],
                readTime: "7分钟阅读",
                icon: <SettingsIcon className="w-5 h-5" />,
            },
            {
                title: "团队协作",
                description: "学习如何利用团队协作功能提高团队工作效率。",
                href: "/dashboard/collaboration",
                category: "教程",
                tags: ["协作", "团队", "效率"],
                readTime: "6分钟阅读",
                icon: <UsersIcon className="w-5 h-5" />,
            },
            {
                title: "数据分析",
                description: "查看详细的数据分析报告，了解项目进展和团队表现。",
                href: "/dashboard/analytics",
                category: "案例",
                tags: ["数据", "分析", "报告"],
                readTime: "8分钟阅读",
                icon: <FileTextIcon className="w-5 h-5" />,
            },
        ],

        billing: [
            {
                title: "使用统计",
                description: "查看您的使用统计，了解资源消耗和成本分析。",
                href: "/billing/usage",
                category: "案例",
                tags: ["统计", "使用", "分析"],
                readTime: "4分钟阅读",
                icon: <FileTextIcon className="w-5 h-5" />,
            },
            {
                title: "订阅管理",
                description: "管理您的订阅计划，包括升级、降级和取消操作。",
                href: "/billing/manage",
                category: "教程",
                tags: ["订阅", "管理", "计划"],
                readTime: "5分钟阅读",
                icon: <BookOpenIcon className="w-5 h-5" />,
            },
            {
                title: "支付方式",
                description: "了解我们支持的各种支付方式和安全保障措施。",
                href: "/billing/payment-methods",
                category: "功能",
                tags: ["支付", "安全", "方式"],
                readTime: "3分钟阅读",
                icon: <SettingsIcon className="w-5 h-5" />,
            },
        ],
    };

    return contentMap[currentPath] || [];
}

// 预设内容配置
export const RelatedContentPresets = {
    // 博客相关
    blog: [
        {
            title: "如何提高团队效率",
            description: "10个实用的团队管理技巧，帮助您的团队提高工作效率。",
            href: "/blog/team-efficiency",
            category: "教程",
            tags: ["团队", "效率", "管理"],
            readTime: "12分钟阅读",
        },
        {
            title: "项目管理最佳实践",
            description: "现代项目管理的最佳实践和工具推荐。",
            href: "/blog/project-management",
            category: "功能",
            tags: ["项目管理", "最佳实践", "工具"],
            readTime: "15分钟阅读",
        },
        {
            title: "远程协作指南",
            description: "远程团队协作的完整指南和工具推荐。",
            href: "/blog/remote-collaboration",
            category: "教程",
            tags: ["远程", "协作", "指南"],
            readTime: "20分钟阅读",
        },
    ],

    // 产品相关
    product: [
        {
            title: "功能对比",
            description: "不同版本的功能对比，帮助您选择最适合的方案。",
            href: "/pricing/compare",
            category: "产品",
            tags: ["对比", "功能", "版本"],
            readTime: "8分钟阅读",
        },
        {
            title: "集成方案",
            description: "与主流工具的集成方案和配置指南。",
            href: "/integrations",
            category: "功能",
            tags: ["集成", "工具", "配置"],
            readTime: "12分钟阅读",
        },
        {
            title: "API文档",
            description: "完整的API文档，帮助开发者快速集成。",
            href: "/docs/api",
            category: "教程",
            tags: ["API", "文档", "开发者"],
            readTime: "25分钟阅读",
        },
    ],

    // 学习资源
    learning: [
        {
            title: "快速入门",
            description: "30分钟快速掌握产品核心功能。",
            href: "/getting-started",
            category: "教程",
            tags: ["入门", "快速", "学习"],
            readTime: "30分钟阅读",
        },
        {
            title: "视频教程",
            description: "丰富的视频教程资源，直观学习产品使用方法。",
            href: "/tutorials",
            category: "教程",
            tags: ["视频", "教程", "学习"],
            readTime: "45分钟观看",
        },
        {
            title: "最佳实践",
            description: "行业专家分享的最佳实践和经验总结。",
            href: "/best-practices",
            category: "案例",
            tags: ["最佳实践", "专家", "经验"],
            readTime: "18分钟阅读",
        },
    ],
} as const;

// 内容推荐工具类
export class RelatedContentUtils {
    /**
     * 根据页面类型获取推荐内容
     */
    static getRecommendations(
        pageType: string,
        limit: number = 6,
    ): RelatedContentItem[] {
        const preset =
            RelatedContentPresets[
                pageType as keyof typeof RelatedContentPresets
            ];
        return preset ? preset.slice(0, limit) : [];
    }

    /**
     * 根据标签获取相关内容
     */
    static getByTags(
        tags: string[],
        items: RelatedContentItem[],
    ): RelatedContentItem[] {
        return items.filter(
            (item) => item.tags && item.tags.some((tag) => tags.includes(tag)),
        );
    }

    /**
     * 根据分类获取相关内容
     */
    static getByCategory(
        category: string,
        items: RelatedContentItem[],
    ): RelatedContentItem[] {
        return items.filter((item) => item.category === category);
    }

    /**
     * 计算内容相关性分数
     */
    static calculateRelevance(
        item1: RelatedContentItem,
        item2: RelatedContentItem,
    ): number {
        let score = 0;

        // 标签匹配
        if (item1.tags && item2.tags) {
            const commonTags = item1.tags.filter((tag) =>
                item2.tags?.includes(tag),
            );
            score += commonTags.length * 2;
        }

        // 分类匹配
        if (item1.category && item1.category === item2.category) {
            score += 3;
        }

        return score;
    }

    /**
     * 验证内容项
     */
    static validateItem(item: RelatedContentItem): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (!item.title || item.title.trim().length === 0) {
            errors.push("标题不能为空");
        }

        if (!item.description || item.description.trim().length === 0) {
            errors.push("描述不能为空");
        }

        if (!item.href || item.href.trim().length === 0) {
            errors.push("链接不能为空");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
