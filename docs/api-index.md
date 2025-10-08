# Routes & API Index

> Quick reference for pages, APIs, and auth requirements. Update this file whenever a path or policy changes.

## 1. Page Routes (App Router)
| Path | Segment | Description | Auth | Module |
| --- | --- | --- | --- | --- |
| `/` | Home | Landing + product overview | Public | `src/modules/marketing` |
| `/about` | Static | About the team | Public | `src/app/about/page.tsx` |
| `/contact` | Static | Contact/Support | Public | `src/app/contact/page.tsx` |
| `/dashboard` | `(authenticated)` | Main console | Login required | `src/modules/dashboard` |
| `/dashboard/todos` | — | Todos demo | Login required | `src/modules/todos` |
| `/billing` | Static | Billing & subscriptions | Public (prompts login in page) | `src/app/billing/page.tsx`, `src/modules/creem` |
| `/admin` | `(admin)` | Admin overview | Allowed emails only | `src/modules/admin` |
| `/admin/reports` | `(admin)` | Reports | Same as above | `src/modules/admin/reports` |
| `/privacy` / `/terms` | Static | Legal pages | Public | `src/app/privacy`, `src/app/terms` |

> Global layout and navigation live in `src/app/layout.tsx` and `src/modules/admin/admin.layout.tsx`.

## 2. Auth‑Related

| Path | Method | Description |
| --- | --- | --- |
| `/api/auth/[...all]` | `GET/POST` | Better Auth Google OAuth & session management |
| `/api/admin/session` | `GET` | Admin session check |
| `middleware.ts` | — | Protects routes like `/dashboard`, `/admin` |

## 3. Core APIs

| Path | Method | Module | Description | Auth |
| --- | --- | --- | --- | --- |
| `/api/health` | `GET` | Platform | Health check (fast/strict) | Public |
| `/api/creem/create-checkout` | `POST` | `modules/creem` | Create checkout session | Login |
| `/api/creem/customer-portal` | `POST` | `modules/creem` | Redirect to customer portal | Login |
| `/api/webhooks/creem` | `POST` | `modules/creem` | Payment webhook | Signature required |
| `/api/summarize` | `POST` | AI | Workers AI summarization | Login |
| `/api/usage/record` | `POST` | Usage Tracking | Record user actions | Login |
| `/api/usage/stats` | `GET` | Usage Tracking | Fetch usage stats | Login |
| `/api/admin/*` | `GET/POST` | Admin | Resources: `audit-logs`, `orders`, `products`, `site-settings`, `todos` | Admin only |

> See each `route.ts` and related services for details under `src/app/api/*`.

## 4. Server Actions (Examples)

| File | Description |
| --- | --- |
| `src/modules/todos/actions/create-todo.action.ts` | Create Todo, calls Drizzle |
| `src/modules/dashboard/actions/*` | Dashboard operations (invites, configuration, …) |
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

