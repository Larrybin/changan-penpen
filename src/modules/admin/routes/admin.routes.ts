import { tenantAdminRoutes } from "@/modules/tenant-admin/routes";
import { usersAdminRoutes } from "@/modules/users-admin/routes";

const adminRoutes = {
    root: "/admin",
    todos: {
        list: "/admin/todos",
        create: "/admin/todos/create",
        edit: (id: number | string) => `/admin/todos/edit/${id}`,
    },
    dashboard: {
        overview: "/admin",
    },
    tenants: tenantAdminRoutes,
    billing: {
        orders: "/admin/billing/orders",
        credits: "/admin/billing/credits",
    },
    usage: {
        list: "/admin/usage",
    },
    users: usersAdminRoutes,
    settings: {
        site: "/admin/settings/site",
        marketing: "/admin/settings/marketing",
    },
    catalog: {
        products: "/admin/catalog/products",
        coupons: "/admin/catalog/coupons",
        contentPages: "/admin/catalog/content-pages",
    },
    performance: {
        overview: "/admin/performance",
        webVitals: "/admin/performance/web-vitals",
        seo: "/admin/performance/seo",
        systemHealth: "/admin/performance/system-health",
    },
    reports: {
        list: "/admin/reports",
    },
    auditLogs: {
        list: "/admin/audit-logs",
    },
    docs: {
        api: "/admin/api-docs",
    },
} as const;

export default adminRoutes;
