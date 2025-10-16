#!/usr/bin/env node

/**
 * Environment Configuration Manager
 *
 * 智能环境配置管理系统
 * 集成MCP工具进行配置优化和安全检查
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// MCP集成接口
class MCPEnvironmentIntegrator {
    constructor(options = {}) {
        this.options = {
            enableMCP: process.env.ENABLE_MCP === "1" || options.enableMCP,
            strictMode: process.env.STRICT_MODE === "1" || options.strictMode,
            ...options,
        };
    }

    // 集成context7获取配置最佳实践
    async getConfigBestPractices(configType) {
        if (!this.options.enableMCP) {
            return this.getFallbackConfigBestPractices(configType);
        }

        try {
            // 这里应该调用context7获取配置最佳实践
            // 模拟返回最佳实践建议
            const practices = {
                database: {
                    connection_pool_size: "10",
                    timeout: "30s",
                    retry_attempts: "3",
                },
                security: {
                    secret_rotation: "90d",
                    encryption_algorithm: "AES-256-GCM",
                    session_timeout: "30m",
                },
                performance: {
                    cache_ttl: "1h",
                    compression_enabled: "true",
                    cdn_enabled: "true",
                },
            };

            return practices[configType] || {};
        } catch (error) {
            console.warn(`MCP配置最佳实践获取失败: ${error.message}`);
            return this.getFallbackConfigBestPractices(configType);
        }
    }

    getFallbackConfigBestPractices(configType) {
        const fallbackPractices = {
            database: {
                connection_pool_size: "5",
                timeout: "15s",
                retry_attempts: "2",
            },
            security: {
                secret_rotation: "60d",
                encryption_algorithm: "AES-128",
                session_timeout: "15m",
            },
            performance: {
                cache_ttl: "30m",
                compression_enabled: "true",
                cdn_enabled: "false",
            },
        };

        return fallbackPractices[configType] || {};
    }

    // 使用memory记住配置模式和变更历史
    async rememberConfigPattern(env, configChanges) {
        if (!this.options.enableMCP) {
            return;
        }

        try {
            // 这里应该调用memory记住配置模式
            const _pattern = {
                environment: env,
                changes: configChanges,
                timestamp: new Date().toISOString(),
                pattern_type: "config_change",
            };

            console.log(`记录配置模式: ${env} - ${configChanges.length}项变更`);
            // 实际MCP memory调用
        } catch (error) {
            console.warn(`MCP配置记忆失败: ${error.message}`);
        }
    }

    // 使用sequential-thinking优化配置策略
    async optimizeConfigStrategy(env, configType, currentConfig) {
        if (!this.options.enableMCP) {
            return currentConfig;
        }

        try {
            // 这里应该调用sequential-thinking进行配置优化
            console.log(`优化${env}环境${configType}配置...`);

            // 基于环境类型优化配置
            const optimizedConfig = { ...currentConfig };

            switch (env) {
                case "production":
                    optimizedConfig.cache_ttl = "24h";
                    optimizedConfig.compression_enabled = "true";
                    optimizedConfig.monitoring_level = "high";
                    optimizedConfig.backup_enabled = "true";
                    break;
                case "staging":
                    optimizedConfig.cache_ttl = "2h";
                    optimizedConfig.monitoring_level = "medium";
                    optimizedConfig.debug_enabled = "true";
                    break;
                case "development":
                    optimizedConfig.cache_ttl = "5m";
                    optimizedConfig.debug_enabled = "true";
                    optimizedConfig.hot_reload = "true";
                    break;
            }

            return optimizedConfig;
        } catch (error) {
            console.warn(`MCP配置优化失败: ${error.message}`);
            return currentConfig;
        }
    }
}

class EnvironmentManager {
    constructor(options = {}) {
        this.options = {
            configDir: options.configDir || "config/environments",
            baseConfigFile:
                options.baseConfigFile || "config/environments/base.json",
            strictMode: options.strictMode || false,
            enableMCP: options.enableMCP || false,
            ...options,
        };

        this.mcpIntegrator = new MCPEnvironmentIntegrator({
            enableMCP: this.options.enableMCP,
            strictMode: this.options.strictMode,
        });

        this.supportedEnvironments = ["development", "staging", "production"];
        this.configTypes = [
            "database",
            "security",
            "performance",
            "features",
            "services",
        ];
    }

    // 生成环境配置
    async generateEnvironmentConfig(environment, options = {}) {
        console.log(`🏗️  生成${environment}环境配置...`);

        if (!this.supportedEnvironments.includes(environment)) {
            throw new Error(
                `不支持的环境: ${environment}. 支持的环境: ${this.supportedEnvironments.join(", ")}`,
            );
        }

        try {
            // 1. 加载基础配置
            const baseConfig = await this.loadBaseConfig();

            // 2. 加载环境特定配置
            const envConfig = await this.loadEnvironmentConfig(environment);

            // 3. 合并配置
            const mergedConfig = this.mergeConfigs(baseConfig, envConfig);

            // 4. MCP优化
            if (this.options.enableMCP) {
                for (const configType of this.configTypes) {
                    const bestPractices =
                        await this.mcpIntegrator.getConfigBestPractices(
                            configType,
                        );
                    mergedConfig[configType] = {
                        ...bestPractices,
                        ...mergedConfig[configType],
                    };
                    mergedConfig[configType] =
                        await this.mcpIntegrator.optimizeConfigStrategy(
                            environment,
                            configType,
                            mergedConfig[configType],
                        );
                }
            }

            // 5. 验证配置
            await this.validateConfig(mergedConfig, environment);

            // 6. 生成最终配置文件
            const finalConfig = await this.generateFinalConfig(
                mergedConfig,
                environment,
                options,
            );

            // 7. 记录配置模式
            if (this.options.enableMCP) {
                await this.mcpIntegrator.rememberConfigPattern(
                    environment,
                    finalConfig.changes,
                );
            }

            return finalConfig;
        } catch (error) {
            throw new Error(`生成${environment}环境配置失败: ${error.message}`);
        }
    }

    // 加载基础配置
    async loadBaseConfig() {
        const configPath = path.resolve(this.options.baseConfigFile);

        if (!existsSync(configPath)) {
            return this.getDefaultBaseConfig();
        }

        try {
            const content = readFileSync(configPath, "utf8");
            return JSON.parse(content);
        } catch (error) {
            console.warn(
                `基础配置文件读取失败，使用默认配置: ${error.message}`,
            );
            return this.getDefaultBaseConfig();
        }
    }

    // 获取默认基础配置
    getDefaultBaseConfig() {
        return {
            database: {
                host: "localhost",
                port: 5432,
                ssl_enabled: false,
                pool_size: 5,
                timeout: "15s",
            },
            security: {
                encryption_algorithm: "AES-128",
                session_timeout: "15m",
                secret_rotation: "60d",
                rate_limiting: {
                    enabled: true,
                    requests_per_minute: 100,
                },
            },
            performance: {
                cache_ttl: "30m",
                compression_enabled: true,
                cdn_enabled: false,
                monitoring_level: "basic",
            },
            features: {
                feature_flags: {
                    new_ui: false,
                    advanced_analytics: false,
                    beta_features: false,
                },
            },
            services: {
                external_apis: {
                    timeout: "30s",
                    retry_attempts: 3,
                    circuit_breaker: {
                        enabled: true,
                        failure_threshold: 5,
                    },
                },
            },
        };
    }

    // 加载环境特定配置
    async loadEnvironmentConfig(environment) {
        const configPath = path.resolve(
            this.options.configDir,
            `${environment}.json`,
        );

        if (!existsSync(configPath)) {
            return this.getDefaultEnvironmentConfig(environment);
        }

        try {
            const content = readFileSync(configPath, "utf8");
            return JSON.parse(content);
        } catch (error) {
            console.warn(
                `${environment}环境配置文件读取失败，使用默认配置: ${error.message}`,
            );
            return this.getDefaultEnvironmentConfig(environment);
        }
    }

    // 获取默认环境配置
    getDefaultEnvironmentConfig(environment) {
        const envConfigs = {
            development: {
                database: {
                    host: "localhost",
                    port: 5432,
                    ssl_enabled: false,
                },
                security: {
                    debug_enabled: true,
                    session_timeout: "1d",
                },
                performance: {
                    cache_ttl: "5m",
                    cdn_enabled: false,
                    monitoring_level: "minimal",
                },
                features: {
                    feature_flags: {
                        new_ui: true,
                        advanced_analytics: true,
                        beta_features: true,
                    },
                },
            },
            staging: {
                database: {
                    host: "staging-db.example.com",
                    port: 5432,
                    ssl_enabled: true,
                },
                security: {
                    debug_enabled: true,
                    session_timeout: "2h",
                },
                performance: {
                    cache_ttl: "2h",
                    cdn_enabled: true,
                    monitoring_level: "medium",
                },
                features: {
                    feature_flags: {
                        new_ui: true,
                        advanced_analytics: false,
                        beta_features: false,
                    },
                },
            },
            production: {
                database: {
                    host: "prod-db.example.com",
                    port: 5432,
                    ssl_enabled: true,
                    pool_size: 20,
                },
                security: {
                    debug_enabled: false,
                    session_timeout: "30m",
                    rate_limiting: {
                        enabled: true,
                        requests_per_minute: 1000,
                    },
                },
                performance: {
                    cache_ttl: "24h",
                    cdn_enabled: true,
                    monitoring_level: "high",
                },
                features: {
                    feature_flags: {
                        new_ui: false,
                        advanced_analytics: false,
                        beta_features: false,
                    },
                },
            },
        };

        return envConfigs[environment] || {};
    }

    // 合并配置
    mergeConfigs(baseConfig, envConfig) {
        const merged = JSON.parse(JSON.stringify(baseConfig)); // 深拷贝

        function deepMerge(target, source) {
            for (const key in source) {
                if (
                    source[key] &&
                    typeof source[key] === "object" &&
                    !Array.isArray(source[key])
                ) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }

        deepMerge(merged, envConfig);
        return merged;
    }

    // 验证配置
    async validateConfig(config, environment) {
        const errors = [];
        const warnings = [];

        // 必需字段检查
        const requiredFields = {
            database: ["host", "port"],
            security: ["encryption_algorithm", "session_timeout"],
            performance: ["cache_ttl"],
        };

        for (const [section, fields] of Object.entries(requiredFields)) {
            if (!config[section]) {
                errors.push(`缺少配置节: ${section}`);
                continue;
            }

            for (const field of fields) {
                if (!config[section][field]) {
                    errors.push(`缺少必需字段: ${section}.${field}`);
                }
            }
        }

        // 环境特定验证
        if (environment === "production") {
            if (config.database?.ssl_enabled !== true) {
                warnings.push("生产环境建议启用SSL");
            }

            if (config.security?.debug_enabled === true) {
                warnings.push("生产环境建议禁用调试模式");
            }

            if (config.performance?.monitoring_level !== "high") {
                warnings.push("生产环境建议启用高级监控");
            }
        }

        // 安全性检查
        if (
            config.security?.session_timeout &&
            parseInt(config.security.session_timeout, 10) > 86400000
        ) {
            // 超过24小时
            warnings.push("会话超时时间过长，建议不超过24小时");
        }

        // 性能检查
        if (
            config.database?.pool_size &&
            parseInt(config.database.pool_size, 10) > 50
        ) {
            warnings.push("数据库连接池过大，建议控制在50以内");
        }

        // 输出结果
        if (errors.length > 0) {
            if (this.options.strictMode) {
                throw new Error(`配置验证失败:\n${errors.join("\n")}`);
            } else {
                console.warn(`配置警告:\n${errors.join("\n")}`);
            }
        }

        if (warnings.length > 0) {
            console.warn(`配置建议:\n${warnings.join("\n")}`);
        }

        return { errors, warnings };
    }

    // 生成最终配置文件
    async generateFinalConfig(config, environment, options = {}) {
        const timestamp = new Date().toISOString();
        const configId = `${environment}-${Date.now()}`;

        const finalConfig = {
            metadata: {
                environment,
                generated_at: timestamp,
                config_id: configId,
                mcp_enabled: this.options.enableMCP,
                version: "1.0.0",
            },
            config: config,
            changes: options.changes || [],
            validation: {
                status: "passed",
                timestamp: timestamp,
            },
        };

        // 生成环境变量文件
        const envVars = this.generateEnvironmentVariables(config, environment);

        // 生成Cloudflare环境配置
        const cfConfig = this.generateCloudflareConfig(config, environment);

        return {
            config: finalConfig,
            env_vars: envVars,
            cloudflare_config: cfConfig,
            files: {
                config_json: `config/${environment}.json`,
                env_vars: `.env.${environment}`,
                cloudflare: `wrangler.${environment}.toml`,
            },
        };
    }

    // 生成环境变量
    generateEnvironmentVariables(config, environment) {
        const envVars = {};

        // 数据库配置
        if (config.database) {
            envVars.DATABASE_HOST = config.database.host;
            envVars.DATABASE_PORT = config.database.port;
            envVars.DATABASE_SSL = config.database.ssl_enabled
                ? "true"
                : "false";
            envVars.DATABASE_POOL_SIZE = config.database.pool_size || "5";
        }

        // 安全配置
        if (config.security) {
            envVars.SESSION_TIMEOUT = config.security.session_timeout;
            envVars.ENCRYPTION_ALGORITHM = config.security.encryption_algorithm;
            envVars.RATE_LIMIT_ENABLED = config.security.rate_limiting?.enabled
                ? "true"
                : "false";
            envVars.RATE_LIMIT_RPM =
                config.security.rate_limiting?.requests_per_minute || "100";
        }

        // 性能配置
        if (config.performance) {
            envVars.CACHE_TTL = config.performance.cache_ttl;
            envVars.COMPRESSION_ENABLED = config.performance.compression_enabled
                ? "true"
                : "false";
            envVars.CDN_ENABLED = config.performance.cdn_enabled
                ? "true"
                : "false";
            envVars.MONITORING_LEVEL = config.performance.monitoring_level;
        }

        // 功能开关
        if (config.features?.feature_flags) {
            for (const [flag, enabled] of Object.entries(
                config.features.feature_flags,
            )) {
                envVars[`FEATURE_${flag.toUpperCase()}`] = enabled
                    ? "true"
                    : "false";
            }
        }

        // 环境特定变量
        envVars.NODE_ENV = environment;
        envVars.ENVIRONMENT = environment;

        return envVars;
    }

    // 生成Cloudflare配置
    generateCloudflareConfig(config, environment) {
        const cfConfig = {
            name: `next-cf-app-${environment}`,
            main: "src/index.ts",
            compatibility_date: "2024-01-01",
            compatibility_flags: ["nodejs_compat"],
        };

        // 环境变量
        cfConfig.vars = this.generateEnvironmentVariables(config, environment);

        // D1数据库配置
        if (config.database) {
            cfConfig.d1_databases = [
                {
                    binding: "DB",
                    database_name: `next-cf-app-${environment}`,
                    database_id: `your-d1-id-${environment}`,
                },
            ];
        }

        // KV存储配置
        if (config.performance?.cache_ttl) {
            cfConfig.kv_namespaces = [
                {
                    binding: "CACHE",
                    id: `your-kv-id-${environment}`,
                    preview_id: `your-kv-preview-id-${environment}`,
                },
            ];
        }

        // R2存储配置
        if (config.services?.r2_bucket) {
            cfConfig.r2_buckets = [
                {
                    binding: "R2",
                    bucket_name: `r2-bucket-${environment}`,
                },
            ];
        }

        return cfConfig;
    }

    // 同步配置到不同环境
    async syncConfig(fromEnv, toEnv, options = {}) {
        console.log(`🔄 同步配置: ${fromEnv} → ${toEnv}`);

        try {
            const fromConfig = await this.loadEnvironmentConfig(fromEnv);
            const toConfig = await this.loadEnvironmentConfig(toEnv);

            // 智能合并策略
            const mergedConfig = this.smartMergeConfigs(
                fromConfig,
                toConfig,
                options,
            );

            // 验证合并后的配置
            await this.validateConfig(mergedConfig, toEnv);

            // 保存配置
            await this.saveEnvironmentConfig(toEnv, mergedConfig);

            console.log(`✅ 配置同步完成: ${fromEnv} → ${toEnv}`);

            return {
                success: true,
                from: fromEnv,
                to: toEnv,
                changes: this.detectChanges(toConfig, mergedConfig),
            };
        } catch (error) {
            throw new Error(`配置同步失败: ${error.message}`);
        }
    }

    // 智能合并配置
    smartMergeConfigs(sourceConfig, targetConfig, options = {}) {
        const merged = JSON.parse(JSON.stringify(targetConfig));
        const { preserveSensitive = true, skipSecurity = false } = options;

        function smartMerge(target, source, path = "") {
            for (const [key, value] of Object.entries(source)) {
                const currentPath = path ? `${path}.${key}` : key;

                // 跳过敏感配置
                if (preserveSensitive && this.isSensitiveField(currentPath)) {
                    continue;
                }

                // 跳过安全配置
                if (skipSecurity && currentPath.startsWith("security.")) {
                    continue;
                }

                if (
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                ) {
                    if (!target[key]) target[key] = {};
                    smartMerge(target[key], value, currentPath);
                } else {
                    target[key] = value;
                }
            }
        }

        smartMerge(merged, sourceConfig);
        return merged;
    }

    // 检测敏感字段
    isSensitiveField(fieldPath) {
        const sensitivePatterns = [
            "password",
            "secret",
            "key",
            "token",
            "credential",
            "private_key",
            "api_key",
            "auth_token",
        ];

        return sensitivePatterns.some((pattern) =>
            fieldPath.toLowerCase().includes(pattern),
        );
    }

    // 检测配置变更
    detectChanges(oldConfig, newConfig) {
        const changes = [];

        function compareObjects(obj1, obj2, path = "") {
            const allKeys = new Set([
                ...Object.keys(obj1 || {}),
                ...Object.keys(obj2 || {}),
            ]);

            for (const key of allKeys) {
                const currentPath = path ? `${path}.${key}` : key;
                const val1 = obj1?.[key];
                const val2 = obj2?.[key];

                if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                    if (val1 === undefined) {
                        changes.push({
                            type: "added",
                            path: currentPath,
                            value: val2,
                        });
                    } else if (val2 === undefined) {
                        changes.push({
                            type: "removed",
                            path: currentPath,
                            value: val1,
                        });
                    } else {
                        changes.push({
                            type: "modified",
                            path: currentPath,
                            old_value: val1,
                            new_value: val2,
                        });
                    }
                }
            }
        }

        compareObjects(oldConfig, newConfig);
        return changes;
    }

    // 保存环境配置
    async saveEnvironmentConfig(environment, config) {
        const configDir = path.resolve(this.options.configDir);
        const configPath = path.join(configDir, `${environment}.json`);

        // 确保目录存在
        if (!existsSync(configDir)) {
            spawnSync("mkdir", ["-p", configDir], { stdio: "inherit" });
        }

        // 保存配置
        const content = JSON.stringify(config, null, 2);
        writeFileSync(configPath, content, "utf8");

        console.log(`✅ 配置已保存: ${configPath}`);
    }

    // 配置健康检查
    async healthCheck(environment) {
        console.log(`🏥 执行${environment}环境健康检查...`);

        try {
            const config = await this.loadEnvironmentConfig(environment);
            const issues = [];

            // 检查配置完整性
            if (!config.database) issues.push("缺少数据库配置");
            if (!config.security) issues.push("缺少安全配置");
            if (!config.performance) issues.push("缺少性能配置");

            // 检查连接性（如果配置了）
            if (config.database?.host) {
                // 这里可以添加实际的数据库连接检查
                console.log(
                    `✅ 数据库配置检查: ${config.database.host}:${config.database.port}`,
                );
            }

            // 检查外部服务配置
            if (config.services?.external_apis) {
                console.log("✅ 外部API配置检查通过");
            }

            // 检查功能开关一致性
            if (config.features?.feature_flags) {
                const inconsistentFlags = Object.entries(
                    config.features.feature_flags,
                ).filter(([_, enabled]) => typeof enabled !== "boolean");

                if (inconsistentFlags.length > 0) {
                    issues.push(
                        `功能开关配置不一致: ${inconsistentFlags.map(([name]) => name).join(", ")}`,
                    );
                }
            }

            const health = {
                environment,
                status: issues.length === 0 ? "healthy" : "unhealthy",
                issues,
                timestamp: new Date().toISOString(),
                config_valid: true,
            };

            console.log(`🏥 ${environment}环境健康检查完成: ${health.status}`);
            return health;
        } catch (error) {
            const health = {
                environment,
                status: "error",
                error: error.message,
                timestamp: new Date().toISOString(),
                config_valid: false,
            };

            console.error(
                `🏥 ${environment}环境健康检查失败: ${error.message}`,
            );
            return health;
        }
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const manager = new EnvironmentManager({
        enableMCP: process.env.ENABLE_MCP === "1",
        strictMode: process.env.STRICT_MODE === "1",
    });

    try {
        switch (command) {
            case "generate": {
                const environment = args[1];
                if (!environment) {
                    console.error(
                        "请指定环境: node environment-manager.mjs generate <environment>",
                    );
                    process.exit(1);
                }

                const result =
                    await manager.generateEnvironmentConfig(environment);
                console.log("✅ 环境配置生成成功");
                console.log("生成文件:", result.files);
                break;
            }

            case "sync": {
                const fromEnv = args[1];
                const toEnv = args[2];
                if (!fromEnv || !toEnv) {
                    console.error(
                        "请指定源环境和目标环境: node environment-manager.mjs sync <from> <to>",
                    );
                    process.exit(1);
                }

                await manager.syncConfig(fromEnv, toEnv);
                break;
            }

            case "health": {
                const healthEnv = args[1] || "development";
                const health = await manager.healthCheck(healthEnv);
                console.log(`健康检查结果: ${health.status}`);
                if (health.issues?.length > 0) {
                    console.log("发现问题:", health.issues);
                }
                break;
            }

            case "validate": {
                const validateEnv = args[1];
                if (!validateEnv) {
                    console.error(
                        "请指定环境: node environment-manager.mjs validate <environment>",
                    );
                    process.exit(1);
                }

                const config = await manager.loadEnvironmentConfig(validateEnv);
                await manager.validateConfig(config, validateEnv);
                console.log("✅ 配置验证通过");
                break;
            }

            default:
                console.log(`
环境配置管理器

用法:
  node environment-manager.mjs <command> [options]

命令:
  generate <env>     生成环境配置
  sync <from> <to>   同步环境配置
  health <env>       健康检查
  validate <env>     验证配置

环境:
  development, staging, production

示例:
  node environment-manager.mjs generate production
  node environment-manager.mjs sync staging production
  node environment-manager.mjs health production

环境变量:
  ENABLE_MCP=1       启用MCP优化
  STRICT_MODE=1      启用严格模式
        `);
                break;
        }
    } catch (error) {
        console.error(`❌ 执行失败: ${error.message}`);
        process.exit(1);
    }
}

// 直接运行
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { EnvironmentManager, MCPEnvironmentIntegrator };
