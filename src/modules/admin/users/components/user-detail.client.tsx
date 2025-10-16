"use client";

import { useOne } from "@refinedev/core";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { AdminUserDetail } from "@/modules/admin/users/models";

interface UserDetailClientProps {
    userId: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("zh-CN", {
    numeric: "auto",
});

const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return dateTimeFormatter.format(date);
};

const formatRelativeTime = (value: string | null | undefined) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const now = Date.now();
    const diff = date.getTime() - now;

    const divisions: Array<{
        amount: number;
        unit: Intl.RelativeTimeFormatUnit;
    }> = [
        { amount: 1000, unit: "second" },
        { amount: 60, unit: "minute" },
        { amount: 60, unit: "hour" },
        { amount: 24, unit: "day" },
        { amount: 7, unit: "week" },
        { amount: 4.34524, unit: "month" },
        { amount: 12, unit: "year" },
    ];

    let duration = diff / divisions[0].amount;
    let unit: Intl.RelativeTimeFormatUnit = divisions[0].unit;

    for (let index = 1; index < divisions.length; index++) {
        const division = divisions[index];
        if (Math.abs(duration) < division.amount) {
            break;
        }
        duration /= division.amount;
        unit = division.unit;
    }

    return relativeFormatter.format(Math.round(duration), unit);
};

const getInitials = (value: string | null | undefined) => {
    if (!value) {
        return "U";
    }

    const [first] = value;
    return (first ?? "U").toUpperCase();
};

const DEFAULT_TABLE_SKELETON_ROWS = 4;
const STATS_SKELETON_KEYS = Array.from(
    { length: 4 },
    (_, index) => `user-detail-stats-${index}`,
);
const TABLE_SKELETON_KEYS = Array.from(
    { length: DEFAULT_TABLE_SKELETON_ROWS },
    (_, index) => `user-detail-table-${index}`,
);

function UserDetailSkeleton() {
    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="用户详情"
                description="查看用户资料、积分与用量数据。"
                breadcrumbs={[
                    { label: "Admin", href: adminRoutes.dashboard.overview },
                    { label: "用户管理", href: adminRoutes.users.list },
                    { label: "加载中" },
                ]}
            />

            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Skeleton className="size-16 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-48" />
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {STATS_SKELETON_KEYS.map((key) => (
                        <div key={key} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-[var(--grid-gap-section)] md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="mt-2 h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-20 w-full rounded-md" />
                            <Skeleton className="h-20 w-full rounded-md" />
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-36" />
                            <div className="space-y-2">
                                {TABLE_SKELETON_KEYS.map((key) => (
                                    <Skeleton
                                        key={`credits-${key}`}
                                        className="h-6 w-full rounded"
                                    />
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-36" />
                            <div className="space-y-2">
                                {TABLE_SKELETON_KEYS.map((key) => (
                                    <Skeleton
                                        key={`transactions-${key}`}
                                        className="h-6 w-full rounded"
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="mt-2 h-4 w-52" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {TABLE_SKELETON_KEYS.map((key) => (
                            <Skeleton
                                key={`usage-${key}`}
                                className="h-6 w-full rounded"
                            />
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-5 w-3/5" />
                </CardContent>
            </Card>
        </div>
    );
}

export function UserDetailClient({ userId }: UserDetailClientProps) {
    const { query } = useOne<AdminUserDetail>({
        resource: "users",
        id: userId,
    });

    if (query.isLoading) {
        return <UserDetailSkeleton />;
    }

    if (query.error) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader
                    title="用户详情"
                    breadcrumbs={[
                        {
                            label: "Admin",
                            href: adminRoutes.dashboard.overview,
                        },
                        { label: "用户管理", href: adminRoutes.users.list },
                        { label: "加载失败" },
                    ]}
                />
                <div className="py-10 text-center text-destructive">
                    加载用户数据时出现错误，请稍后重试。
                </div>
            </div>
        );
    }

    const detail = query.data?.data;

    if (!detail) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader
                    title="用户详情"
                    breadcrumbs={[
                        {
                            label: "Admin",
                            href: adminRoutes.dashboard.overview,
                        },
                        { label: "用户管理", href: adminRoutes.users.list },
                        { label: "未找到用户" },
                    ]}
                />
                <div className="py-10 text-center text-muted-foreground">
                    未找到该用户。
                </div>
            </div>
        );
    }

    const subscriptionSummary = detail.subscriptions.length
        ? `最新订阅：${detail.subscriptions[0].status ?? "未知状态"}`
        : "暂无订阅记录";

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="用户详情"
                description="查看用户资料、积分与用量数据。"
                breadcrumbs={[
                    { label: "Admin", href: adminRoutes.dashboard.overview },
                    { label: "用户管理", href: adminRoutes.users.list },
                    { label: detail.user.email ?? detail.user.id },
                ]}
            />

            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                        {getInitials(detail.user.email ?? detail.user.name)}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                        <CardTitle className="text-2xl">
                            {detail.user.name ??
                                detail.user.email ??
                                "未命名用户"}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            用户 ID：{detail.user.id}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Badge
                                variant={
                                    detail.user.role === "admin"
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                {detail.user.role === "admin"
                                    ? "管理员"
                                    : "普通用户"}
                            </Badge>
                            <Badge
                                variant={
                                    detail.user.status === "active"
                                        ? "default"
                                        : "outline"
                                }
                            >
                                {detail.user.status === "active"
                                    ? "已验证"
                                    : "待验证"}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">邮箱</p>
                        <p className="text-sm">
                            {detail.user.email ?? "未填写"}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            创建时间
                        </p>
                        <p className="text-sm">
                            {formatDateTime(detail.user.createdAt)}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            最近更新
                        </p>
                        <p className="text-sm">
                            {formatRelativeTime(detail.user.updatedAt)}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            最新订阅状态
                        </p>
                        <p className="text-sm">{subscriptionSummary}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-[var(--grid-gap-section)] md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>积分信息</CardTitle>
                        <CardDescription>
                            当前积分与最近一次同步时间。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    当前积分
                                </p>
                                <p className="text-2xl font-semibold">
                                    {detail.user.currentCredits}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    积分刷新时间
                                </p>
                                <p className="text-sm">
                                    {formatRelativeTime(
                                        detail.user.lastCreditRefreshAt,
                                    )}
                                </p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                充值渠道（Creem）流水
                            </p>
                            {detail.creditsHistory.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    暂无积分流水记录。
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-md border">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    类型
                                                </th>
                                                <th className="px-3 py-2">
                                                    数量
                                                </th>
                                                <th className="px-3 py-2">
                                                    时间
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.creditsHistory.map(
                                                (item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="border-t"
                                                    >
                                                        <td className="px-3 py-2">
                                                            {item.type}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {item.amount}
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-muted-foreground">
                                                            {formatDateTime(
                                                                item.createdAt,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                系统交易记录
                            </p>
                            {detail.transactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    暂无系统交易记录。
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-md border">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    类型
                                                </th>
                                                <th className="px-3 py-2">
                                                    数量
                                                </th>
                                                <th className="px-3 py-2">
                                                    剩余
                                                </th>
                                                <th className="px-3 py-2">
                                                    描述
                                                </th>
                                                <th className="px-3 py-2">
                                                    创建时间
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.transactions.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-t"
                                                >
                                                    <td className="px-3 py-2 uppercase">
                                                        {item.type}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.amount}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.remainingAmount}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-muted-foreground">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-muted-foreground">
                                                        {formatDateTime(
                                                            item.createdAt,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>用量数据</CardTitle>
                        <CardDescription>
                            近 30 条用量统计，帮助快速洞察使用情况。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {detail.usage.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                暂无用量记录。
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2">日期</th>
                                            <th className="px-3 py-2">功能</th>
                                            <th className="px-3 py-2">数量</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.usage.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-t"
                                            >
                                                <td className="px-3 py-2">
                                                    {item.date}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.feature}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.totalAmount}{" "}
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.unit}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>安全配置</CardTitle>
                    <CardDescription>
                        尚未接入 Passkey 等高级安全特性。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        当前项目未启用 Passkey，后续若有需要可在此扩展展示。
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
