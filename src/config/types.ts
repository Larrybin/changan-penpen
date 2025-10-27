import { z } from "zod";

export type EnvironmentName = "development" | "staging" | "production" | "test";

const unknownRecordSchema = z.record(z.string(), z.unknown());

export const paginationConfigSchema = z.object({
    defaultPageSize: z.number().int().min(1),
    minPageSize: z.number().int().min(1),
    maxPageSize: z.number().int().min(1),
});

export type PaginationConfig = z.infer<typeof paginationConfigSchema>;

export const cacheConfigSchema = z.object({
    defaultTtlSeconds: z.number().int().min(0),
});

export type CacheConfig = z.infer<typeof cacheConfigSchema>;

export const staticAssetCacheHeadersConfigSchema = z
    .object({
        max_age: z.union([z.number(), z.string()]).optional(),
        immutable: z.boolean().optional(),
    })
    .passthrough();

export type StaticAssetCacheHeadersConfig = z.infer<
    typeof staticAssetCacheHeadersConfigSchema
>;

export const staticAssetsConfigSchema = z
    .object({
        cache_headers: staticAssetCacheHeadersConfigSchema.optional(),
    })
    .passthrough();

export type StaticAssetsConfig = z.infer<typeof staticAssetsConfigSchema>;

export const performanceConfigSchema = z
    .object({
        cache_ttl: z.string().optional(),
        compression_enabled: z.boolean().optional(),
        cdn_enabled: z.boolean().optional(),
        monitoring_level: z.string().optional(),
        response_timeout: z.string().optional(),
        cache_control: unknownRecordSchema.optional(),
        image_optimization: unknownRecordSchema.optional(),
        static_assets: staticAssetsConfigSchema.optional(),
    })
    .passthrough();

export type PerformanceConfig = z.infer<typeof performanceConfigSchema>;

const passwordPolicySchema = z
    .object({
        min_length: z.number().int().min(0).optional(),
        require_special_chars: z.boolean().optional(),
        require_numbers: z.boolean().optional(),
        require_uppercase: z.boolean().optional(),
    })
    .passthrough();

const rateLimitingConfigSchema = z
    .object({
        enabled: z.boolean().optional(),
        requests_per_minute: z.number().int().min(0).optional(),
        burst_size: z.number().int().min(0).optional(),
        block_duration: z.string().optional(),
    })
    .passthrough();

const corsConfigSchema = z
    .object({
        enabled: z.boolean().optional(),
        allowed_origins: z.array(z.string()).optional(),
        allowed_methods: z.array(z.string()).optional(),
        allowed_headers: z.array(z.string()).optional(),
        credentials: z.boolean().optional(),
    })
    .passthrough();

const authenticationConfigSchema = z
    .object({
        providers: z.array(z.string()).optional(),
        session_name: z.string().optional(),
        cookie_secure: z.boolean().optional(),
        cookie_http_only: z.boolean().optional(),
        same_site: z.string().optional(),
    })
    .passthrough();

export const securityConfigSchema = z
    .object({
        encryption_algorithm: z.string().optional(),
        session_timeout: z.string().optional(),
        secret_rotation: z.string().optional(),
        debug_enabled: z.boolean().optional(),
        password_policy: passwordPolicySchema.optional(),
        rate_limiting: rateLimitingConfigSchema.optional(),
        cors: corsConfigSchema.optional(),
        authentication: authenticationConfigSchema.optional(),
        headers: z
            .record(z.string(), z.union([z.string(), z.boolean(), z.number()]))
            .optional(),
    })
    .passthrough();

export type SecurityConfig = z.infer<typeof securityConfigSchema>;

const trafficSplitSchema = z
    .object({
        control: z.number().optional(),
        variant: z.number().optional(),
    })
    .passthrough();

const experimentsConfigSchema = z
    .object({
        enabled: z.boolean().optional(),
        traffic_split: trafficSplitSchema.optional(),
    })
    .passthrough();

export const featuresConfigSchema = z
    .object({
        feature_flags: z.record(z.string(), z.boolean()).optional(),
        experiments: experimentsConfigSchema.optional(),
    })
    .passthrough();

export type FeaturesConfig = z.infer<typeof featuresConfigSchema>;

const circuitBreakerConfigSchema = z
    .object({
        enabled: z.boolean().optional(),
        failure_threshold: z.number().int().min(0).optional(),
        recovery_timeout: z.string().optional(),
        half_open_max_calls: z.number().int().min(0).optional(),
    })
    .passthrough();

const externalApisConfigSchema = z
    .object({
        timeout: z.string().optional(),
        retry_attempts: z.number().int().min(0).optional(),
        circuit_breaker: circuitBreakerConfigSchema.optional(),
    })
    .passthrough();

const notificationRetryPolicySchema = z
    .object({
        max_attempts: z.number().int().min(0).optional(),
        backoff: z.string().optional(),
    })
    .passthrough();

const notificationsConfigSchema = z
    .object({
        enabled: z.boolean().optional(),
        channels: z.array(z.string()).optional(),
        queue_size: z.number().int().min(0).optional(),
        retry_policy: notificationRetryPolicySchema.optional(),
    })
    .passthrough();

const analyticsConfigSchema = z
    .object({
        enabled: z.boolean().optional(),
        provider: z.string().optional(),
        sampling_rate: z.number().min(0).optional(),
        batch_size: z.number().int().min(0).optional(),
        flush_interval: z.string().optional(),
    })
    .passthrough();

export const servicesConfigSchema = z
    .object({
        external_apis: externalApisConfigSchema.optional(),
        notifications: notificationsConfigSchema.optional(),
        analytics: analyticsConfigSchema.optional(),
    })
    .passthrough();

export type ServicesConfig = z.infer<typeof servicesConfigSchema>;

export const configSchema = z
    .object({
        metadata: unknownRecordSchema.optional(),
        pagination: paginationConfigSchema,
        cache: cacheConfigSchema,
        database: unknownRecordSchema.optional(),
        security: securityConfigSchema.optional(),
        performance: performanceConfigSchema.optional(),
        features: featuresConfigSchema.optional(),
        services: servicesConfigSchema.optional(),
        logging: unknownRecordSchema.optional(),
        backup: unknownRecordSchema.optional(),
        monitoring: unknownRecordSchema.optional(),
        compliance: unknownRecordSchema.optional(),
        development: unknownRecordSchema.optional(),
        testing: unknownRecordSchema.optional(),
    })
    .passthrough();

export type Config = z.infer<typeof configSchema>;

export const configOverrideSchema = configSchema.deepPartial();

export type ConfigOverride = z.infer<typeof configOverrideSchema>;
