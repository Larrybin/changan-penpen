# Users Admin Module

该模块聚焦后台的用户管理体验，包含用户列表、详情页面、领域模型与对应的服务实现。所有对外能力都通过 `index.ts` 统一导出，消费方应优先依赖接口契约而非具体实现。

## 目录说明

- `contracts.ts` — 服务层接口定义与 DTO。
- `models.ts` — 管理端用户聚合模型。
- `components/` — 客户端组件（懒加载支持）。
- `pages/` — 页面容器，组合组件与数据获取。
- `services/` — 与数据库交互的服务实现，可通过 `createAdminUserService` 注入依赖。

## 依赖约束

- 所有分页能力从 `@/modules/admin-shared/utils/pagination` 获取。
- 共享逻辑或缓存策略放置在 `admin-shared` 或平台层，避免跨模块直接互相引用内部实现。
