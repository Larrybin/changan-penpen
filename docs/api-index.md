# 路由与 API 索引

> 便于新同事快速查找页面、API、鉴权要求。涉及路径如有变更，请同步更新本文件。

## 1. 页面路由（App Router）

| 路径 | Segment | 描述 | 鉴权 | 相关模块 |
| --- | --- | --- | --- | --- |
| `/` | 根 | Landing + 产品概览 | 公共 | `src/modules/marketing` |
| `/about` | 静态页 | 团队介绍 | 公共 | `src/app/about/page.tsx` |
| `/contact` | 静态页 | 联系/支持 | 公共 | `src/app/contact/page.tsx` |
| `/dashboard` | `(authenticated)` | 主应用控制台 | 要求登录 | `src/modules/dashboard` |
| `/dashboard/todos` | 同上 | Todos Demo | 要求登录 | `src/modules/todos` |
| `/billing` | `(authenticated)` | 账单与订阅 | 要求登录 | `src/modules/dashboard/billing` |
| `/admin` | `(admin)` | 后台总览 | `ADMIN_ALLOWED_EMAILS` 白名单 | `src/modules/admin` |
| `/admin/reports` | `(admin)` | 报表 | 同上 | `src/modules/admin/reports` |
| `/privacy` / `/terms` | 静态 | 合规页面 | 公共 | `src/app/privacy`, `src/app/terms` |

> 统一布局与导航定义在 `src/app/layout.tsx` 及 `src/modules/admin/admin.layout.tsx`。

## 2. 认证相关路由

| 路径 | 方法 | 描述 |
| --- | --- | --- |
| `/api/auth/[...all]` | `GET/POST` | Better Auth Google OAuth、Session 管理 |
| `/api/admin/session` | `GET` | 管理端会话校验 |
| `middleware.ts` | - | 保护 `/dashboard`, `/admin` 等路径 |

## 3. 核心 API

| 路径 | 方法 | 模块 | 描述 | 鉴权 |
| --- | --- | --- | --- | --- |
| `/api/health` | `GET` | 平台 | 健康检查（fast/strict） | 无 |
| `/api/creem/create-checkout` | `POST` | `modules/creem` | 创建支付会话 | 需要登录 |
| `/api/creem/customer-portal` | `POST` | 同上 | 跳转客户门户 | 登录 |
| `/api/webhooks/creem` | `POST` | 同上 | 支付回调 | 签名校验 |
| `/api/summarize` | `POST` | AI 服务 | Workers AI 文本总结 | 登录 |
| `/api/usage/record` | `POST` | Usage Tracking | 记录用户操作 | 登录 |
| `/api/usage/stats` | `GET` | 同上 | 获取统计 | 登录 |
| `/api/admin/*` | `GET/POST` | Admin | 多个资源：`audit-logs`, `orders`, `products`, `site-settings`, `todos` 等 | 仅管理员 |

> `src/app/api/admin` 下有多个子路由，请查阅对应 `*.route.ts` 或模块服务层。

## 4. Server Actions（示例）

| 文件 | 描述 |
| --- | --- |
| `src/modules/todos/actions/create-todo.action.ts` | 创建 Todo，调用 Drizzle |
| `src/modules/dashboard/actions/*` | Dashboard 操作（邀请、配置等） |
| `src/modules/admin/services/*` | 供页面/Actions 调用的服务 |

Server Actions 默认在 Edge runtime 执行，并通过 `revalidatePath` 更新 UI。

## 5. 常见绑定依赖
- D1：`env.next_cf_app`
- R2：`env.next_cf_app_bucket`
- Workers AI：`env.AI`
- 外部 API：`CREEM_API_URL`、`CREEM_API_KEY`

## 6. 路由新增 Checklist
1. 确认鉴权策略（middleware/Better Auth）
2. 在对应模块添加文档或注释
3. 若影响健康检查或监控，更新 `docs/health-and-observability.md`
4. 如需 PR 模板更新，修改 `.github` 对应文件

---

若新增路由或更改路径命名，请更新此文档、`docs/00-index.md` 以及相关模块 README（如有）。
