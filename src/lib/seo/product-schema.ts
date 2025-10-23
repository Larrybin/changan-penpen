import { buildLocalizedPath, resolveAppUrl } from "../seo";

/**
 * 产品/服务结构化数据生成工具
 *
 * 支持：
 * - SoftwareApplication
 * - Service
 * - Product
 * - Offer
 * - Review
 * - AggregateRating
 */

interface SoftwareApplicationSchema {
    "@context": "https://schema.org";
    "@type": "SoftwareApplication";
    name: string;
    description: string;
    url: string;
    applicationCategory: string;
    operatingSystem: string;
    offers?: OfferSchema;
    aggregateRating?: AggregateRatingSchema;
    review?: ReviewSchema[];
    screenshot?: string;
    featureList?: string[];
    inLanguage?: string;
    datePublished?: string;
    dateModified?: string;
    author?: OrganizationSchema;
    publisher?: OrganizationSchema;
    softwareVersion?: string;
    downloadUrl?: string;
    installUrl?: string;
    requirements?: string;
    permissions?: string;
    license?: string;
}

interface ServiceSchema {
    "@context": "https://schema.org";
    "@type": "Service";
    name: string;
    description: string;
    url: string;
    provider?: OrganizationSchema;
    areaServed?: string;
    hasOfferCatalog?: OfferCatalogSchema;
    serviceType?: string;
    hoursAvailable?: string;
    serviceOutput?: string;
    providerMobility?: string;
    termsOfService?: string;
    audience?: string;
}

interface ProductSchema {
    "@context": "https://schema.org";
    "@type": "Product";
    name: string;
    description: string;
    url: string;
    image?: string | string[];
    brand?: OrganizationSchema;
    offers?: OfferSchema;
    aggregateRating?: AggregateRatingSchema;
    review?: ReviewSchema[];
    sku?: string;
    gtin?: string;
    category?: string;
    material?: string;
    weight?: string;
    width?: string;
    height?: string;
    depth?: string;
    color?: string;
    releaseDate?: string;
}

interface OfferSchema {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    priceValidUntil?: string;
    availability: string;
    url?: string;
    seller?: OrganizationSchema;
    validFrom?: string;
    validThrough?: string;
    itemCondition?: string;
    shippingDetails?: string;
    returnPolicy?: string;
    paymentAccepted?: string;
    eligibleRegion?: string[];
    ineligibleRegion?: string[];
}

interface ReviewSchema {
    "@type": "Review";
    author: PersonSchema;
    reviewRating: RatingSchema;
    reviewBody: string;
    datePublished?: string;
    publisher?: OrganizationSchema;
}

interface RatingSchema {
    "@type": "Rating";
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
}

interface AggregateRatingSchema {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
    itemReviewed?: string;
}

interface OrganizationSchema {
    "@type": "Organization";
    name: string;
    url: string;
    logo?: string;
    description?: string;
    contactPoint?: ContactPointSchema;
    address?: AddressSchema;
    sameAs?: string[];
}

interface PersonSchema {
    "@type": "Person";
    name: string;
    url?: string;
    image?: string;
    jobTitle?: string;
    worksFor?: OrganizationSchema;
}

interface ContactPointSchema {
    "@type": "ContactPoint";
    telephone?: string;
    email?: string;
    contactType?: string;
    availableLanguage?: string[];
    hoursAvailable?: string;
}

interface AddressSchema {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
}

interface OfferCatalogSchema {
    "@type": "OfferCatalog";
    name: string;
    itemListElement?: OfferSchema[];
}

/**
 * 生成软件应用结构化数据
 */
export function generateSoftwareApplicationSchema(
    params: {
        name: string;
        description: string;
        category?: string;
        features?: string[];
        screenshots?: string[];
        price?: number;
        currency?: string;
        rating?: number;
        reviewCount?: number;
        reviews?: Array<{ author: string; rating: number; comment: string }>;
        version?: string;
        platform?: string;
        publisher?: { name: string; url: string; logo?: string };
        locale?: string;
        appUrl?: string;
    },
    siteSettings?: any,
): SoftwareApplicationSchema {
    const baseUrl = resolveAppUrl(
        siteSettings,
        params.appUrl ? { envAppUrl: params.appUrl } : {},
    );

    const schema: SoftwareApplicationSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: params.name,
        description: params.description,
        url: baseUrl,
        applicationCategory: params.category || "BusinessApplication",
        operatingSystem: params.platform || "Web",
        inLanguage: params.locale || "zh-CN",
        featureList: params.features || [],
        softwareVersion: params.version || "1.0.0",
    };

    // 添加发布者信息
    if (params.publisher) {
        schema.publisher = {
            "@type": "Organization",
            name: params.publisher.name,
            url: params.publisher.url,
            logo: params.publisher.logo,
        };
    }

    // 添加价格信息
    if (params.price && params.currency) {
        schema.offers = {
            "@type": "Offer",
            price: params.price.toString(),
            priceCurrency: params.currency,
            availability: "https://schema.org/InStock",
        };
    }

    // 添加评分信息
    if (params.rating && params.reviewCount) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: params.rating,
            reviewCount: params.reviewCount,
            bestRating: 5,
            worstRating: 1,
        };
    }

    // 添加评论信息
    if (params.reviews && params.reviews.length > 0) {
        schema.review = params.reviews.map((review) => ({
            "@type": "Review",
            author: {
                "@type": "Person",
                name: review.author,
            },
            reviewRating: {
                "@type": "Rating",
                ratingValue: review.rating,
                bestRating: 5,
                worstRating: 1,
            },
            reviewBody: review.comment,
        }));
    }

    // 添加截图
    if (params.screenshots && params.screenshots.length > 0) {
        schema.screenshot = params.screenshots[0]; // 主截图
    }

    return schema;
}

/**
 * 生成服务结构化数据
 */
export function generateServiceSchema(
    params: {
        name: string;
        description: string;
        provider?: { name: string; url: string; logo?: string };
        serviceType?: string;
        offers?: Array<{
            name: string;
            price: number;
            currency: string;
            description?: string;
            features?: string[];
        }>;
        areaServed?: string;
        hoursAvailable?: string;
        termsOfService?: string;
        locale?: string;
        appUrl?: string;
    },
    siteSettings?: any,
): ServiceSchema {
    const baseUrl = resolveAppUrl(
        siteSettings,
        params.appUrl ? { envAppUrl: params.appUrl } : {},
    );

    const schema: ServiceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: params.name,
        description: params.description,
        url: baseUrl,
        serviceType: params.serviceType || "SoftwareService",
        areaServed: params.areaServed,
        hoursAvailable: params.hoursAvailable,
        termsOfService: params.termsOfService,
    };

    // 添加服务提供者信息
    if (params.provider) {
        schema.provider = {
            "@type": "Organization",
            name: params.provider.name,
            url: params.provider.url,
            logo: params.provider.logo,
        };
    }

    // 添加服务目录
    if (params.offers && params.offers.length > 0) {
        schema.hasOfferCatalog = {
            "@type": "OfferCatalog",
            name: `${params.name} 服务方案`,
            itemListElement: params.offers.map((offer) => ({
                "@type": "Offer",
                name: offer.name,
                description: offer.description,
                price: offer.price.toString(),
                priceCurrency: params.offers?.[0]?.currency || "USD",
                availability: "https://schema.org/InStock",
                itemOffered: {
                    "@type": "Service",
                    name: offer.name,
                    description: offer.description,
                },
            })),
        };
    }

    return schema;
}

/**
 * 生成产品结构化数据
 */
export function generateProductSchema(
    params: {
        name: string;
        description: string;
        image?: string | string[];
        price?: number;
        currency?: string;
        brand?: { name: string; url: string; logo?: string };
        category?: string;
        sku?: string;
        rating?: number;
        reviewCount?: number;
        reviews?: Array<{ author: string; rating: number; comment: string }>;
        material?: string;
        color?: string;
        size?: string;
        weight?: string;
        releaseDate?: string;
        locale?: string;
        appUrl?: string;
    },
    siteSettings?: any,
): ProductSchema {
    const baseUrl = resolveAppUrl(
        siteSettings,
        params.appUrl ? { envAppUrl: params.appUrl } : {},
    );

    const schema: ProductSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: params.name,
        description: params.description,
        url: baseUrl,
        image: params.image,
        sku: params.sku,
        category: params.category,
        material: params.material,
        color: params.color,
        releaseDate: params.releaseDate,
    };

    // 添加品牌信息
    if (params.brand) {
        schema.brand = {
            "@type": "Organization",
            name: params.brand.name,
            url: params.brand.url,
            logo: params.brand.logo,
        };
    }

    // 添加价格信息
    if (params.price && params.currency) {
        schema.offers = {
            "@type": "Offer",
            price: params.price.toString(),
            priceCurrency: params.currency,
            availability: "https://schema.org/InStock",
        };
    }

    // 添加评分信息
    if (params.rating && params.reviewCount) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: params.rating,
            reviewCount: params.reviewCount,
            bestRating: 5,
            worstRating: 1,
        };
    }

    // 添加评论信息
    if (params.reviews && params.reviews.length > 0) {
        schema.review = params.reviews.map((review) => ({
            "@type": "Review",
            author: {
                "@type": "Person",
                name: review.author,
            },
            reviewRating: {
                "@type": "Rating",
                ratingValue: review.rating,
                bestRating: 5,
                worstRating: 1,
            },
            reviewBody: review.comment,
        }));
    }

    return schema;
}

/**
 * 预定义的SaaS产品配置
 */
export const SaasProductPresets = {
    // 任务管理软件
    taskManagement: {
        name: "智能任务管理系统",
        description:
            "功能强大的任务管理平台，支持团队协作、进度跟踪、数据分析等核心功能。提高团队效率30%以上。",
        category: "ProjectManagementSoftware",
        features: [
            "任务创建与分配",
            "进度跟踪与提醒",
            "团队协作与沟通",
            "数据报表与分析",
            "移动端支持",
            "API集成",
        ],
        screenshots: [
            "/screenshots/dashboard.png",
            "/screenshots/task-detail.png",
            "/screenshots/team-collaboration.png",
        ],
        version: "2.0.0",
        platform: "Web",
    },

    // 云存储服务
    cloudStorage: {
        name: "企业云存储服务",
        description:
            "安全可靠的云存储解决方案，提供文件同步、团队协作、权限管理等功能。",
        category: "StorageSoftware",
        features: [
            "文件自动同步",
            "版本历史管理",
            "团队文件夹共享",
            "细粒度权限控制",
            "端到端加密",
            "多设备访问",
        ],
        version: "3.1.0",
        platform: "Web",
    },

    // 客户关系管理
    crm: {
        name: "客户关系管理系统",
        description:
            "全面的CRM解决方案，帮助企业管理客户关系、销售流程和客户服务。",
        category: "CRMSoftware",
        features: [
            "客户信息管理",
            "销售线索跟踪",
            "营销活动管理",
            "客户服务支持",
            "数据分析报表",
            "移动办公支持",
        ],
        version: "4.0.0",
        platform: "Web",
    },
} as const;

/**
 * 结构化数据工具类
 */
export class SchemaUtils {
    /**
     * 格式化价格为结构化数据格式
     */
    static formatPrice(price: number, currency: string): string {
        return price.toFixed(2);
    }

    /**
     * 生成结构化数据的JSON-LD字符串
     */
    static toJSONLD(schema: any): string {
        return JSON.stringify(schema);
    }

    /**
     * 验证结构化数据
     */
    static validateSchema(schema: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!schema["@context"]) {
            errors.push("缺少 @context 字段");
        }

        if (!schema["@type"]) {
            errors.push("缺少 @type 字段");
        }

        if (schema["@type"] === "SoftwareApplication" && !schema.name) {
            errors.push("SoftwareApplication 必须包含 name 字段");
        }

        if (schema["@type"] === "Product" && !schema.name) {
            errors.push("Product 必须包含 name 字段");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * 合并多个结构化数据
     */
    static mergeSchemas(...schemas: any[]): any {
        return schemas.reduce((merged, schema) => {
            return { ...merged, ...schema };
        }, {});
    }
}
