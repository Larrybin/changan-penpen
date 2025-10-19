# 故障排除指南

> 智能化DevOps系统常见问题解决方案

## 📋 目录

- [快速诊断](#快速诊断)
- [MCP工具问题](#mcp工具问题)
- [代码质量检查问题](#代码质量检查问题)
- [Git提交问题](#git提交问题)
- [CI/CD流水线问题](#cicd流水线问题)
- [环境配置问题](#环境配置问题)
- [监控和日志问题](#监控和日志问题)
- [性能优化问题](#性能优化问题)
- [网络和连接问题](#网络和连接问题)
- [常见错误代码](#常见错误代码)

---

## 🔍 快速诊断

### 系统健康检查

运行完整的系统健康检查：

```bash
# 检查所有组件状态
pnpm run env:health
pnpm run monitor:health
ENABLE_MCP=1 pnpm run smart-check:all --dry-run
```

### 检查配置状态

```bash
# 验证所有环境配置
pnpm run env:validate development
pnpm run env:validate staging
pnpm run env:validate production
```

### 检查依赖状态

```bash
# 检查Node.js和npm依赖
node --version
pnpm --version
pnpm list --depth=0
```

---

## 🧠 MCP工具问题

### 问题1: MCP工具连接失败

**症状**:
```
❌ MCP工具连接失败
Error: Entity with name undefined not found
```

**原因分析**:
- MCP工具服务未启动
- 网络连接问题
- 配置错误

**解决方案**:

#### 方案1: 检查MCP服务状态

```bash
# 检查MCP工具状态
echo "检查MCP工具连接..."

# 检查环境变量
echo "ENABLE_MCP: $ENABLE_MCP"
echo "MCP_SERVER_URL: $MCP_SERVER_URL"
```

#### 方案2: 使用降级模式

```bash
# 禁用MCP使用降级模式
ENABLE_MCP=0 pnpm run smart-check:all
```

#### 方案3: 重置MCP配置

```bash
# 清理MCP缓存
rm -rf .mcp-cache
rm -rf .mcp-temp

# 重新初始化
ENABLE_MCP=1 pnpm run smart-check:all
```

### 问题2: Memory工具存储失败

**症状**:
```
❌ Memory存储失败
Error: Failed to store data to memory entity
```

**解决方案**:

#### 方案1: 使用本地文件备份

```javascript
// 系统自动切换到本地文件存储
const useLocalFileBackup = true;
```

#### 方案2: 检查权限设置

```bash
# 检查文件权限
ls -la .mcp-data/
chmod 755 .mcp-data/
```

### 问题3: Sequential-thinking超时

**症状**:
```
❌ Sequential-thinking分析超时
Error: Analysis timeout after 30 seconds
```

**解决方案**:

#### 方案1: 增加超时时间

```bash
# 设置更长的超时时间
export SEQUENTIAL_THINKING_TIMEOUT=60000
```

#### 方案2: 简化分析任务

```bash
# 使用简化模式
ENABLE_MCP=1 pnpm run smart-check:all --simple
```

---

## 🔍 代码质量检查问题

### 问题1: Biome检查失败

**症状**:
```
❌ Biome检查失败
Error: Unexpected token, expected ";"
```

**解决方案**:

#### 方案1: 自动修复

```bash
# 自动修复代码格式问题
pnpm exec biome check . --write
```

#### 方案2: 检查配置文件

```bash
# 验证Biome配置
pnpm exec biome check --config-path biome.json
```

#### 方案3: 清理缓存

```bash
# 清理Biome缓存
rm -rf node_modules/.cache/biome
pnpm run smart-check:all
```

### 问题2: TypeScript类型检查失败

**症状**:
```
❌ TypeScript类型检查失败
Error: Type 'string' is not assignable to type 'number'
```

**解决方案**:

#### 方案1: 检查类型定义

```bash
# 详细类型检查输出
pnpm exec tsc --noEmit --pretty
```

#### 方案2: 生成类型声明

```bash
# 重新生成类型声明
pnpm run cf-typegen
```

#### 方案3: 检查import路径

```bash
# 检查import路径配置
pnpm exec tsc --noEmit --showConfig
```

### 问题3: 测试覆盖率不足

**症状**:
```
❌ 测试覆盖率不足
Error: Coverage below threshold
Lines: 45% (threshold: 70%)
```

**解决方案**:

#### 方案1: 调整覆盖率阈值

1. 更新 `vitest.config.ts` 中 `coverage.thresholds` 的数值，例如将 `lines` 下调至 `50`。
2. 在 `docs/quality-gates.md` 标注新的阈值，方便团队同步期望。

#### 方案2: 跳过覆盖率检查

```bash
# 临时跳过覆盖率检查
export SKIP_COVERAGE_CHECK=1
pnpm run smart-check:all
```

---

## 🚀 Git提交问题

### 问题1: 智能提交生成失败

**症状**:
```
❌ 智能提交生成失败
Error: Failed to generate commit message
```

**解决方案**:

#### 方案1: 检查Git状态

```bash
# 检查Git仓库状态
git status
git diff --cached
```

#### 方案2: 手动提交

```bash
# 使用传统提交方式
git add .
git commit -m "手动提交信息"
```

#### 方案3: 重新生成提交信息

```bash
# 清理缓存并重新生成
rm -rf .git-commit-cache
pnpm run smart-push
```

### 问题2: 冲突检测错误

**症状**:
```
❌ 冲突检测失败
Error: Failed to simulate rebase
```

**解决方案**:

#### 方案1: 跳过冲突检测

```bash
# 跳过冲突检测
export ENABLE_CONFLICT_DETECTION=0
pnpm run smart-push
```

#### 方案2: 手动解决冲突

```bash
# 手动合并冲突
git pull --rebase
git add .
git rebase --continue
```

### 问题3: 提交信息格式错误

**症状**:
```
❌ 提交信息格式错误
Error: Invalid commit message format
```

**解决方案**:

#### 方案1: 检查Conventional Commits规范

```bash
# 验证提交信息格式
echo "feat(component): add new feature" | git commit-template -F -
```

#### 方案2: 使用预定义模板

```bash
# 使用预定义模板
git commit -m "chore: update dependencies"
```

---

## 🔄 CI/CD流水线问题

### 问题1: GitHub Actions工作流失败

**症状**:
```
❌ GitHub Actions工作流失败
Error: Process exited with code 1
```

**解决方案**:

#### 方案1: 检查工作流日志

```bash
# 查看详细日志
gh run view --log
```

#### 方案2: 重新触发工作流

```bash
# 手动重新触发
gh workflow run smart-ci.yml
```

#### 方案3: 检查权限配置

```bash
# 检查仓库权限
gh auth status
gh repo edit --enable-actions=true
```

### 问题2: 部署失败

**症状**:
```
❌ 部署失败
Error: Wrangler deployment failed
```

**解决方案**:

#### 方案1: 检查Cloudflare配置

```bash
# 验证Wrangler配置
wrangler whoami
wrangler env list
```

#### 方案2: 检查环境变量

```bash
# 列出环境变量
wrangler secret list
```

#### 方案3: 本地测试部署

```bash
# 本地测试部署
pnpm run build:cf
wrangler dev
```

### 问题3: 质量检查不通过

**症状**:
```
❌ 质量检查不通过
Error: Quality gate failed
```

**解决方案**:

#### 方案1: 降低质量标准

```yaml
# smart-ci.yml
env:
  QUALITY_STRATEGY: basic
```

#### 方案2: 强制部署

```yaml
# smart-deploy.yml
inputs:
  force_deploy:
    description: '强制部署'
    default: true
```

---

## 🌍 环境配置问题

### 问题1: 环境变量缺失

**症状**:
```
❌ 环境变量缺失
Error: Environment variable not set: DATABASE_HOST
```

**解决方案**:

#### 方案1: 检查环境文件

```bash
# 检查环境变量文件
cat .env.production
```

#### 方案2: 设置缺失变量

```bash
# 设置环境变量
export DATABASE_HOST=your-db-host
export DATABASE_PORT=5432
```

#### 方案3: 重新生成配置

```bash
# 重新生成环境配置
pnpm run env:generate production
```

### 问题2: 配置验证失败

**症状**:
```
❌ 配置验证失败
Error: Missing required field: database.host
```

**解决方案**:

#### 方案1: 检查配置文件

```bash
# 验证配置文件语法
cat config/environments/production.json | jq .
```

#### 方案2: 使用默认配置

```bash
# 使用基础配置
cp config/environments/base.json config/environments/production.json
```

#### 方案3: 修复配置错误

```bash
# 手动修复配置
pnpm run env:validate production --fix
```

### 问题3: 配置同步失败

**症状**:
```
❌ 配置同步失败
Error: Configuration sync failed
```

**解决方案**:

#### 方案1: 检查源配置

```bash
# 验证源环境配置
pnpm run env:health staging
```

#### 方案2: 跳过敏感配置

```bash
# 跳过敏感信息同步
pnpm run env:sync staging production --skip-security
```

---

## 📊 监控和日志问题

### 问题1: 监控初始化失败

**症状**:
```
❌ 监控初始化失败
Error: Monitoring initialization failed
```

**解决方案**:

#### 方案1: 检查监控配置

```bash
# 验证监控配置
pnpm run monitor:init production --dry-run
```

#### 方案2: 使用基础监控

```bash
# 使用基础监控配置
pnpm run monitor:init production --basic
```

#### 方案3: 检查权限

```bash
# 检查监控服务权限
ls -la logs/
chmod 755 logs/
```

### 问题2: 健康检查失败

**症状**:
```
❌ 健康检查失败
Error: Service unhealthy
```

**解决方案**:

#### 方案1: 检查服务状态

```bash
# 检查各个服务状态
curl -f http://localhost:3000/api/v1/health
```

#### 方案2: 重启服务

```bash
# 重启相关服务
pnpm run dev:restart
```

#### 方案3: 检查依赖服务

```bash
# 检查数据库连接
psql -h localhost -U postgres -c "SELECT 1"
```

### 问题3: 异常检测错误

**症状**:
```
❌ 异常检测错误
Error: Anomaly detection failed
```

**解决方案**:

#### 方案1: 缩短时间范围

```bash
# 使用更短的时间范围
pnpm run monitor:detect production 5m
```

#### 方案2: 检查数据源

```bash
# 验证监控数据源
curl -f http://localhost:3000/api/metrics
```

---

## ⚡ 性能优化问题

### 问题1: 构建速度慢

**症状**:
```
⚠️ 构建速度慢
Build time: 15 minutes
```

**解决方案**:

#### 方案1: 启用缓存

```bash
# 清理并重建缓存
rm -rf .next/cache
pnpm run build
```

#### 方案2: 增加并行度

```bash
# 增加构建并行度
export NODE_OPTIONS="--max-old-space-size=8192"
export BUILD_PARALLEL=true
```

#### 方案3: 优化依赖

```bash
# 优化依赖安装
pnpm install --prefer-frozen-lockfile
```

### 问题2: 内存使用过高

**症状**:
```
⚠️ 内存使用过高
Memory usage: 95%
```

**解决方案**:

#### 方案1: 增加内存限制

```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=8192"
```

#### 方案2: 优化垃圾回收

```bash
# 优化垃圾回收
export NODE_OPTIONS="--max-old-space-size=4096 --expose-gc"
```

#### 方案3: 减少并行任务

```bash
# 减少并行执行
export BUILD_PARALLEL=false
```

### 问题3: 网络请求超时

**症状**:
```
⚠️ 网络请求超时
Error: Request timeout after 30s
```

**解决方案**:

#### 方案1: 增加超时时间

```bash
# 增加网络超时
export FETCH_TIMEOUT=60000
```

#### 方案2: 使用代理

```bash
# 设置网络代理
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

---

## 🌐 网络和连接问题

### 问题1: 网络连接失败

**症状**:
```
❌ 网络连接失败
Error: getaddrinfo ENOTFOUND
```

**解决方案**:

#### 方案1: 检查网络连接

```bash
# 检查DNS解析
nslookup google.com

# 检查网络连接
ping 8.8.8.8
```

#### 方案2: 检查防火墙

```bash
# 检查防火墙规则
sudo ufw status
```

#### 方案3: 使用镜像

```bash
# 使用国内镜像
export NPM_REGISTRY=https://registry.npmmirror.com
```

### 问题2: API请求失败

**症状**:
```
❌ API请求失败
Error: 503 Service Unavailable
```

**解决方案**:

#### 方案1: 检查API状态

```bash
# 检查API状态
curl -I https://api.example.com/health
```

#### 方案2: 重试机制

```bash
# 启用重试机制
export API_RETRY_COUNT=3
export API_RETRY_DELAY=1000
```

#### 方案3: 降级处理

```bash
# 使用降级API
export API_FALLBACK_URL=https://backup-api.example.com
```

---

## ❌ 常见错误代码

### 错误代码: 1001

**错误**: `MCP_CONNECTION_FAILED`

**描述**: MCP工具连接失败

**解决方案**:
```bash
# 检查MCP服务状态
curl -f http://localhost:3001/mcp/health

# 使用降级模式
ENABLE_MCP=0 pnpm run smart-check:all
```

### 错误代码: 1002

**错误**: `CONFIG_VALIDATION_FAILED`

**描述**: 配置验证失败

**解决方案**:
```bash
# 重新生成配置
pnpm run env:generate production

# 跳过验证
export SKIP_CONFIG_VALIDATION=1
```

### 错误代码: 1003

**错误**: `BUILD_TIMEOUT`

**描述**: 构建超时

**解决方案**:
```bash
# 增加超时时间
export BUILD_TIMEOUT=600000

# 清理缓存
rm -rf .next/cache
```

### 错误代码: 1004

**错误**: `DEPLOYMENT_FAILED`

**描述**: 部署失败

**解决方案**:
```bash
# 检查部署配置
wrangler whoami
wrangler env list

# 本地测试
pnpm run build:cf
wrangler dev
```

### 错误代码: 1005

**错误**: `MONITORING_INIT_FAILED`

**描述**: 监控初始化失败

**解决方案**:
```bash
# 检查监控权限
ls -la logs/
chmod 755 logs/

# 使用基础配置
pnpm run monitor:init production --basic
```

---

## 🛠️ 调试工具

### 启用调试模式

```bash
# 启用详细日志
export DEBUG=1
export VERBOSE=1

# 运行命令
pnpm run smart-check:all
```

### 检查系统状态

```bash
# 完整系统检查
echo "=== 系统状态检查 ==="
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Git: $(git --version)"
echo "环境: $NODE_ENV"
echo "MCP: $ENABLE_MCP"
echo "严格模式: $STRICT_MODE"
```

### 生成诊断报告

```bash
# 生成诊断报告
pnpm run smart-check:all --report > diagnosis-report.txt
cat diagnosis-report.txt
```

---

## 📞 获取帮助

### 查看命令帮助

```bash
# 查看所有可用命令
pnpm run

# 查看特定命令帮助
pnpm run smart-check:all --help
pnpm run env:generate --help
pnpm run monitor:init --help
```

### 查看版本信息

```bash
# 查看系统版本
echo "=== 版本信息 ==="
cat package.json | grep '"version"'
```

### 联系支持

如果问题仍然存在：

1. 查看本文档的相关部分
2. 检查GitHub Issues
3. 创建新的Issue并提供详细信息：
   - 错误信息和堆栈跟踪
   - 系统环境信息
   - 复现步骤
   - 期望结果

---

## 🔧 预防措施

### 定期维护

```bash
# 每周维护脚本
#!/bin/bash

echo "=== 系统维护 ==="

# 1. 清理缓存
echo "清理缓存..."
rm -rf .next/cache
rm -rf .mcp-cache

# 2. 更新依赖
echo "更新依赖..."
pnpm update

# 3. 运行健康检查
echo "健康检查..."
pnpm run env:health
pnpm run monitor:health

# 4. 生成报告
echo "生成报告..."
pnpm run smart-check:all --report > weekly-report.txt
```

### 监控设置

```bash
# 设置定期监控
# 添加到crontab
0 */6 * * * pnpm run monitor:detect production 1h
0 2 * * * pnpm run env:health production
```

---

*本文档持续更新中，最后更新时间: 2025-10-16*