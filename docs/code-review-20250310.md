# Cloudflare Workers 代码审查报告（2025-03-10）

## 审查范围与方法
- 依据既有的“量身定做的代码审查方案”以及补充关注点，聚焦 Cloudflare Workers 运行时兼容性、安全、数据层约束、可观测性与 CI 质量闸。
- 通过静态代码阅读、配置核对与脚本检查（包括 `wrangler.toml`、App Router API、Drizzle schema、鉴权/中间件、R2 上传工具、CI Workflow）完成。
- 本报告按风险等级输出可复现的问题、影响面、修复建议与验证要点。

## 重大问题清单
| 编号 | 等级 | 问题摘要 | 影响模块 |
| ---- | ---- | -------- | -------- |
| P0-1 | 高 | 运行时代码直接访问 `process.env`，阻碍去除 `nodejs_compat`，并在 Workers 环境下存在 `ReferenceError` 风险 | `src/lib/seo.ts`、`src/app/(admin)/admin/access/[token]/page.tsx`、`src/app/api/webhooks/creem/route.ts` |
| P0-2 | 高 | `/api/health` 在失败时回显缺失的机密变量与绑定名称，存在信息泄露风险 | `src/app/api/health/route.ts` |
| P0-3 | 高 | 管理入口放行 Cookie 未开启 HttpOnly，且 `secure` 依赖 `process.env`，存在被脚本窃取与运行时失效隐患 | `src/app/(admin)/admin/access/[token]/page.tsx`、`src/modules/admin/utils/admin-access.ts` |
| P1-1 | 中 | 多数业务表缺乏唯一约束/索引，D1 在并发或回放场景容易出现重复数据与全表扫描 | `src/modules/admin/schemas/catalog.schema.ts`、`src/modules/creem/schemas/billing.schema.ts` |
| P1-2 | 中 | R2 上传口虽然提供可选扫描钩子，但默认策略允许通用二进制与 JSON 类型且无内容审计持久化，需补齐落地方案 | `src/lib/r2.ts` |

## 详细问题与建议

### P0-1：运行时代码直接访问 `process.env`
- **证据**：`resolveAppUrl` 直接读取 `process.env.NEXT_PUBLIC_APP_URL`，缺乏 Workers 兼容分支，一旦关闭 `nodejs_compat` 即抛出 `ReferenceError`。【F:src/lib/seo.ts†L91-L115】
- **证据**：管理入口、Webhook 逻辑同样使用 `process.env.NODE_ENV` 进行分支判断。【F:src/app/(admin)/admin/access/[token]/page.tsx†L45-L55】【F:src/app/api/webhooks/creem/route.ts†L61-L70】
- **影响**：无法按计划评估/回退 `nodejs_compat`，导致 Worker 冷启动和包体积受限；即便保留兼容层，若 Next.js 构建针对 Edge runtime 去除了 polyfill，也会在运行期崩溃。
- **修复建议**：
  1. 以 `getCloudflareContext()` 或注入的 `env` 对象读取变量；在前端 bundle 中使用 `process.env.NODE_ENV` 时确保由 bundler 预编译替换。
  2. 新增单元测试/Smoke（在本地 `pnpm dev:cf`，临时移除 `nodejs_compat`）验证核心路由仍能返回 200。
  3. 在 `wrangler.toml` 中保留兼容标志直至上述改造完成，并在 PR 模版中提醒检查。

### P0-2：健康检查泄露机密项名称
- **证据**：`checkEnvAndBindings` 在返回体中包含 `Missing env: ... | Missing bindings: ...`，任何未授权请求都可枚举出机密变量列表。【F:src/app/api/health/route.ts†L113-L148】
- **影响**：攻击者可快速定位缺失的 Secrets/Bucket 绑定，结合社工或爆破增加入侵成功率；也可能暴露是否启用了特定功能（OAuth、R2 公网域等）。
- **修复建议**：
  1. 对公开模式添加“脱敏/fast-only”开关，默认仅返回布尔状态；详细错误仅在鉴权通过或内网访问时输出。
  2. 为 `/api/health` 增加访问控制（如需要自定义 Header/Token）。
  3. 增补集成测试验证 fast 模式下不泄露配置名称。

### P0-3：管理入口 Cookie 可被脚本读写
- **证据**：`admin-entry` Cookie 设置了 `httpOnly: false`，并通过 `process.env.NODE_ENV` 决定 `secure`，同样受兼容性影响。【F:src/app/(admin)/admin/access/[token]/page.tsx†L45-L55】
- **影响**：若存在 XSS，攻击者可直接窃取入口 Token，提升权限；当运行在非 Node 兼容环境下，`process` 可能未定义导致 Cookie 始终非安全模式。
- **修复建议**：
  1. 将 `httpOnly` 设为 `true`，`secure` 基于请求协议或 `request.headers.get("x-forwarded-proto")` 判断。
  2. 在 `requireAdminForPage` 的重定向链路中增加 CSRF/Referer 校验，避免 Cookie 被滥用。
  3. 添加端到端测试验证响应头含有 `Set-Cookie: ...; HttpOnly; Secure`。

### P1-1：缺失唯一约束与索引
- **证据**：`products.slug`、`coupons.code`、`content_pages.slug` 等字段无唯一约束；`subscriptions` 没有对 `creem_subscription_id` 建立唯一索引，`credits_history` 也缺乏对 `creem_order_id` 的约束。【F:src/modules/admin/schemas/catalog.schema.ts†L3-L43】【F:src/modules/creem/schemas/billing.schema.ts†L9-L60】
- **影响**：D1 在并发插入或重放 webhook 时可能产生重复记录，破坏业务幂等；查询需要全表扫描，随着数据增长性能快速退化。
- **修复建议**：
  1. 为 slug/code/subscription id/order id 等字段添加 `uniqueIndex` 或组合索引，并同步生成迁移。
  2. 在 `billing` 服务中充分利用 `onConflictDoUpdate`，并基于唯一键回写。
  3. 执行 `pnpm db:migrate:local`/`prod` 验证迁移幂等与回滚。

### P1-2：R2 上传安全策略未落地
- **证据**：默认白名单包含 `application/json`、压缩包等高风险类型，且 `requireContentScan` 仅依赖调用者传入钩子；上传成功后未记录内容扫描结果或请求来源，难以审计。【F:src/lib/r2.ts†L5-L152】
- **影响**：若上层调用遗漏扫描或意外允许 JSON/Zip，R2 可能存储恶意脚本或压缩炸弹，进而被前端引用。
- **修复建议**：
  1. 将默认允许类型收紧至确实需要的媒体/文档；对二进制/压缩类改为显式 opt-in。
  2. 在上传返回结果中附带扫描日志 ID，并记录到 D1 或日志系统。
  3. 针对 `scanFile` 抛错补充重试/降级策略，并在 CI 中加入模糊测试。

## 运行时兼容性补充
- 依赖 `process`/`Buffer` 的模块列表：`src/lib/seo.ts`、`src/app/(admin)/admin/access/[token]/page.tsx`、`src/app/api/webhooks/creem/route.ts`、`src/modules/auth/utils/auth-client.ts` 等。需统一封装 `getRuntimeEnv()`，确保关闭 `nodejs_compat` 仍能访问配置。
- 建议在 `package.json` 脚本中新增 `pnpm dev:cf:no-node`（自动注释掉兼容标志）以验证。

## 测试与 CI 建议
- **覆盖率提升路线**：建议将阈值提升至 `lines/statements 15%`、`branches/functions 20%`，并在 PR 中引入“改动文件 >= 60%”的增量规则。CI 配置可在 `ci.yml` 的阈值环境变量上逐步递增。
- **新增测试建议**：
  1. `/api/health` fast 模式脱敏测试。
  2. 管理入口 Cookie 头校验（Vitest + Next Request/Response mock）。
  3. R2 上传 fuzz（伪造 MIME、超限、扫描失败）。

## 后续行动清单
1. 以工单跟踪 P0/P1 修复，纳入近期 Sprint。
2. 修复完成后执行：`pnpm exec biome check .`、`pnpm exec tsc --noEmit`、`pnpm exec vitest run --coverage`、`pnpm dev:cf`（或无 node 兼容模式）。
3. 更新 `docs/security.md` 与 `docs/health-and-observability.md` 说明新的健康检查脱敏与上传扫描策略。
4. 在发布说明中通告 Cookie 与健康检查行为变更。
