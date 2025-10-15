# Routes & API Index

> Quick reference for pages, APIs, and auth requirements. Update this file whenever a path or policy changes.
>
> ✅ 管理后台新增 Swagger UI：访问 `/admin/api-docs`（需管理员登录）。OpenAPI JSON 位于 `/api/openapi`，同样要求管理员权限。

## 1. Page Routes (App Router)

Core
- `/` — Home (public)
- `/about` — About (public)
- `/contact` — Contact/Support (public)
- `/privacy` — Privacy (public)
- `/terms` — Terms (public)

Auth Area `(auth)`
- `/login` — Login (public)
- `/signup` — Signup (public)

Dashboard `(authenticated)`
- `/dashboard` — Main console (login required)
- `/dashboard/todos` — Todos demo (login required)
- `/dashboard/todos/new` — Create Todo (login required)
- `/dashboard/todos/[id]/edit` — Edit Todo (login required)

Billing
- `/billing` — Billing & subscriptions (public, may prompt login in page)
- `/billing/cancel` — Cancel result (public)
- `/billing/success` — Success result (public)
- `/billing/usage` — Usage overview (may require login)

Admin Area `(admin)`
- `/admin` — Admin overview (admin only)
- `/admin/reports` — Reports (admin only)
- `/admin/audit-logs` — Audit logs (admin only)
- `/admin/usage` — Usage (admin only)
- `/admin/billing/orders` — Orders (admin only)
- `/admin/billing/credits` — Credits history (admin only)
- `/admin/catalog/products` — Products (admin only)
- `/admin/catalog/products/create` — Create product (admin only)
- `/admin/catalog/products/edit/[id]` — Edit product (admin only)
- `/admin/catalog/content-pages` — Content pages (admin only)
- `/admin/catalog/content-pages/create` — Create content page (admin only)
- `/admin/catalog/content-pages/edit/[id]` — Edit content page (admin only)
- `/admin/catalog/coupons` — Coupons (admin only)
- `/admin/catalog/coupons/create` — Create coupon (admin only)
- `/admin/catalog/coupons/edit/[id]` — Edit coupon (admin only)
- `/admin/settings/site` — Site settings (admin only)
- `/admin/api-docs` — Swagger UI（admin only）
- `/admin/tenants` — Tenants list (admin only)
- `/admin/tenants/[id]` — Tenant detail (admin only)
- `/admin/todos` — Todos (admin only)
- `/admin/todos/create` — Create admin todo (admin only)
- `/admin/todos/edit/[id]` — Edit admin todo (admin only)

> Global layout and navigation live in `src/app/layout.tsx` and `src/modules/admin/admin.layout.tsx`.

Discovered (scan)
- `/admin` (src/app/(admin)/admin/page.tsx)
- `/admin/reports` (src/app/(admin)/admin/reports/page.tsx)
- `/admin/audit-logs` (src/app/(admin)/admin/audit-logs/page.tsx)
- `/admin/usage` (src/app/(admin)/admin/usage/page.tsx)
- `/admin/billing/credits` (src/app/(admin)/admin/billing/credits/page.tsx)
- `/admin/billing/orders` (src/app/(admin)/admin/billing/orders/page.tsx)
- `/admin/catalog/products` (src/app/(admin)/admin/catalog/products/page.tsx)
- `/admin/catalog/products/create` (src/app/(admin)/admin/catalog/products/create/page.tsx)
- `/admin/catalog/products/edit/[id]` (src/app/(admin)/admin/catalog/products/edit/[id]/page.tsx)
- `/admin/catalog/content-pages` (src/app/(admin)/admin/catalog/content-pages/page.tsx)
- `/admin/catalog/content-pages/create` (src/app/(admin)/admin/catalog/content-pages/create/page.tsx)
- `/admin/catalog/content-pages/edit/[id]` (src/app/(admin)/admin/catalog/content-pages/edit/[id]/page.tsx)
- `/admin/catalog/coupons` (src/app/(admin)/admin/catalog/coupons/page.tsx)
- `/admin/catalog/coupons/create` (src/app/(admin)/admin/catalog/coupons/create/page.tsx)
- `/admin/catalog/coupons/edit/[id]` (src/app/(admin)/admin/catalog/coupons/edit/[id]/page.tsx)
- `/admin/settings/site` (src/app/(admin)/admin/settings/site/page.tsx)
- `/admin/tenants` (src/app/(admin)/admin/tenants/page.tsx)
- `/admin/tenants/[id]` (src/app/(admin)/admin/tenants/[id]/page.tsx)
- `/admin/todos` (src/app/(admin)/admin/todos/page.tsx)
- `/admin/todos/create` (src/app/(admin)/admin/todos/create/page.tsx)
- `/admin/todos/edit/[id]` (src/app/(admin)/admin/todos/edit/[id]/page.tsx)
- `/login` (src/app/(auth)/login/page.tsx)
- `/signup` (src/app/(auth)/signup/page.tsx)
- `/billing` (src/app/billing/page.tsx)
- `/billing/cancel` (src/app/billing/cancel/page.tsx)
- `/billing/success` (src/app/billing/success/page.tsx)
- `/billing/usage` (src/app/billing/usage/page.tsx)
- `/dashboard/todos` (src/app/dashboard/todos/page.tsx)
- `/dashboard/todos/new` (src/app/dashboard/todos/new/page.tsx)
- `/dashboard/todos/[id]/edit` (src/app/dashboard/todos/[id]/edit/page.tsx)

## 2. Auth‑Related

| Path | Method | Description |
| --- | --- | --- |
| `/api/auth/[...all]` | `GET/POST` | Better Auth Google OAuth & session management |
| `/api/admin/session` | `GET` | Admin session check |
| `middleware.ts` | �?||  `middleware.ts` | �� | Protects routes like  `/dashboard`, `/admin` |

## 3. Core APIs

Admin APIs
- Path: `/api/admin/*` (admin only)

| Path | Method | Module | Description | Auth |
| --- | --- | --- | --- | --- |
| `/api/admin/session` | `GET` | Admin | Admin session check | Admin only |
| `/api/admin/audit-logs` | `GET` | Admin | List audit logs | Admin only |
| `/api/admin/site-settings` | `GET/POST` | Admin | Get/update site settings | Admin only |
| `/api/admin/reports` | `GET` | Admin | Reporting endpoints | Admin only |
| `/api/admin/usage` | `GET` | Admin | Usage overview for admin | Admin only |
| `/api/admin/orders` | `GET/POST` | Admin | List/create orders | Admin only |
| `/api/admin/orders/[id]` | `GET` | Admin | Order by id | Admin only |
| `/api/admin/products` | `GET/POST` | Admin | List/create products | Admin only |
| `/api/admin/products/[id]` | `GET` | Admin | Product by id | Admin only |
| `/api/admin/categories` | `GET/POST` | Admin | Manage categories | Admin only |
| `/api/admin/coupons` | `GET/POST` | Admin | List/create coupons | Admin only |
| `/api/admin/coupons/[id]` | `GET` | Admin | Coupon by id | Admin only |
| `/api/admin/content-pages` | `GET/POST` | Admin | List/create content pages | Admin only |
| `/api/admin/content-pages/[id]` | `GET` | Admin | Content page by id | Admin only |
| `/api/admin/tenants` | `GET/POST` | Admin | List/create tenants | Admin only |
| `/api/admin/tenants/[id]` | `GET` | Admin | Tenant by id | Admin only |
| `/api/admin/todos` | `GET/POST` | Admin | List/create admin todos | Admin only |
| `/api/admin/todos/[id]` | `GET` | Admin | Admin todo by id | Admin only |
| `/api/admin/credits-history` | `GET` | Admin | Credits history | Admin only |
| `/api/openapi` | `GET` | Docs | Generate OpenAPI 3.1 文档（需管理员登录） | Admin only |
| `/api/admin/dashboard` | `GET` | Admin | Dashboard metrics | Admin only |

Billing / Payments

| Path | Method | Module | Description | Auth |
| --- | --- | --- | --- | --- |
| `/api/creem/create-checkout` | `POST` | Billing (`modules/creem`) | Create checkout session | Login |
| `/api/creem/customer-portal` | `POST` | Billing (`modules/creem`) | Redirect to customer portal | Login |
| `/api/credits/balance` | `GET` | Billing (`modules/billing`) | Fetch current credit balance (auto refresh monthly credits) | Login |
| `/api/credits/history` | `GET` | Billing (`modules/billing`) | Paginated credit transactions | Login |
| `/api/webhooks/creem` | `POST` | Billing (`modules/creem`) | Payment webhook | Signature required |

Usage Tracking

| Path | Method | Module | Description | Auth |
| --- | --- | --- | --- | --- |
| `/api/usage/record` | `POST` | Usage | Record user actions | Login |
| `/api/usage/stats` | `GET` | Usage | Fetch usage stats | Login |

Auth / Health / AI

| Path | Method | Module | Description | Auth |
| --- | --- | --- | --- | --- |
| `/api/auth/[...all]` | `GET/POST` | Auth | Better Auth Google OAuth & session | Public/Login |
| `/api/health` | `GET` | Platform | Health check (fast/strict modes) | Public |
| `/api/summarize` | `POST` | AI | Workers AI summarization | Login |
| `/internal/actions/todos/create` | `POST` | Todos | Server Action（内部调试用） | Login |

> See each `route.ts` and related services for details under `src/app/api/*`.

Appendix: Full API route files (scan)
- src/app/api/admin/audit-logs/route.ts
- src/app/api/admin/categories/route.ts
- src/app/api/admin/content-pages/[id]/route.ts
- src/app/api/admin/content-pages/route.ts
- src/app/api/admin/coupons/[id]/route.ts
- src/app/api/admin/coupons/route.ts
- src/app/api/admin/credits-history/route.ts
- src/app/api/admin/dashboard/route.ts
- src/app/api/admin/orders/[id]/route.ts
- src/app/api/admin/orders/route.ts
- src/app/api/admin/products/[id]/route.ts
- src/app/api/admin/products/route.ts
- src/app/api/credits/balance/route.ts
- src/app/api/credits/history/route.ts
- src/app/api/admin/reports/route.ts
- src/app/api/admin/session/route.ts
- src/app/api/admin/site-settings/route.ts
- src/app/api/admin/tenants/[id]/route.ts
- src/app/api/admin/tenants/route.ts
- src/app/api/admin/todos/[id]/route.ts
- src/app/api/admin/todos/route.ts
- src/app/api/admin/usage/route.ts
- src/app/api/auth/[...all]/route.ts
- src/app/api/creem/create-checkout/route.ts
- src/app/api/creem/customer-portal/route.ts
- src/app/api/health/route.ts
- src/app/api/summarize/route.ts
- src/app/api/webhooks/creem/route.ts

## 4. Server Actions (Examples)

| File | Description |
| --- | --- |
| `src/modules/todos/actions/create-todo.action.ts` | Create Todo, calls Drizzle |
| `src/modules/dashboard/actions/*` | Dashboard operations (invites, configuration, etc.) |
| `src/modules/admin/services/*` | Services used by page actions |

Server Actions run on Edge by default and update UI via `revalidatePath`.

## 5. Common Bindings
- D1: `env.next_cf_app`
- R2: `env.next_cf_app_bucket`
- Workers AI: `env.AI`
- External APIs: `CREEM_API_URL`, `CREEM_API_KEY`

## 6. Checklist for New Routes
1. Confirm auth policy (middleware/Better Auth)
2. Add docs/comments in the owning module
3. If it changes health or monitoring, update `docs/health-and-observability.md`
4. Update `.github` PR templates if required

---

Please keep this file, `docs/00-index.md`, and any module READMEs in sync when adding or renaming routes.

<!-- DOCSYNC:API_INDEX START -->
### API Index (auto)
| Path | Methods | File |
| --- | --- | --- |
| /admin/access/[token] | GET | src/app/(admin)/admin/access/[token]/route.ts |
| /api/admin/audit-logs | GET | src/app/api/admin/audit-logs/route.ts |
| /api/admin/categories | GET | src/app/api/admin/categories/route.ts |
| /api/admin/content-pages/[id] | DELETE, GET, PATCH | src/app/api/admin/content-pages/[id]/route.ts |
| /api/admin/content-pages | GET, POST | src/app/api/admin/content-pages/route.ts |
| /api/admin/coupons/[id] | DELETE, GET, PATCH | src/app/api/admin/coupons/[id]/route.ts |
| /api/admin/coupons | GET, POST | src/app/api/admin/coupons/route.ts |
| /api/admin/credits-history | GET | src/app/api/admin/credits-history/route.ts |
| /api/admin/dashboard | GET | src/app/api/admin/dashboard/route.ts |
| /api/admin/orders/[id] | GET | src/app/api/admin/orders/[id]/route.ts |
| /api/admin/orders | GET | src/app/api/admin/orders/route.ts |
| /api/admin/products/[id] | DELETE, GET, PATCH | src/app/api/admin/products/[id]/route.ts |
| /api/admin/products | GET, POST | src/app/api/admin/products/route.ts |
| /api/admin/reports | GET, POST | src/app/api/admin/reports/route.ts |
| /api/admin/session | GET | src/app/api/admin/session/route.ts |
| /api/admin/site-settings | GET, PATCH | src/app/api/admin/site-settings/route.ts |
| /api/admin/tenants/[id] | GET | src/app/api/admin/tenants/[id]/route.ts |
| /api/admin/tenants | GET | src/app/api/admin/tenants/route.ts |
| /api/admin/todos/[id] | DELETE, GET, PATCH | src/app/api/admin/todos/[id]/route.ts |
| /api/admin/todos | GET, POST | src/app/api/admin/todos/route.ts |
| /api/admin/usage | GET | src/app/api/admin/usage/route.ts |
| /api/auth/[...all] | GET, POST | src/app/api/auth/[...all]/route.ts |
| /api/creem/create-checkout | POST | src/app/api/creem/create-checkout/route.ts |
| /api/creem/customer-portal | GET | src/app/api/creem/customer-portal/route.ts |
| /api/health | GET | src/app/api/health/route.ts |
| /api/summarize | POST | src/app/api/summarize/route.ts |
| /api/webhooks/creem | POST | src/app/api/webhooks/creem/route.ts |
<!-- DOCSYNC:API_INDEX END -->
