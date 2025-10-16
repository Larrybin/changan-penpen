#!/usr/bin/env node

/**
 * Smart Monitoring and Logging System
 *
 * 智能监控和日志系统
 * 集成MCP工具进行监控策略优化和异常分析
 */

// MCP监控集成器
class MCPMonitoringIntegrator {
    constructor(options = {}) {
        this.options = {
            enableMCP: process.env.ENABLE_MCP === "1" || options.enableMCP,
            strictMode: process.env.STRICT_MODE === "1" || options.strictMode,
            ...options,
        };
    }

    // 使用context7获取监控最佳实践
    async getMonitoringBestPractices(serviceType, environment) {
        if (!this.options.enableMCP) {
            return this.getFallbackMonitoringPractices(
                serviceType,
                environment,
            );
        }

        try {
            // 这里应该调用context7获取监控最佳实践
            const practices = {
                web_application: {
                    metrics: [
                        "response_time",
                        "error_rate",
                        "throughput",
                        "memory_usage",
                        "cpu_usage",
                    ],
                    alerts: {
                        response_time_p95: {
                            threshold: 2000,
                            severity: "warning",
                        },
                        error_rate: { threshold: 0.01, severity: "critical" },
                        memory_usage: { threshold: 85, severity: "warning" },
                        cpu_usage: { threshold: 80, severity: "warning" },
                    },
                    dashboards: [
                        "application_performance",
                        "error_tracking",
                        "resource_usage",
                    ],
                },
                api_service: {
                    metrics: [
                        "request_rate",
                        "response_time",
                        "error_rate",
                        "rate_limiting",
                    ],
                    alerts: {
                        request_rate_spike: {
                            threshold: 2.0,
                            severity: "warning",
                        },
                        response_time_p99: {
                            threshold: 5000,
                            severity: "critical",
                        },
                    },
                },
                database: {
                    metrics: [
                        "connection_count",
                        "query_time",
                        "deadlocks",
                        "cache_hit_ratio",
                    ],
                    alerts: {
                        connection_pool_exhaustion: {
                            threshold: 0.9,
                            severity: "critical",
                        },
                        slow_queries: { threshold: 1000, severity: "warning" },
                    },
                },
            };

            return practices[serviceType] || practices.web_application;
        } catch (error) {
            console.warn(`MCP监控最佳实践获取失败: ${error.message}`);
            return this.getFallbackMonitoringPractices(
                serviceType,
                environment,
            );
        }
    }

    getFallbackMonitoringPractices(_serviceType, _environment) {
        return {
            metrics: ["response_time", "error_rate", "throughput"],
            alerts: {
                response_time_p95: { threshold: 5000, severity: "warning" },
                error_rate: { threshold: 0.05, severity: "warning" },
            },
            dashboards: ["basic_performance"],
        };
    }

    // 使用memory记住监控模式和异常模式
    async rememberMonitoringPattern(service, metrics, anomalies) {
        if (!this.options.enableMCP) {
            return;
        }

        try {
            const _pattern = {
                service,
                metrics,
                anomalies,
                timestamp: new Date().toISOString(),
                pattern_type: "monitoring_pattern",
            };

            console.log(`记录监控模式: ${service} - ${anomalies.length}个异常`);
            // 实际MCP memory调用
        } catch (error) {
            console.warn(`MCP监控记忆失败: ${error.message}`);
        }
    }

    // 使用sequential-thinking进行异常分析和根因分析
    async analyzeAnomalies(anomalies, context) {
        if (!this.options.enableMCP) {
            return this.performBasicAnomalyAnalysis(anomalies);
        }

        try {
            console.log("🧠 执行智能异常分析...");

            // 异常分类
            const categorizedAnomalies = this.categorizeAnomalies(anomalies);

            // 根因分析
            const rootCauseAnalysis = await this.performRootCauseAnalysis(
                categorizedAnomalies,
                context,
            );

            // 生成建议
            const recommendations =
                this.generateRecommendations(rootCauseAnalysis);

            return {
                anomalies: categorizedAnomalies,
                root_cause_analysis: rootCauseAnalysis,
                recommendations,
                confidence: this.calculateAnalysisConfidence(
                    categorizedAnomalies,
                    context,
                ),
            };
        } catch (error) {
            console.warn(`MCP异常分析失败: ${error.message}`);
            return this.performBasicAnomalyAnalysis(anomalies);
        }
    }

    categorizeAnomalies(anomalies) {
        const categories = {
            performance: [],
            availability: [],
            security: [],
            resource: [],
            business: [],
        };

        for (const anomaly of anomalies) {
            if (
                anomaly.metric.includes("response_time") ||
                anomaly.metric.includes("throughput")
            ) {
                categories.performance.push(anomaly);
            } else if (
                anomaly.metric.includes("error_rate") ||
                anomaly.metric.includes("availability")
            ) {
                categories.availability.push(anomaly);
            } else if (
                anomaly.metric.includes("security") ||
                anomaly.metric.includes("auth")
            ) {
                categories.security.push(anomaly);
            } else if (
                anomaly.metric.includes("memory") ||
                anomaly.metric.includes("cpu")
            ) {
                categories.resource.push(anomaly);
            } else {
                categories.business.push(anomaly);
            }
        }

        return categories;
    }

    async performRootCauseAnalysis(categorizedAnomalies, _context) {
        const analysis = {
            primary_causes: [],
            contributing_factors: [],
            impact_assessment: {},
            correlation_analysis: {},
        };

        // 性能异常分析
        if (categorizedAnomalies.performance.length > 0) {
            analysis.primary_causes.push({
                cause: "性能瓶颈",
                confidence: 0.8,
                evidence: categorizedAnomalies.performance.map((a) => a.metric),
            });
        }

        // 可用性异常分析
        if (categorizedAnomalies.availability.length > 0) {
            analysis.primary_causes.push({
                cause: "服务不稳定",
                confidence: 0.9,
                evidence: categorizedAnomalies.availability.map(
                    (a) => a.metric,
                ),
            });
        }

        // 资源异常分析
        if (categorizedAnomalies.resource.length > 0) {
            analysis.contributing_factors.push({
                factor: "资源不足",
                confidence: 0.7,
                evidence: categorizedAnomalies.resource.map((a) => a.metric),
            });
        }

        return analysis;
    }

    generateRecommendations(rootCauseAnalysis) {
        const recommendations = [];

        for (const cause of rootCauseAnalysis.primary_causes) {
            switch (cause.cause) {
                case "性能瓶颈":
                    recommendations.push({
                        priority: "high",
                        action: "优化数据库查询和缓存策略",
                        expected_impact: "减少50%响应时间",
                        implementation_effort: "medium",
                    });
                    recommendations.push({
                        priority: "medium",
                        action: "增加CDN配置和静态资源优化",
                        expected_impact: "提升30%页面加载速度",
                        implementation_effort: "low",
                    });
                    break;
                case "服务不稳定":
                    recommendations.push({
                        priority: "critical",
                        action: "增加健康检查和自动重启机制",
                        expected_impact: "提升99.9%可用性",
                        implementation_effort: "high",
                    });
                    break;
            }
        }

        return recommendations;
    }

    calculateAnalysisConfidence(anomalies, context) {
        let confidence = 0.5; // 基础置信度

        // 基于异常数量调整
        if (anomalies.performance.length > 0) confidence += 0.2;
        if (anomalies.availability.length > 0) confidence += 0.2;
        if (anomalies.security.length > 0) confidence += 0.1;

        // 基于上下文信息调整
        if (context.deployment_recent) confidence += 0.1;
        if (context.load_increase) confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    performBasicAnomalyAnalysis(anomalies) {
        return {
            anomalies: anomalies,
            root_cause_analysis: {
                primary_causes: [
                    {
                        cause: "检测到异常指标",
                        confidence: 0.6,
                    },
                ],
            },
            recommendations: [
                {
                    priority: "medium",
                    action: "检查系统日志和配置",
                    expected_impact: "识别问题根因",
                    implementation_effort: "low",
                },
            ],
            confidence: 0.6,
        };
    }
}

class SmartMonitoringSystem {
    constructor(options = {}) {
        this.options = {
            configDir: options.configDir || "config/monitoring",
            logDir: options.logDir || "logs",
            metricsRetention: options.metricsRetention || "30d",
            enableMCP: options.enableMCP || false,
            strictMode: options.strictMode || false,
            ...options,
        };

        this.mcpIntegrator = new MCPMonitoringIntegrator({
            enableMCP: this.options.enableMCP,
            strictMode: this.options.strictMode,
        });

        this.services = ["web", "api", "database", "cache"];
        this.environments = ["development", "staging", "production"];
    }

    // 初始化监控系统
    async initializeMonitoring(environment) {
        console.log(`🚀 初始化${environment}环境监控系统...`);

        try {
            // 1. 生成监控配置
            const monitoringConfig =
                await this.generateMonitoringConfig(environment);

            // 2. 设置日志配置
            const loggingConfig = await this.generateLoggingConfig(environment);

            // 3. 配置告警规则
            const alertingConfig =
                await this.generateAlertingConfig(environment);

            // 4. 设置仪表板
            const dashboardConfig =
                await this.generateDashboardConfig(environment);

            // 5. 验证配置
            await this.validateMonitoringConfig(
                {
                    monitoring: monitoringConfig,
                    logging: loggingConfig,
                    alerting: alertingConfig,
                    dashboards: dashboardConfig,
                },
                environment,
            );

            return {
                environment,
                monitoring_config: monitoringConfig,
                logging_config: loggingConfig,
                alerting_config: alertingConfig,
                dashboard_config: dashboardConfig,
                initialized_at: new Date().toISOString(),
            };
        } catch (error) {
            throw new Error(
                `初始化${environment}环境监控系统失败: ${error.message}`,
            );
        }
    }

    // 生成监控配置
    async generateMonitoringConfig(environment) {
        const config = {
            general: {
                environment,
                retention: this.options.metricsRetention,
                sampling_rate: this.getSamplingRate(environment),
                collection_interval: this.getCollectionInterval(environment),
            },
            services: {},
        };

        // 为每个服务生成监控配置
        for (const service of this.services) {
            const bestPractices =
                await this.mcpIntegrator.getMonitoringBestPractices(
                    service,
                    environment,
                );

            config.services[service] = {
                enabled: this.isServiceEnabled(service, environment),
                metrics: bestPractices.metrics || [],
                collection: {
                    interval: config.general.collection_interval,
                    sampling: config.general.sampling_rate,
                },
                thresholds: this.adjustThresholdsForEnvironment(
                    bestPractices.alerts,
                    environment,
                ),
            };
        }

        return config;
    }

    // 生成日志配置
    async generateLoggingConfig(environment) {
        return {
            general: {
                environment,
                level: this.getLogLevel(environment),
                format: this.getLogFormat(environment),
                outputs: this.getLogOutputs(environment),
            },
            structured_logging: {
                enabled: environment !== "development",
                include_request_id: true,
                include_user_id: environment !== "development",
                include_trace_id: environment === "production",
                include_timestamp: true,
            },
            error_tracking: {
                enabled: environment !== "development",
                provider: "sentry",
                environment,
                sample_rate: this.getErrorSampleRate(environment),
            },
            audit_logging: {
                enabled: environment === "production",
                events: ["login", "logout", "data_access", "config_change"],
                retention: "7y",
            },
            performance_logging: {
                enabled: true,
                slow_query_threshold: this.getSlowQueryThreshold(environment),
                slow_request_threshold:
                    this.getSlowRequestThreshold(environment),
            },
        };
    }

    // 生成告警配置
    async generateAlertingConfig(environment) {
        const config = {
            general: {
                enabled: environment !== "development",
                evaluation_interval:
                    this.getAlertEvaluationInterval(environment),
                notification_channels:
                    this.getNotificationChannels(environment),
            },
            rules: {},
        };

        // 为每个服务生成告警规则
        for (const service of this.services) {
            const bestPractices =
                await this.mcpIntegrator.getMonitoringBestPractices(
                    service,
                    environment,
                );

            if (bestPractices.alerts) {
                config.rules[service] = Object.entries(
                    bestPractices.alerts,
                ).map(([metric, config]) => ({
                    name: `${service}_${metric}`,
                    metric,
                    threshold: config.threshold,
                    severity: config.severity,
                    evaluation_period: this.getEvaluationPeriod(
                        environment,
                        config.severity,
                    ),
                    condition: "greater_than",
                    notification_channels:
                        config.severity === "critical"
                            ? ["email", "slack"]
                            : ["email"],
                }));
            }
        }

        return config;
    }

    // 生成仪表板配置
    async generateDashboardConfig(environment) {
        return {
            general: {
                environment,
                refresh_interval: this.getDashboardRefreshInterval(environment),
                time_range: this.getDefaultTimeRange(environment),
            },
            dashboards: {
                overview: {
                    title: "系统概览",
                    widgets: [
                        {
                            type: "metric",
                            title: "总请求数",
                            metric: "total_requests",
                        },
                        {
                            type: "graph",
                            title: "响应时间趋势",
                            metric: "response_time",
                        },
                        {
                            type: "gauge",
                            title: "错误率",
                            metric: "error_rate",
                        },
                        { type: "status", title: "服务状态" },
                    ],
                },
                performance: {
                    title: "性能监控",
                    widgets: [
                        {
                            type: "graph",
                            title: "响应时间分布",
                            metric: "response_time_histogram",
                        },
                        {
                            type: "graph",
                            title: "吞吐量",
                            metric: "throughput",
                        },
                        {
                            type: "heatmap",
                            title: "API性能热点",
                            metric: "api_performance",
                        },
                    ],
                },
                infrastructure: {
                    title: "基础设施监控",
                    widgets: [
                        {
                            type: "graph",
                            title: "CPU使用率",
                            metric: "cpu_usage",
                        },
                        {
                            type: "graph",
                            title: "内存使用率",
                            metric: "memory_usage",
                        },
                        {
                            type: "graph",
                            title: "网络流量",
                            metric: "network_traffic",
                        },
                    ],
                },
                errors: {
                    title: "错误监控",
                    widgets: [
                        {
                            type: "log",
                            title: "最新错误",
                            metric: "error_logs",
                        },
                        {
                            type: "graph",
                            title: "错误趋势",
                            metric: "error_rate_trend",
                        },
                        {
                            type: "table",
                            title: "错误统计",
                            metric: "error_summary",
                        },
                    ],
                },
            },
        };
    }

    // 验证监控配置
    async validateMonitoringConfig(config, environment) {
        const errors = [];
        const warnings = [];

        // 检查必需配置
        if (!config.monitoring?.general) {
            errors.push("缺少监控基础配置");
        }

        if (!config.logging?.general) {
            errors.push("缺少日志基础配置");
        }

        // 环境特定验证
        if (environment === "production") {
            if (config.logging.error_tracking?.enabled !== true) {
                warnings.push("生产环境建议启用错误追踪");
            }

            if (config.alerting.general?.enabled !== true) {
                warnings.push("生产环境建议启用告警");
            }

            if (config.monitoring.general?.sampling_rate > 0.1) {
                warnings.push("生产环境采样率建议控制在10%以下");
            }
        }

        // 服务配置验证
        for (const service of this.services) {
            if (
                config.monitoring.services[service] &&
                !config.monitoring.services[service].metrics
            ) {
                warnings.push(`${service}服务缺少监控指标配置`);
            }
        }

        // 输出验证结果
        if (errors.length > 0) {
            if (this.options.strictMode) {
                throw new Error(`监控配置验证失败:\n${errors.join("\n")}`);
            } else {
                console.warn(`监控配置警告:\n${errors.join("\n")}`);
            }
        }

        if (warnings.length > 0) {
            console.warn(`监控配置建议:\n${warnings.join("\n")}`);
        }

        return { errors, warnings };
    }

    // 执行健康检查
    async performHealthCheck(environment) {
        console.log(`🏥 执行${environment}环境健康检查...`);

        const health = {
            environment,
            timestamp: new Date().toISOString(),
            services: {},
            overall_status: "healthy",
        };

        try {
            for (const service of this.services) {
                const serviceHealth = await this.checkServiceHealth(
                    service,
                    environment,
                );
                health.services[service] = serviceHealth;

                if (serviceHealth.status !== "healthy") {
                    health.overall_status = "degraded";
                }
            }

            // 检查系统整体状态
            health.system_checks = await this.performSystemChecks(environment);

            // 检查资源使用情况
            health.resource_usage = await this.checkResourceUsage(environment);

            console.log(
                `🏥 ${environment}环境健康检查完成: ${health.overall_status}`,
            );
            return health;
        } catch (error) {
            health.overall_status = "error";
            health.error = error.message;
            console.error(
                `🏥 ${environment}环境健康检查失败: ${error.message}`,
            );
            return health;
        }
    }

    // 检查服务健康状态
    async checkServiceHealth(service, environment) {
        const health = {
            service,
            status: "healthy",
            checks: {},
            response_time: null,
            last_check: new Date().toISOString(),
        };

        try {
            // 模拟健康检查（实际应该调用真实的服务端点）
            const endpoints = this.getServiceHealthEndpoints(
                service,
                environment,
            );

            for (const endpoint of endpoints) {
                const startTime = Date.now();

                // 这里应该发送真实的健康检查请求
                const isHealthy =
                    await this.performHealthCheckRequest(endpoint);

                const responseTime = Date.now() - startTime;
                health.checks[endpoint] = {
                    status: isHealthy ? "healthy" : "unhealthy",
                    response_time: responseTime,
                    last_check: new Date().toISOString(),
                };

                if (!isHealthy) {
                    health.status = "unhealthy";
                }

                if (
                    !health.response_time ||
                    responseTime < health.response_time
                ) {
                    health.response_time = responseTime;
                }
            }

            return health;
        } catch (error) {
            health.status = "error";
            health.error = error.message;
            return health;
        }
    }

    // 获取服务健康检查端点
    getServiceHealthEndpoints(service, environment) {
        const baseUrl = this.getServiceBaseUrl(service, environment);

        switch (service) {
            case "web":
                return [
                    `${baseUrl}/api/health`,
                    `${baseUrl}/api/health/db`,
                    `${baseUrl}/api/health/cache`,
                ];
            case "api":
                return [`${baseUrl}/health`, `${baseUrl}/health/deps`];
            case "database":
                return [`${baseUrl}/health`];
            case "cache":
                return [`${baseUrl}/health`];
            default:
                return [`${baseUrl}/health`];
        }
    }

    // 执行健康检查请求
    async performHealthCheckRequest(_endpoint) {
        // 模拟健康检查（实际应该发送HTTP请求）
        // 这里使用随机数模拟健康状态
        return Math.random() > 0.1; // 90%的概率健康
    }

    // 执行系统检查
    async performSystemChecks(environment) {
        return {
            disk_space: await this.checkDiskSpace(),
            memory_usage: await this.checkMemoryUsage(),
            cpu_usage: await this.checkCpuUsage(),
            network_connectivity: await this.checkNetworkConnectivity(),
            external_dependencies:
                await this.checkExternalDependencies(environment),
        };
    }

    // 检查资源使用情况
    async checkResourceUsage(_environment) {
        // 模拟资源使用情况检查
        return {
            cpu: {
                usage: Math.random() * 80, // 0-80%
                cores: 4,
                load_average: [1.2, 1.5, 1.8],
            },
            memory: {
                used: Math.random() * 8192, // 0-8GB
                total: 16384, // 16GB
                usage_percent: Math.random() * 60, // 0-60%
            },
            disk: {
                used: Math.random() * 100, // 0-100GB
                total: 200, // 200GB
                usage_percent: Math.random() * 50, // 0-50%
            },
        };
    }

    // 检测异常
    async detectAnomalies(environment, timeRange = "1h") {
        console.log(
            `🔍 检测${environment}环境异常 (时间范围: ${timeRange})...`,
        );

        try {
            // 获取监控数据
            const metricsData = await this.getMetricsData(
                environment,
                timeRange,
            );

            // 检测异常
            const anomalies = await this.performAnomalyDetection(metricsData);

            // MCP智能分析
            const analysis = await this.mcpIntegrator.analyzeAnomalies(
                anomalies,
                {
                    environment,
                    time_range: timeRange,
                    current_load: await this.getCurrentLoad(environment),
                },
            );

            // 记录异常模式
            if (this.options.enableMCP) {
                await this.mcpIntegrator.rememberMonitoringPattern(
                    environment,
                    metricsData,
                    anomalies,
                );
            }

            console.log(`🔍 异常检测完成: 发现 ${anomalies.length} 个异常`);

            return {
                environment,
                time_range: timeRange,
                anomalies_detected: anomalies.length,
                anomalies,
                analysis,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            throw new Error(`异常检测失败: ${error.message}`);
        }
    }

    // 执行异常检测
    async performAnomalyDetection(metricsData) {
        const anomalies = [];

        // 简单的阈值检测（实际应该使用更复杂的算法）
        for (const [metric, data] of Object.entries(metricsData)) {
            const threshold = this.getAnomalyThreshold(metric);
            const values = Array.isArray(data) ? data : [data];

            for (const value of values) {
                if (this.isAnomalous(value, threshold)) {
                    anomalies.push({
                        metric,
                        value,
                        threshold,
                        severity: this.getAnomalySeverity(value, threshold),
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        }

        return anomalies;
    }

    // 获取异常阈值
    getAnomalyThreshold(metric) {
        const thresholds = {
            response_time_p95: { warning: 2000, critical: 5000 },
            error_rate: { warning: 0.01, critical: 0.05 },
            cpu_usage: { warning: 70, critical: 90 },
            memory_usage: { warning: 80, critical: 95 },
            disk_usage: { warning: 80, critical: 95 },
            request_rate: { warning: 1000, critical: 2000 },
            throughput: { warning: 500, critical: 200 },
        };

        return thresholds[metric] || { warning: null, critical: null };
    }

    // 判断是否为异常
    isAnomalous(value, threshold) {
        if (threshold.critical && value > threshold.critical) {
            return true;
        }
        if (threshold.warning && value > threshold.warning) {
            return true;
        }
        return false;
    }

    // 获取异常严重程度
    getAnomalySeverity(value, threshold) {
        if (threshold.critical && value > threshold.critical) {
            return "critical";
        }
        if (threshold.warning && value > threshold.warning) {
            return "warning";
        }
        return "info";
    }

    // 获取监控数据
    async getMetricsData(_environment, _timeRange) {
        // 模拟获取监控数据
        return {
            response_time_p95: [Math.random() * 5000],
            error_rate: [Math.random() * 0.1],
            cpu_usage: [Math.random() * 100],
            memory_usage: [Math.random() * 100],
            request_rate: [Math.random() * 2000],
            throughput: [Math.random() * 1000],
        };
    }

    // 获取当前负载
    async getCurrentLoad(_environment) {
        return {
            requests_per_minute: Math.floor(Math.random() * 1000),
            active_connections: Math.floor(Math.random() * 100),
            queue_size: Math.floor(Math.random() * 50),
        };
    }

    // 辅助方法
    getSamplingRate(environment) {
        switch (environment) {
            case "production":
                return 0.01;
            case "staging":
                return 0.1;
            case "development":
                return 1.0;
            default:
                return 0.1;
        }
    }

    getCollectionInterval(environment) {
        switch (environment) {
            case "production":
                return 30000; // 30秒
            case "staging":
                return 60000; // 1分钟
            case "development":
                return 120000; // 2分钟
            default:
                return 60000;
        }
    }

    getLogLevel(environment) {
        switch (environment) {
            case "production":
                return "warn";
            case "staging":
                return "info";
            case "development":
                return "debug";
            default:
                return "info";
        }
    }

    getLogFormat(environment) {
        return environment === "development" ? "pretty" : "json";
    }

    getLogOutputs(environment) {
        return environment === "development"
            ? ["console"]
            : ["console", "file"];
    }

    getErrorSampleRate(environment) {
        switch (environment) {
            case "production":
                return 0.01;
            case "staging":
                return 0.1;
            case "development":
                return 1.0;
            default:
                return 0.1;
        }
    }

    isServiceEnabled(_service, _environment) {
        // 所有服务在所有环境都启用
        return true;
    }

    adjustThresholdsForEnvironment(alerts, environment) {
        const adjusted = {};

        for (const [metric, config] of Object.entries(alerts)) {
            let multiplier = 1.0;

            switch (environment) {
                case "production":
                    multiplier = 0.8; // 更严格的阈值
                    break;
                case "staging":
                    multiplier = 1.2; // 更宽松的阈值
                    break;
                case "development":
                    multiplier = 2.0; // 最宽松的阈值
                    break;
            }

            adjusted[metric] = {
                ...config,
                threshold: config.threshold * multiplier,
            };
        }

        return adjusted;
    }

    getNotificationChannels(environment) {
        switch (environment) {
            case "production":
                return ["email", "slack", "pagerduty"];
            case "staging":
                return ["email", "slack"];
            case "development":
                return ["console"];
            default:
                return ["email"];
        }
    }

    getAlertEvaluationInterval(environment) {
        switch (environment) {
            case "production":
                return 60000; // 1分钟
            case "staging":
                return 300000; // 5分钟
            case "development":
                return 600000; // 10分钟
            default:
                return 300000;
        }
    }

    getEvaluationPeriod(environment, severity) {
        switch (severity) {
            case "critical":
                return environment === "production" ? 1 : 2;
            case "warning":
                return environment === "production" ? 3 : 5;
            default:
                return 5;
        }
    }

    getDashboardRefreshInterval(environment) {
        switch (environment) {
            case "production":
                return 30000; // 30秒
            case "staging":
                return 60000; // 1分钟
            case "development":
                return 120000; // 2分钟
            default:
                return 60000;
        }
    }

    getDefaultTimeRange(environment) {
        switch (environment) {
            case "production":
                return "1h";
            case "staging":
                return "6h";
            case "development":
                return "24h";
            default:
                return "1h";
        }
    }

    getServiceBaseUrl(_service, environment) {
        const baseUrl =
            process.env[`NEXT_PUBLIC_APP_URL_${environment.toUpperCase()}`] ||
            "http://localhost:3000";
        return baseUrl;
    }

    getSlowQueryThreshold(environment) {
        switch (environment) {
            case "production":
                return 1000; // 1秒
            case "staging":
                return 2000; // 2秒
            case "development":
                return 5000; // 5秒
            default:
                return 2000;
        }
    }

    getSlowRequestThreshold(environment) {
        switch (environment) {
            case "production":
                return 2000; // 2秒
            case "staging":
                return 5000; // 5秒
            case "development":
                return 10000; // 10秒
            default:
                return 5000;
        }
    }

    // 模拟系统检查方法
    async checkDiskSpace() {
        return { usage: Math.random() * 80, available: Math.random() * 100 };
    }

    async checkMemoryUsage() {
        return { usage: Math.random() * 80, available: Math.random() * 8192 };
    }

    async checkCpuUsage() {
        return { usage: Math.random() * 80, load: [1.2, 1.5, 1.8] };
    }

    async checkNetworkConnectivity() {
        return { status: "connected", latency: Math.random() * 100 };
    }

    async checkExternalDependencies(_environment) {
        return {
            database: { status: "connected", latency: Math.random() * 50 },
            cache: { status: "connected", latency: Math.random() * 10 },
            external_apis: {
                status: "connected",
                latency: Math.random() * 200,
            },
        };
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const monitoring = new SmartMonitoringSystem({
        enableMCP: process.env.ENABLE_MCP === "1",
        strictMode: process.env.STRICT_MODE === "1",
    });

    try {
        switch (command) {
            case "init": {
                const environment = args[1] || "development";
                const config =
                    await monitoring.initializeMonitoring(environment);
                console.log("✅ 监控系统初始化成功");
                console.log("环境:", config.environment);
                break;
            }

            case "health": {
                const healthEnv = args[1] || "development";
                const health = await monitoring.performHealthCheck(healthEnv);
                console.log(`健康检查结果: ${health.overall_status}`);
                break;
            }

            case "detect": {
                const detectEnv = args[1] || "development";
                const timeRange = args[2] || "1h";
                const anomalies = await monitoring.detectAnomalies(
                    detectEnv,
                    timeRange,
                );
                console.log(
                    `异常检测完成: 发现 ${anomalies.anomalies_detected} 个异常`,
                );
                break;
            }

            default:
                console.log(`
智能监控系统

用法:
  node smart-monitoring.mjs <command> [options]

命令:
  init <env>        初始化监控系统
  health <env>      执行健康检查
  detect <env> <range>  检测异常

环境:
  development, staging, production

示例:
  node smart-monitoring.mjs init production
  node smart-monitoring.mjs health staging
  node smart-monitoring.mjs detect production 1h

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

export { SmartMonitoringSystem, MCPMonitoringIntegrator };
