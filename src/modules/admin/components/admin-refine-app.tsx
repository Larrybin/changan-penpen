"use client";

import { Refine } from "@refinedev/core";
import { adminAuthProvider } from "@/modules/admin/providers/auth-provider";
import { adminDataProvider } from "@/modules/admin/providers/data-provider";
import {
    AdminToaster,
    notificationProvider,
} from "@/modules/admin/providers/notification-provider";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { AuthUser } from "@/modules/auth/models/user.model";
import { AdminShell } from "./admin-shell";

interface AdminRefineAppProps {
    children: React.ReactNode;
    user: AuthUser;
}

export function AdminRefineApp({ children, user }: AdminRefineAppProps) {
    return (
        <Refine
            authProvider={adminAuthProvider}
            dataProvider={adminDataProvider}
            notificationProvider={notificationProvider}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
            }}
            resources={[
                {
                    name: "dashboard",
                    list: adminRoutes.dashboard.overview,
                    meta: {
                        label: "总览",
                        icon: "layout-dashboard",
                        order: 0,
                    },
                },
                {
                    name: "tenants",
                    list: adminRoutes.tenants.list,
                    show: adminRoutes.tenants.show(":id"),
                    meta: {
                        label: "租户",
                        icon: "users",
                        group: "运营",
                    },
                },
                {
                    name: "orders",
                    list: adminRoutes.billing.orders,
                    meta: {
                        label: "订单",
                        icon: "receipt",
                        group: "营收",
                    },
                },
                {
                    name: "credits-history",
                    list: adminRoutes.billing.credits,
                    meta: {
                        label: "积分流水",
                        icon: "coins",
                        group: "营收",
                    },
                },
                {
                    name: "usage",
                    list: adminRoutes.usage.list,
                    meta: {
                        label: "用量监控",
                        icon: "activity",
                        group: "运营",
                    },
                },
                {
                    name: "products",
                    list: adminRoutes.catalog.products,
                    create: `${adminRoutes.catalog.products}/create`,
                    edit: `${adminRoutes.catalog.products}/edit/:id`,
                    meta: {
                        label: "商品",
                        icon: "package",
                        group: "目录",
                    },
                },
                {
                    name: "coupons",
                    list: adminRoutes.catalog.coupons,
                    create: `${adminRoutes.catalog.coupons}/create`,
                    edit: `${adminRoutes.catalog.coupons}/edit/:id`,
                    meta: {
                        label: "优惠券",
                        icon: "ticket",
                        group: "目录",
                    },
                },
                {
                    name: "content-pages",
                    list: adminRoutes.catalog.contentPages,
                    create: `${adminRoutes.catalog.contentPages}/create`,
                    edit: `${adminRoutes.catalog.contentPages}/edit/:id`,
                    meta: {
                        label: "内容页",
                        icon: "file-text",
                        group: "目录",
                    },
                },
                {
                    name: "site-settings",
                    list: adminRoutes.settings.site,
                    meta: {
                        label: "站点设置",
                        icon: "settings",
                        group: "配置",
                    },
                },
                {
                    name: "reports",
                    list: adminRoutes.reports.list,
                    meta: {
                        label: "报表导出",
                        icon: "file-chart",
                        group: "配置",
                    },
                },
                {
                    name: "audit-logs",
                    list: adminRoutes.auditLogs.list,
                    meta: {
                        label: "操作日志",
                        icon: "clipboard-list",
                        group: "配置",
                    },
                },
                {
                    name: "todos",
                    list: adminRoutes.todos.list,
                    create: adminRoutes.todos.create,
                    edit: adminRoutes.todos.edit(":id"),
                    meta: {
                        icon: "check-square",
                    },
                },
                {
                    name: "categories",
                    meta: {
                        hide: true,
                    },
                },
            ]}
        >
            <AdminShell user={user}>{children}</AdminShell>
            <AdminToaster />
        </Refine>
    );
}
