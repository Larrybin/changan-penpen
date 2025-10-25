import adminRoutes from "@/modules/admin/routes/admin.routes";

export interface AdminResourceDynamicRoute {
    path: string;
    build: (id: string | number) => string;
}

export type AdminResourceRoute = string | AdminResourceDynamicRoute;

export interface AdminResourceDefinition {
    name: string;
    label?: string;
    icon?: string;
    group?: string;
    order?: number;
    hide?: boolean;
    routes?: {
        list?: string;
        create?: string;
        edit?: AdminResourceRoute;
        show?: AdminResourceRoute;
    };
}

export interface AdminMenuItem {
    name: string;
    label: string;
    href: string;
    icon?: string;
    order: number;
}

export interface AdminMenuGroup {
    name: string;
    items: AdminMenuItem[];
}

export const DEFAULT_ADMIN_MENU_GROUP = "概览";
const DEFAULT_MENU_ORDER = 10;

const adminResourceDefinitions: readonly AdminResourceDefinition[] = [
    {
        name: "dashboard",
        label: "总览",
        icon: "layout-dashboard",
        order: 0,
        routes: {
            list: adminRoutes.dashboard.overview,
        },
    },
    {
        name: "tenants",
        label: "租户",
        icon: "users",
        group: "运营",
        routes: {
            list: adminRoutes.tenants.list,
            show: {
                path: adminRoutes.tenants.show(":id"),
                build: (id) => adminRoutes.tenants.show(String(id)),
            },
        },
    },
    {
        name: "users",
        label: "用户",
        icon: "user-circle",
        group: "运营",
        routes: {
            list: adminRoutes.users.list,
            show: {
                path: adminRoutes.users.show(":id"),
                build: (id) => adminRoutes.users.show(String(id)),
            },
        },
    },
    {
        name: "orders",
        label: "订单",
        icon: "receipt",
        group: "营收",
        routes: {
            list: adminRoutes.billing.orders,
        },
    },
    {
        name: "credits-history",
        label: "积分流水",
        icon: "coins",
        group: "营收",
        routes: {
            list: adminRoutes.billing.credits,
        },
    },
    {
        name: "usage",
        label: "用量监控",
        icon: "activity",
        group: "运营",
        routes: {
            list: adminRoutes.usage.list,
        },
    },
    {
        name: "products",
        label: "商品",
        icon: "package",
        group: "目录",
        routes: {
            list: adminRoutes.catalog.products,
            create: `${adminRoutes.catalog.products}/create`,
            edit: {
                path: `${adminRoutes.catalog.products}/edit/:id`,
                build: (id) => `${adminRoutes.catalog.products}/edit/${id}`,
            },
        },
    },
    {
        name: "coupons",
        label: "优惠券",
        icon: "ticket",
        group: "目录",
        routes: {
            list: adminRoutes.catalog.coupons,
            create: `${adminRoutes.catalog.coupons}/create`,
            edit: {
                path: `${adminRoutes.catalog.coupons}/edit/:id`,
                build: (id) => `${adminRoutes.catalog.coupons}/edit/${id}`,
            },
        },
    },
    {
        name: "content-pages",
        label: "内容页",
        icon: "file-text",
        group: "目录",
        routes: {
            list: adminRoutes.catalog.contentPages,
            create: `${adminRoutes.catalog.contentPages}/create`,
            edit: {
                path: `${adminRoutes.catalog.contentPages}/edit/:id`,
                build: (id) => `${adminRoutes.catalog.contentPages}/edit/${id}`,
            },
        },
    },
    {
        name: "site-settings",
        label: "站点设置",
        icon: "settings",
        group: "配置",
        routes: {
            list: adminRoutes.settings.site,
        },
    },
    {
        name: "api-docs",
        label: "API 文档",
        icon: "book-open",
        group: "配置",
        routes: {
            list: adminRoutes.docs.api,
        },
    },
    {
        name: "reports",
        label: "报表导出",
        icon: "file-chart",
        group: "配置",
        routes: {
            list: adminRoutes.reports.list,
        },
    },
    {
        name: "audit-logs",
        label: "操作日志",
        icon: "clipboard-list",
        group: "配置",
        routes: {
            list: adminRoutes.auditLogs.list,
        },
    },
    {
        name: "performance",
        label: "性能监控",
        icon: "activity",
        group: "运营",
        routes: {
            list: adminRoutes.performance.overview,
        },
    },
    {
        name: "todos",
        label: "代办事项",
        icon: "check-square",
        routes: {
            list: adminRoutes.todos.list,
            create: adminRoutes.todos.create,
            edit: {
                path: adminRoutes.todos.edit(":id"),
                build: (id) => adminRoutes.todos.edit(id),
            },
        },
    },
    {
        name: "categories",
        hide: true,
    },
] as const;

export function buildAdminMenuGroups(
    resources: readonly AdminResourceDefinition[] = adminResourceDefinitions,
): AdminMenuGroup[] {
    const groups = new Map<string, AdminMenuItem[]>();
    const order: string[] = [];

    resources.forEach((resource) => {
        if (resource.hide || !resource.routes?.list) {
            return;
        }

        const groupName = resource.group ?? DEFAULT_ADMIN_MENU_GROUP;
        let items = groups.get(groupName);
        if (!items) {
            items = [];
            groups.set(groupName, items);
            order.push(groupName);
        }

        items.push({
            name: resource.name,
            label: resource.label ?? resource.name,
            href: resource.routes.list,
            icon: resource.icon,
            order:
                typeof resource.order === "number"
                    ? resource.order
                    : DEFAULT_MENU_ORDER,
        });
    });

    return order.map((groupName) => {
        const items = groups.get(groupName) ?? [];
        const sorted = [...items].sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return a.label.localeCompare(b.label, "zh-CN");
        });
        return { name: groupName, items: sorted };
    });
}

export const adminResources = adminResourceDefinitions;
