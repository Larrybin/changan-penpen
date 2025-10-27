# Tenant Admin Module

领域模块用于管理租户相关的后台体验，包含列表页、详情页以及与租户聚合数据相关的服务层。该目录只暴露通过 `index.ts` 导出的能力，其余文件视为内部实现。

## 目录结构

- `contracts.ts` — 对外暴露的服务接口、DTO 与返回结构。
- `pages/` — React 客户端页面与容器组件。
- `services/` — 与数据库交互的领域服务，默认通过 `createTenantAdminService` 提供实例。

## 依赖约定

- 上层调用者应通过接口类型而非具体实现依赖该模块。
- 与其它 Admin 子域共享的工具方法统一从 `@/modules/admin-shared` 获取。
