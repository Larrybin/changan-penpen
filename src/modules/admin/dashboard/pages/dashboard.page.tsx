"use client";

import { useCustom } from "@refinedev/core";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { UsageSparkline } from "@/modules/admin/dashboard/components/usage-sparkline";
import adminRoutes from "@/modules/admin/routes/admin.routes";

interface DashboardMetricsPayload {
    totals: {
        revenueCents: number;
        orderCount: number;
        activeSubscriptions: number;
        tenantCount: number;
        totalCredits: number;
    };
    usageTrend: Array<{ date: string; amount: number; unit: string }>;
    latestOrders: Array<{
        id: number;
        amountCents: number;
        currency: string;
        createdAt: string;
        customerEmail: string | null;
        status: string | null;
    }>;
    recentCredits: Array<{
        id: number;
        amount: number;
        createdAt: string;
        customerEmail: string | null;
        type: string | null;
    }>;
    catalogSummary: {
        products: number;
        coupons: number;
        contentPages: number;
    };
}

function formatCurrency(cents: number) {
    return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "USD",
    }).format((cents ?? 0) / 100);
}

export function AdminDashboardPage() {
    const { query } = useCustom<DashboardMetricsPayload>({
        url: "/dashboard",
        method: "get",
        queryOptions: {
            staleTime: 1000 * 60,
        },
    });

    const isLoading = query.isLoading;
    const payload = query.data?.data;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        站长总览
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        查看订单、营收、积分以及用量表现，快速跳转到常用运营操作。
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={adminRoutes.catalog.contentPages}>
                            内容管理
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={adminRoutes.catalog.products}>
                            商品管理
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={adminRoutes.catalog.coupons}>
                            发放优惠券
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={adminRoutes.reports.list}>导出报表</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardDescription>总营收</CardDescription>
                        <CardTitle className="text-2xl">
                            {isLoading
                                ? "-"
                                : formatCurrency(
                                      payload?.totals.revenueCents ?? 0,
                                  )}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>订单数</CardDescription>
                        <CardTitle className="text-2xl">
                            {isLoading
                                ? "-"
                                : (payload?.totals.orderCount ?? 0)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>活跃订阅</CardDescription>
                        <CardTitle className="text-2xl">
                            {isLoading
                                ? "-"
                                : (payload?.totals.activeSubscriptions ?? 0)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>站点积分总额</CardDescription>
                        <CardTitle className="text-2xl">
                            {isLoading
                                ? "-"
                                : (payload?.totals.totalCredits ?? 0)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>过去 30 日用量趋势</CardTitle>
                        <CardDescription>
                            追踪租户整体使用情况，快速识别活跃高峰。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UsageSparkline data={payload?.usageTrend ?? []} />
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                            {(payload?.usageTrend ?? [])
                                .slice(-3)
                                .map((item) => (
                                    <div key={item.date} className="space-y-1">
                                        <div className="text-muted-foreground">
                                            {item.date}
                                        </div>
                                        <div className="font-medium">
                                            {item.amount}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>目录概况</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">商品</span>
                            <span className="font-medium">
                                {payload?.catalogSummary.products ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                优惠券
                            </span>
                            <span className="font-medium">
                                {payload?.catalogSummary.coupons ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                内容页
                            </span>
                            <span className="font-medium">
                                {payload?.catalogSummary.contentPages ?? 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>最新订单</CardTitle>
                        <CardDescription>
                            查看近期支付动态，及时跟进高价值租户。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-muted-foreground">
                                    <tr>
                                        <th className="py-2 pr-4 font-medium">
                                            订单 ID
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            租户邮箱
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            金额
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            状态
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(payload?.latestOrders ?? []).map(
                                        (order) => (
                                            <tr
                                                key={order.id}
                                                className="border-t"
                                            >
                                                <td className="py-2 pr-4">
                                                    #{order.id}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {order.customerEmail ?? "-"}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {formatCurrency(
                                                        order.amountCents,
                                                    )}
                                                </td>
                                                <td className="py-2 pr-4 capitalize">
                                                    {order.status ?? "-"}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                    {!payload?.latestOrders?.length &&
                                        !isLoading && (
                                            <tr>
                                                <td
                                                    className="py-6 text-center text-muted-foreground"
                                                    colSpan={4}
                                                >
                                                    暂无订单数据。
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>最新积分变动</CardTitle>
                        <CardDescription>
                            了解补发、扣减积分的最新记录。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-muted-foreground">
                                    <tr>
                                        <th className="py-2 pr-4 font-medium">
                                            记录
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            租户
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            积分
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            类型
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(payload?.recentCredits ?? []).map(
                                        (entry) => (
                                            <tr
                                                key={entry.id}
                                                className="border-t"
                                            >
                                                <td className="py-2 pr-4">
                                                    #{entry.id}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {entry.customerEmail ?? "-"}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {entry.amount}
                                                </td>
                                                <td className="py-2 pr-4 uppercase">
                                                    {entry.type ?? "-"}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                    {!payload?.recentCredits?.length &&
                                        !isLoading && (
                                            <tr>
                                                <td
                                                    className="py-6 text-center text-muted-foreground"
                                                    colSpan={4}
                                                >
                                                    暂无积分流水。
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
