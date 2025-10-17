export type EnvironmentName = "development" | "staging" | "production" | "test";

export interface PaginationConfig {
    defaultPageSize: number;
    minPageSize: number;
    maxPageSize: number;
}

export interface CacheConfig {
    defaultTtlSeconds: number;
}

export interface StaticAssetCacheHeadersConfig {
    max_age?: number | string;
    immutable?: boolean;
    [key: string]: unknown;
}

export interface StaticAssetsConfig {
    cache_headers?: StaticAssetCacheHeadersConfig;
    [key: string]: unknown;
}

export interface PerformanceConfig {
    cache_ttl?: string;
    compression_enabled?: boolean;
    cdn_enabled?: boolean;
    monitoring_level?: string;
    response_timeout?: string;
    image_optimization?: Record<string, unknown>;
    static_assets?: StaticAssetsConfig;
    [key: string]: unknown;
}

export interface Config {
    metadata?: Record<string, unknown>;
    pagination: PaginationConfig;
    cache: CacheConfig;
    database?: Record<string, unknown>;
    security?: Record<string, unknown>;
    performance?: PerformanceConfig;
    features?: Record<string, unknown>;
    services?: Record<string, unknown>;
    logging?: Record<string, unknown>;
    backup?: Record<string, unknown>;
    monitoring?: Record<string, unknown>;
    compliance?: Record<string, unknown>;
    development?: Record<string, unknown>;
    testing?: Record<string, unknown>;
    [key: string]: unknown;
}
