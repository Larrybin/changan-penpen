export const tenantAdminRoutes = {
    list: "/admin/tenants",
    show: (id: string) => `/admin/tenants/${id}`,
} as const;
