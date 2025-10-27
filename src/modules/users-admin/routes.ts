export const usersAdminRoutes = {
    list: "/admin/users",
    show: (id: string) => `/admin/users/${id}`,
} as const;
