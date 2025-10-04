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
    tenants: {
        list: "/admin/tenants",
        show: (id: string) => `/admin/tenants/${id}`,
    },
    billing: {
        orders: "/admin/billing/orders",
        credits: "/admin/billing/credits",
    },
    usage: {
        list: "/admin/usage",
    },
    settings: {
        site: "/admin/settings/site",
    },
    catalog: {
        products: "/admin/catalog/products",
        coupons: "/admin/catalog/coupons",
        contentPages: "/admin/catalog/content-pages",
    },
    reports: {
        list: "/admin/reports",
    },
    auditLogs: {
        list: "/admin/audit-logs",
    },
} as const;

export default adminRoutes;
