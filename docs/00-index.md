# 文档索引（Information Architecture）
> 统一文档入口，便于快速定位信息。新增或调整流程时请同步更新本页。

## 快速入门
- [仓库 README](../README.md)
- [文档维护手册](docs-maintenance.md)

## 入门与开发基础
1. [architecture-overview.md](architecture-overview.md) — App Router 结构、模块职责、数据流
2. [getting-started.md](getting-started.md) — 5 分钟快速开始（本地 & 生产）
3. [local-dev.md](local-dev.md) — 本地开发与调试技巧
4. [testing.md](testing.md) — 测试现状、Vitest 规划与 mock 策略

## 环境、配置与资源
1. [env-and-secrets.md](env-and-secrets.md) — 环境变量矩阵与轮换策略
2. [db-d1.md](db-d1.md) — D1 迁移、初始化、备份恢复
3. [r2-assets.md](r2-assets.md) — R2 使用与静态资源映射
4. [opennext.md](opennext.md) — OpenNext on Cloudflare 最佳实践

## 部署与运维
1. [deployment/cloudflare-workers.md](deployment/cloudflare-workers.md) — 构建、部署、回滚、健康检查
2. [ci-cd.md](ci-cd.md) — 流水线总览（含权限矩阵与质量闸门）
3. [workflows/ci.md](workflows/ci.md)、[workflows/deploy.md](workflows/deploy.md)
4. [health-and-observability.md](health-and-observability.md) — 健康检查、日志、Sentry、Workers Analytics
5. [api-index.md](api-index.md) — 关键页面与 API 路由索引

## 风险控制与排障
1. [troubleshooting.md](troubleshooting.md) — 常见错误、诊断命令、修复脚本
2. [security.md](security.md) — 权限最小化、依赖安全、Action 固定 SHA
3. [style-guide.md](style-guide.md) — 代码、提交与文档风格

## 协作与发布
1. [contributing.md](contributing.md) — 贡献流程、PR 模板、测试要求
2. [release.md](release.md) — 发布步骤、变更冻结、回滚与留痕
3. [faq.md](faq.md)、[glossary.md](glossary.md) — 常见问题与术语表

## 维护机制
1. [docs-maintenance.md](docs-maintenance.md) — 文档入口、徽章维护、校验工具
2. Code Owners：见 `.github/CODEOWNERS`
3. 巡检 Checklist：收录于 `docs-maintenance.md`

---

文档即运行手册：若流程改变，请先更新相关文档，再提交代码或工作流改动。

