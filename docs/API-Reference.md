# API参考文档

> 智能化DevOps系统API完整参考

## 📋 目录

- [核心类API](#核心类api)
- [环境管理API](#环境管理api)
- [监控API](#监控api)
- [MCP集成API](#mcp集成api)
- [配置API](#配置api)
- [工具类API](#工具类api)

---

## 🏗️ 核心类API

### SmartQualitySession

智能质量检查会话类，负责协调整个检查流程。

#### 构造函数

```javascript
new SmartQualitySession(options)
```

**参数**:
- `options` (Object): 配置选项
  - `enableMCP` (Boolean): 是否启用MCP集成，默认 `false`
  - `strictMode` (Boolean): 是否启用严格模式，默认 `false`
  - `timeConstraints` (Object): 时间约束配置
  - `maxDuration` (Number): 最大执行时间(毫秒)

**示例**:
```javascript
const session = new SmartQualitySession({
  enableMCP: true,
  strictMode: true,
  timeConstraints: {
    maxDuration: 300000 // 5分钟
  }
});
```

#### 方法

##### initialize()

初始化检查会话。

**语法**:
```javascript
await session.initialize()
```

**返回值**: `Promise<void>`

**示例**:
```javascript
await session.initialize();
console.log('会话初始化完成');
```

##### analyzeChanges(changedFiles)

分析文件变更并生成检查策略。

**语法**:
```javascript
await session.analyzeChanges(changedFiles)
```

**参数**:
- `changedFiles` (Array<string>): 变更的文件列表

**返回值**: `Promise<Object>`
- `riskScore` (Number): 风险评分 (0-1)
- `strategy` (Object): 检查策略
- `parallelJobs` (Array<string>): 并行执行的job列表

**示例**:
```javascript
const files = ['src/app/page.tsx', 'src/components/Button.tsx'];
const analysis = await session.analyzeChanges(files);
console.log(`风险评分: ${analysis.riskScore}`);
```

##### executeSmartCheck()

执行智能质量检查。

**语法**:
```javascript
await session.executeSmartCheck()
```

**返回值**: `Promise<Object>`
- `summary` (Object): 检查摘要
- `details` (Array): 详细检查结果
- `recommendations` (Array): 优化建议

**示例**:
```javascript
const result = await session.executeSmartCheck();
console.log(`总步骤: ${result.summary.totalSteps}`);
console.log(`成功: ${result.summary.successCount}`);
```

### EnvironmentManager

环境配置管理器，负责多环境配置生成和管理。

#### 构造函数

```javascript
new EnvironmentManager(options)
```

**参数**:
- `options` (Object): 配置选项
  - `configDir` (String): 配置文件目录，默认 `'config/environments'`
  - `baseConfigFile` (String): 基础配置文件路径
  - `strictMode` (Boolean): 是否启用严格模式
  - `enableMCP` (Boolean): 是否启用MCP集成

**示例**:
```javascript
const manager = new EnvironmentManager({
  configDir: 'config/environments',
  enableMCP: true,
  strictMode: false
});
```

#### 方法

##### generateEnvironmentConfig(environment, options)

生成指定环境的配置。

**语法**:
```javascript
await manager.generateEnvironmentConfig(environment, options)
```

**参数**:
- `environment` (String): 环境名称 (`development`, `staging`, `production`)
- `options` (Object): 生成选项
  - `changes` (Array): 配置变更列表
  - `validate` (Boolean): 是否验证配置，默认 `true`

**返回值**: `Promise<Object>`
- `config` (Object): 完整配置对象
- `env_vars` (Object): 环境变量映射
- `cloudflare_config` (Object): Cloudflare配置
- `files` (Object): 生成文件路径

**示例**:
```javascript
const result = await manager.generateEnvironmentConfig('production');
console.log('配置文件:', result.files);
```

##### validateConfig(config, environment)

验证配置的完整性和正确性。

**语法**:
```javascript
await manager.validateConfig(config, environment)
```

**参数**:
- `config` (Object): 配置对象
- `environment` (String): 环境名称

**返回值**: `Promise<Object>`
- `errors` (Array): 错误列表
- `warnings` (Array): 警告列表

**示例**:
```javascript
const validation = await manager.validateConfig(config, 'production');
if (validation.errors.length > 0) {
  console.error('配置错误:', validation.errors);
}
```

##### syncConfig(fromEnv, toEnv, options)

同步两个环境之间的配置。

**语法**:
```javascript
await manager.syncConfig(fromEnv, toEnv, options)
```

**参数**:
- `fromEnv` (String): 源环境
- `toEnv` (String): 目标环境
- `options` (Object): 同步选项
  - `preserveSensitive` (Boolean): 是否保留敏感配置
  - `skipSecurity` (Boolean): 是否跳过安全配置

**返回值**: `Promise<Object>`
- `success` (Boolean): 同步是否成功
- `from` (String): 源环境
- `to` (String): 目标环境
- `changes` (Array): 变更列表

**示例**:
```javascript
const syncResult = await manager.syncConfig('staging', 'production', {
  preserveSensitive: true
});
console.log('同步结果:', syncResult);
```

##### healthCheck(environment)

执行环境健康检查。

**语法**:
```javascript
await manager.healthCheck(environment)
```

**参数**:
- `environment` (String): 环境名称

**返回值**: `Promise<Object>`
- `environment` (String): 环境名称
- `status` (String): 健康状态 (`healthy`, `unhealthy`, `error`)
- `issues` (Array): 发现的问题列表
- `timestamp` (String): 检查时间

**示例**:
```javascript
const health = await manager.healthCheck('production');
console.log(`健康状态: ${health.status}`);
if (health.issues.length > 0) {
  console.log('发现问题:', health.issues);
}
```

### SmartMonitoringSystem

智能监控系统，负责监控配置和异常检测。

#### 构造函数

```javascript
new SmartMonitoringSystem(options)
```

**参数**:
- `options` (Object): 配置选项
  - `configDir` (String): 监控配置目录
  - `logDir` (String): 日志目录
  - `metricsRetention` (String): 指标保留时间
  - `enableMCP` (Boolean): 是否启用MCP集成

**示例**:
```javascript
const monitoring = new SmartMonitoringSystem({
  enableMCP: true,
  metricsRetention: '30d'
});
```

#### 方法

##### initializeMonitoring(environment)

初始化指定环境的监控系统。

**语法**:
```javascript
await monitoring.initializeMonitoring(environment)
```

**参数**:
- `environment` (String): 环境名称

**返回值**: `Promise<Object>`
- `environment` (String): 环境名称
- `monitoring_config` (Object): 监控配置
- `logging_config` (Object): 日志配置
- `alerting_config` (Object): 告警配置
- `initialized_at` (String): 初始化时间

**示例**:
```javascript
const config = await monitoring.initializeMonitoring('production');
console.log('监控配置生成完成');
```

##### performHealthCheck(environment)

执行系统健康检查。

**语法**:
```javascript
await monitoring.performHealthCheck(environment)
```

**参数**:
- `environment` (String): 环境名称

**返回值**: `Promise<Object>`
- `environment` (String): 环境名称
- `timestamp` (String): 检查时间
- `services` (Object): 各服务健康状态
- `system_checks` (Object): 系统检查结果
- `overall_status` (String): 整体状态

**示例**:
```javascript
const health = await monitoring.performHealthCheck('production');
console.log(`整体状态: ${health.overall_status}`);
```

##### detectAnomalies(environment, timeRange)

检测指定环境的异常。

**语法**:
```javascript
await monitoring.detectAnomalies(environment, timeRange)
```

**参数**:
- `environment` (String): 环境名称
- `timeRange` (String): 时间范围 (`1h`, `6h`, `24h`)

**返回值**: `Promise<Object>`
- `environment` (String): 环境名称
- `time_range` (String): 时间范围
- `anomalies_detected` (Number): 检测到的异常数量
- `anomalies` (Array): 异常详情列表
- `analysis` (Object): MCP分析结果

**示例**:
```javascript
const anomalies = await monitoring.detectAnomalies('production', '1h');
console.log(`检测到 ${anomalies.anomalies_detected} 个异常`);
```

---

## 🌍 环境管理API

### 支持的环境

- `development`: 开发环境
- `staging`: 预发布环境
- `production`: 生产环境

### 配置类型

每个环境支持以下配置类型：

#### Database (数据库配置)

```javascript
{
  "type": "postgresql",
  "host": "${DATABASE_HOST}",
  "port": 5432,
  "ssl_enabled": true,
  "pool_size": 20,
  "timeout": "15s"
}
```

#### Security (安全配置)

```javascript
{
  "encryption_algorithm": "AES-256-GCM",
  "session_timeout": "30m",
  "rate_limiting": {
    "enabled": true,
    "requests_per_minute": 1000
  }
}
```

#### Performance (性能配置)

```javascript
{
  "cache_ttl": "24h",
  "compression_enabled": true,
  "cdn_enabled": true,
  "monitoring_level": "high"
}
```

#### Features (功能开关)

```javascript
{
  "feature_flags": {
    "new_ui": false,
    "beta_features": false,
    "debug_mode": false
  }
}
```

---

## 📊 监控API

### 监控服务

系统支持以下服务的监控：

- `web`: Web应用服务
- `api`: API服务
- `database`: 数据库服务
- `cache`: 缓存服务

### 监控指标

#### 核心指标

| 指标名称 | 类型 | 单位 | 默认阈值 |
|---------|------|------|----------|
| response_time_p95 | 延迟 | ms | 2000 |
| error_rate | 比率 | % | 1 |
| throughput | 吞吐量 | req/min | 1000 |
| cpu_usage | 资源 | % | 80 |
| memory_usage | 资源 | % | 85 |

#### 自定义指标

```javascript
{
  "custom_metrics": {
    "business_conversion_rate": {
      "threshold": 0.05,
      "severity": "warning"
    },
    "user_satisfaction_score": {
      "threshold": 4.0,
      "severity": "critical"
    }
  }
}
```

### 告警配置

#### 告警级别

- `critical`: 严重告警，立即通知
- `warning`: 警告告警，定时通知
- `info`: 信息告警，记录日志

#### 告警渠道

- `email`: 邮件通知
- `slack`: Slack通知
- `pagerduty`: 紧急通知

---

## 🧠 MCP集成API

### Context7集成

#### 获取最佳实践

```javascript
await mcpIntegrator.getBestPractices(serviceType, environment)
```

**参数**:
- `serviceType` (String): 服务类型 (`web_application`, `api_service`, `database`)
- `environment` (String): 环境名称

**返回值**: `Promise<Object>` 最佳实践配置

### Memory集成

#### 记录模式

```javascript
await mcpIntegrator.rememberPattern(type, data)
```

**参数**:
- `type` (String): 模式类型 (`config_change`, `build_failure`, `anomaly`)
- `data` (Object): 模式数据

### Sequential-thinking集成

#### 优化策略

```javascript
await mcpIntegrator.optimizeStrategy(context, options)
```

**参数**:
- `context` (Object): 上下文信息
- `options` (Object): 优化选项

---

## ⚙️ 配置API

### 质量门禁配置

#### 基础门禁 (Basic)

```javascript
{
  "basic": {
    "name": "基础质量门禁",
    "checks": {
      "biome": { "enabled": true },
      "typescript": { "enabled": true },
      "tests": { "enabled": false }
    }
  }
}
```

#### 标准门禁 (Standard)

```javascript
{
  "standard": {
    "name": "标准质量门禁",
    "checks": {
      "biome": { "enabled": true, "errorOnWarnings": true },
      "typescript": { "enabled": true, "strict": true },
      "tests": { "enabled": true, "coverage": true }
    }
  }
}
```

#### 严格门禁 (Strict)

```javascript
{
  "strict": {
    "name": "严格质量门禁",
    "checks": {
      "biome": { "enabled": true, "errorOnWarnings": true },
      "typescript": { "enabled": true, "strict": true },
      "tests": { "enabled": true, "coverage": { "lines": 80 } },
      "security": { "enabled": true },
      "performance": { "enabled": true }
    }
  }
}
```

### 环境变量

#### 通用变量

- `NODE_ENV`: 运行环境
- `ENVIRONMENT`: 环境名称
- `ENABLE_MCP`: MCP开关
- `STRICT_MODE`: 严格模式开关

#### 服务特定变量

```bash
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_SSL=false

# 安全配置
ENCRYPTION_ALGORITHM=AES-256-GCM
SESSION_TIMEOUT=30m

# 性能配置
CACHE_TTL=24h
COMPRESSION_ENABLED=true
```

---

## 🛠️ 工具类API

### 文件操作工具

#### readConfigFile(filePath)

读取配置文件。

```javascript
const config = await readConfigFile('config/environments/production.json');
```

#### writeConfigFile(filePath, data)

写入配置文件。

```javascript
await writeConfigFile('config/environments/production.json', config);
```

### 验证工具

#### validateEnvironment(env)

验证环境名称。

```javascript
const isValid = validateEnvironment('production'); // true
```

#### validateConfigStructure(config)

验证配置结构。

```javascript
const result = await validateConfigStructure(config);
```

### 日志工具

#### createLogger(options)

创建日志记录器。

```javascript
const logger = createLogger({
  level: 'info',
  format: 'json',
  outputs: ['console']
});
```

#### log(message, level)

记录日志。

```javascript
logger.log('系统启动成功', 'info');
```

---

## 📝 错误处理

### 常见错误类型

#### ConfigurationError

配置相关错误。

```javascript
try {
  const config = await manager.generateEnvironmentConfig('production');
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('配置错误:', error.message);
  }
}
```

#### ValidationError

验证相关错误。

```javascript
try {
  await manager.validateConfig(config, 'production');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('验证错误:', error.details);
  }
}
```

#### MonitoringError

监控相关错误。

```javascript
try {
  await monitoring.detectAnomalies('production', '1h');
} catch (error) {
  if (error instanceof MonitoringError) {
    console.error('监控错误:', error.message);
  }
}
```

### 错误恢复

#### 降级模式

当MCP工具不可用时，系统自动切换到降级模式：

```javascript
// 系统自动处理
if (!mcpAvailable) {
  console.warn('MCP工具不可用，使用降级模式');
  return fallbackImplementation();
}
```

#### 重试机制

关键操作支持自动重试：

```javascript
const result = await retryOperation(async () => {
  return await manager.generateEnvironmentConfig('production');
}, { maxAttempts: 3, delay: 1000 });
```

---

## 🔧 调试API

### 调试模式

启用详细日志输出：

```javascript
const session = new SmartQualitySession({
  enableMCP: true,
  debug: true,
  verbose: true
});
```

### 状态检查

#### 检查系统状态

```javascript
const status = await session.checkSystemStatus();
console.log('系统状态:', status);
```

#### 检查MCP连接

```javascript
const mcpStatus = await session.checkMCPStatus();
console.log('MCP状态:', mcpStatus);
```

### 性能分析

#### 获取性能指标

```javascript
const metrics = await session.getPerformanceMetrics();
console.log('性能指标:', metrics);
```

#### 分析执行时间

```javascript
const timing = await session.analyzeTiming();
console.log('执行时间分析:', timing);
```

---

## 📚 示例代码

### 完整的使用示例

```javascript
import { SmartQualitySession, EnvironmentManager, SmartMonitoringSystem } from './scripts/lib';

async function main() {
  try {
    // 1. 初始化环境管理器
    const envManager = new EnvironmentManager({
      enableMCP: true,
      strictMode: false
    });

    // 2. 生成生产环境配置
    const prodConfig = await envManager.generateEnvironmentConfig('production');
    console.log('生产环境配置生成完成');

    // 3. 验证配置
    await envManager.validateConfig(prodConfig.config, 'production');

    // 4. 初始化监控系统
    const monitoring = new SmartMonitoringSystem({
      enableMCP: true
    });

    // 5. 初始化生产环境监控
    await monitoring.initializeMonitoring('production');

    // 6. 执行健康检查
    const health = await monitoring.performHealthCheck('production');
    console.log(`健康状态: ${health.overall_status}`);

    // 7. 初始化质量检查会话
    const qualitySession = new SmartQualitySession({
      enableMCP: true,
      strictMode: true
    });

    await qualitySession.initialize();

    // 8. 分析变更
    const analysis = await qualitySession.analyzeChanges([
      'src/app/page.tsx',
      'src/components/Button.tsx'
    ]);

    // 9. 执行智能检查
    const result = await qualitySession.executeSmartCheck();
    console.log(`检查结果: ${result.summary.successCount}/${result.summary.totalSteps} 成功`);

  } catch (error) {
    console.error('执行失败:', error.message);
    process.exit(1);
  }
}

main();
```

---

*本文档持续更新中，最后更新时间: 2025-10-16*