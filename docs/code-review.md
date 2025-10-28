# 代码审查：可维护性、复用性与耦合度

## 总览
- 重点关注了管理端性能分析链路（`performance-data.service.ts`、`seo-scanner.ts`、性能 API 路由）以及后台查询工具链（`query-factory.ts`、`report.service.ts`）。
- 主要问题集中在服务对象职责过重、基础工具缺乏抽象契约以及缓存策略重复，增加了后续演进成本。

## 详细发现

### 1. `PerformanceDataService` 角色过多，导致后续演进困难
- 单个文件承担了数据聚合、指标计算、默认值模拟、本地缓存等多重职责（超 600 行），同时混用了浏览器与服务端的能力，例如直接读取 `window`、调用内部 API，再通过随机数回填数据。【F:src/modules/admin/services/performance-data.service.ts†L161-L672】
- 推荐将“数据来源”“指标计算/格式化”“缓存层”拆分为独立模块：
  - 通过接口抽象不同数据源（Web Vitals、SEO、System Health），以便替换模拟实现。
  - 复用已有的 `AdminCacheManager`/`withAdminCache`，避免在服务内再维护 `Map` 缓存与 TTL 常量。
  - 拆分默认数据生成逻辑，降低随机数导致的非确定性，方便调试与验收。

### 2. `seo-scanner.ts` 与 DOM 强耦合且存在大量重复逻辑
- 每个检查函数都直接访问 `document`，并在文件中内联评分/提示逻辑，缺少可复用的校验规则或评分策略，导致扩展或测试困难。【F:src/modules/admin/services/seo-scanner.ts†L116-L615】
- 建议将 SEO 检查拆分为独立的“规则”对象，通过注入 DOM 适配器（或接受静态 HTML 作为输入）来提升可测试性；同时抽象评分算法和问题模板，避免在多个函数间复制阈值与字符串常量。

### 3. 查询工厂缺乏明确契约，依赖大量类型断言
- `FilterableBuilder` 仅被声明为 `PromiseLike`，随后在 `withWhere`、`createPaginatedQuery` 中通过类型断言强制访问 `.where()`，与 Drizzle 的具体实现强耦合。【F:src/modules/admin/services/report.service.ts†L83-L152】【F:src/modules/admin/utils/query-factory.ts†L222-L305】
- 推荐为查询构造器定义最小接口（如 `{ where(...): Builder; execute(): Promise<T[]> }`），或在调用处显式接收 `DrizzleSelect` 类型，减少对隐式结构的依赖，从而提升类型安全与未来迁移时的可维护性。

### 4. 性能数据缓存策略分散，TTL 定义重复
- 服务内部使用 30 秒的 `Map` 缓存，而 API 路由层又以常量 `30` 秒调用 `withAdminCache`/`AdminCacheManager`，两处 TTL 需要手动同步且缺少集中配置。【F:src/modules/admin/services/performance-data.service.ts†L161-L683】【F:src/app/(dynamic)/api/v1/admin/performance/route.ts†L114-L253】
- 建议集中定义缓存策略（例如在 `performance-cache.ts` 中导出 TTL 配置），并复用统一的缓存实现，避免多层缓存导致的数据不一致或难以排查的缓存穿透问题。

## 建议优先级
1. 先拆分 `PerformanceDataService` 并统一缓存策略，便于后续将模拟数据替换为真实埋点。
2. 重构 SEO 扫描逻辑，形成可组合的校验规则集并引入 DOM 适配层。
3. 为查询工厂补全类型契约，减少类型断言和隐式依赖。

