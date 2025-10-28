import baseConfigJson from "../../config/environments/base.json";
import developmentConfigJson from "../../config/environments/development.json";
import productionConfigJson from "../../config/environments/production.json";
import stagingConfigJson from "../../config/environments/staging.json";
import {
    type Config,
    type ConfigOverride,
    configOverrideSchema,
    configSchema,
    type EnvironmentName,
    type ServicesConfig,
} from "./types";

const BASE_CONFIG = configSchema.parse(baseConfigJson);

const ENVIRONMENT_OVERRIDES: Partial<Record<EnvironmentName, ConfigOverride>> =
    {
        development: configOverrideSchema.parse(developmentConfigJson),
        production: configOverrideSchema.parse(productionConfigJson),
        staging: configOverrideSchema.parse(stagingConfigJson),
    };

type ExternalApiConfig = NonNullable<ServicesConfig["external_apis"]>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((item) => clone(item)) as unknown as T;
    }

    if (isPlainRecord(value)) {
        const result: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            result[key] = clone(entry);
        }
        return result as T;
    }

    return value;
}

function deepMerge<
    T extends Record<string, unknown>,
    U extends Record<string, unknown>,
>(base: T, override?: U): T {
    const resultRecord = clone(base) as Record<string, unknown>;
    if (!override) {
        return resultRecord as T;
    }

    for (const [key, value] of Object.entries(
        override as Record<string, unknown>,
    )) {
        if (value === undefined) {
            continue;
        }

        const currentValue = resultRecord[key];
        if (isPlainRecord(currentValue) && isPlainRecord(value)) {
            resultRecord[key] = deepMerge(
                currentValue as Record<string, unknown>,
                value as Record<string, unknown>,
            ) as unknown;
            continue;
        }

        if (Array.isArray(value)) {
            resultRecord[key] = clone(value) as unknown;
            continue;
        }

        resultRecord[key] = value as unknown;
    }

    return resultRecord as T;
}

function coerceNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return undefined;
        }
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return undefined;
}

function selectEnvValue(env: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
        if (key in env) {
            const value = env[key];
            if (value !== undefined && value !== null && `${value}` !== "") {
                return value;
            }
        }
    }
    return undefined;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function applyPaginationRuntimeOverrides(
    pagination: Config["pagination"],
    env: Record<string, unknown>,
): void {
    if (!pagination) {
        return;
    }

    const paginationOverrides = {
        defaultPageSize: coerceNumber(
            selectEnvValue(env, [
                "PAGINATION_DEFAULT_PAGE_SIZE",
                "PAGINATION_DEFAULT_PER_PAGE",
            ]),
        ),
        minPageSize: coerceNumber(
            selectEnvValue(env, ["PAGINATION_MIN_PAGE_SIZE"]),
        ),
        maxPageSize: coerceNumber(
            selectEnvValue(env, ["PAGINATION_MAX_PAGE_SIZE"]),
        ),
    };

    if (paginationOverrides.minPageSize !== undefined) {
        pagination.minPageSize = Math.max(1, paginationOverrides.minPageSize);
    }
    if (paginationOverrides.maxPageSize !== undefined) {
        pagination.maxPageSize = Math.max(
            paginationOverrides.maxPageSize,
            pagination.minPageSize,
        );
    }
    if (paginationOverrides.defaultPageSize !== undefined) {
        pagination.defaultPageSize = paginationOverrides.defaultPageSize;
    }

    const min = Math.max(1, pagination.minPageSize);
    const max = Math.max(min, pagination.maxPageSize);
    pagination.minPageSize = min;
    pagination.maxPageSize = max;
    pagination.defaultPageSize = clamp(pagination.defaultPageSize, min, max);
}

function applyCacheRuntimeOverrides(
    cache: Config["cache"],
    env: Record<string, unknown>,
): void {
    if (!cache) {
        return;
    }

    const ttlOverride = coerceNumber(
        selectEnvValue(env, ["CACHE_DEFAULT_TTL_SECONDS", "CACHE_DEFAULT_TTL"]),
    );
    if (ttlOverride === undefined) {
        return;
    }

    cache.defaultTtlSeconds = Math.max(0, Math.floor(ttlOverride));
}

function applyExternalApiRuntimeOverrides(
    services: ExternalApiConfig | undefined,
    env: Record<string, unknown>,
): void {
    if (!services) {
        return;
    }

    const retryOverride = coerceNumber(
        selectEnvValue(env, [
            "EXTERNAL_API_RETRY_ATTEMPTS",
            "SERVICES_EXTERNAL_APIS_RETRY_ATTEMPTS",
        ]),
    );
    if (retryOverride !== undefined) {
        services.retry_attempts = Math.max(0, Math.floor(retryOverride));
    }

    if (!services.circuit_breaker) {
        return;
    }

    const failureThreshold = coerceNumber(
        selectEnvValue(env, [
            "EXTERNAL_API_FAILURE_THRESHOLD",
            "SERVICES_EXTERNAL_APIS_FAILURE_THRESHOLD",
        ]),
    );
    if (failureThreshold !== undefined) {
        services.circuit_breaker.failure_threshold = Math.max(
            1,
            Math.floor(failureThreshold),
        );
    }

    const recoverySeconds = coerceNumber(
        selectEnvValue(env, [
            "EXTERNAL_API_RECOVERY_TIMEOUT_SECONDS",
            "SERVICES_EXTERNAL_APIS_RECOVERY_TIMEOUT_SECONDS",
        ]),
    );
    if (recoverySeconds === undefined) {
        return;
    }

    const sanitized = Math.max(1, Math.floor(recoverySeconds));
    services.circuit_breaker.recovery_timeout = `${sanitized}s`;
}

function applyRuntimeOverrides(
    config: Config,
    env: Record<string, unknown>,
): Config {
    applyPaginationRuntimeOverrides(config.pagination, env);
    applyCacheRuntimeOverrides(config.cache, env);
    applyExternalApiRuntimeOverrides(config.services?.external_apis, env);

    return config;
}

function parseEnvironmentName(value: string | undefined): EnvironmentName {
    switch (value?.toLowerCase()) {
        case "production":
            return "production";
        case "staging":
            return "staging";
        case "test":
            return "test";
        default:
            return "development";
    }
}

function buildConfig(
    envName: EnvironmentName,
    runtimeEnv: Record<string, unknown>,
): Config {
    const override = ENVIRONMENT_OVERRIDES[envName];
    const merged = deepMerge(BASE_CONFIG, override);
    const runtimeAdjusted = applyRuntimeOverrides(merged, runtimeEnv);
    return configSchema.parse(runtimeAdjusted);
}

function gatherRuntimeEnv(
    cloudflareEnv?: Record<string, unknown>,
): Record<string, unknown> {
    return {
        ...process.env,
        ...(cloudflareEnv ?? {}),
    };
}

export function resolveConfigSync(envName?: string): Config {
    const environment = parseEnvironmentName(
        envName ?? process.env.NEXTJS_ENV ?? process.env.NODE_ENV,
    );
    const runtimeEnv = gatherRuntimeEnv();
    return buildConfig(environment, runtimeEnv);
}

export const config: Config = resolveConfigSync();

export type { Config, EnvironmentName } from "./types";
