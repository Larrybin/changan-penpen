"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueryKeys } from "@/lib/query/keys";
import { adminApiClient } from "@/modules/admin/api/client";
import { UsageSparkline } from "@/modules/admin/dashboard/components/usage-sparkline";
import adminRoutes from "@/modules/admin/routes/admin.routes";

const ORDER_SKELETON_ROW_KEYS = Array.from(
    { length: 4 },
    (_, index) => `admin-dashboard-orders-row-${index}`,
);
const ORDER_SKELETON_CELL_KEYS = Array.from(
    { length: 4 },
    (_, index) => `admin-dashboard-orders-cell-${index}`,
);
const CREDIT_SKELETON_ROW_KEYS = Array.from(
    { length: 4 },
    (_, index) => `admin-dashboard-credits-row-${index}`,
);
const CREDIT_SKELETON_CELL_KEYS = Array.from(
    { length: 4 },
    (_, index) => `admin-dashboard-credits-cell-${index}`,
);

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

interface MetricCardDefinition {
    label: string;
    value: string;
    skeletonClassName: string;
}

function DashboardActions() {
    return (
        <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
                <Link href={adminRoutes.catalog.contentPages}>内容管理</Link>
            </Button>
            <Button asChild variant="outline">
                <Link href={adminRoutes.catalog.products}>商品管理</Link>
            </Button>
            <Button asChild variant="outline">
                <Link href={adminRoutes.catalog.coupons}>发放优惠券</Link>
            </Button>
            <Button asChild>
                <Link href={adminRoutes.reports.list}>导出报表</Link>
            </Button>
        </div>
    );
}

function MetricCards({
    metrics,
    isLoading,
}: {
    metrics: MetricCardDefinition[];
    isLoading: boolean;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
                <Card key={metric.label}>
                    <CardHeader>
                        <CardDescription>{metric.label}</CardDescription>
                        <CardTitle className="text-2xl">
                            {isLoading ? (
                                <Skeleton
                                    className={`h-7 ${metric.skeletonClassName}`}
                                />
                            ) : (
                                metric.value
                            )}
                        </CardTitle>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

function TrendCard({
    usageTrend,
    isLoading,
}: {
    usageTrend: DashboardMetricsPayload["usageTrend"];
    isLoading: boolean;
}) {
    const hasTrendData = usageTrend.length > 0;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>过去 30 日用量趋势</CardTitle>
                <CardDescription>
                    追踪租户整体使用情况，快速识别活跃高峰。
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-48 w-full rounded-lg" />
                ) : hasTrendData ? (
                    <>
                        <UsageSparkline data={usageTrend} />
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                            {usageTrend.slice(-3).map((item) => (
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
                    </>
                ) : (
                    <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                        暂无趋势数据。
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function CatalogSummaryCard({
    summary,
    isLoading,
}: {
    summary: DashboardMetricsPayload["catalogSummary"];
    isLoading: boolean;
}) {
    const items = [
        { label: "商品", value: summary.products, skeletonClassName: "w-10" },
        { label: "优惠券", value: summary.coupons, skeletonClassName: "w-12" },
        {
            label: "内容页",
            value: summary.contentPages,
            skeletonClassName: "w-14",
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>目录概况</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between"
                    >
                        <span className="text-muted-foreground">
                            {item.label}
                        </span>
                        <span className="font-medium">
                            {isLoading ? (
                                <Skeleton
                                    className={`h-5 ${item.skeletonClassName}`}
                                />
                            ) : (
                                item.value
                            )}
                        </span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function LatestOrdersCard({
    isLoading,
    orders,
}: {
    isLoading: boolean;
    orders: DashboardMetricsPayload["latestOrders"];
}) {
    return (
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
                                <th className="py-2 pr-4 font-medium">金额</th>
                                <th className="py-2 pr-4 font-medium">状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading &&
                                ORDER_SKELETON_ROW_KEYS.map((rowKey) => (
                                    <tr key={rowKey} className="border-t">
                                        {ORDER_SKELETON_CELL_KEYS.map(
                                            (cellKey) => (
                                                <td
                                                    key={`${rowKey}-${cellKey}`}
                                                    className="py-2 pr-4"
                                                >
                                                    <Skeleton className="h-5 w-full" />
                                                </td>
                                            ),
                                        )}
                                    </tr>
                                ))}
                            {orders.map((order) => (
                                <tr key={order.id} className="border-t">
                                    <td className="py-2 pr-4">#{order.id}</td>
                                    <td className="py-2 pr-4">
                                        {order.customerEmail ?? "-"}
                                    </td>
                                    <td className="py-2 pr-4">
                                        {formatCurrency(order.amountCents)}
                                    </td>
                                    <td className="py-2 pr-4 capitalize">
                                        {order.status ?? "-"}
                                    </td>
                                </tr>
                            ))}
                            {!orders.length && !isLoading && (
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
    );
}

function LatestCreditsCard({
    isLoading,
    credits,
}: {
    isLoading: boolean;
    credits: DashboardMetricsPayload["recentCredits"];
}) {
    return (
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
                                <th className="py-2 pr-4 font-medium">记录</th>
                                <th className="py-2 pr-4 font-medium">租户</th>
                                <th className="py-2 pr-4 font-medium">积分</th>
                                <th className="py-2 pr-4 font-medium">类型</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading &&
                                CREDIT_SKELETON_ROW_KEYS.map((rowKey) => (
                                    <tr key={rowKey} className="border-t">
                                        {CREDIT_SKELETON_CELL_KEYS.map(
                                            (cellKey) => (
                                                <td
                                                    key={`${rowKey}-${cellKey}`}
                                                    className="py-2 pr-4"
                                                >
                                                    <Skeleton className="h-5 w-full" />
                                                </td>
                                            ),
                                        )}
                                    </tr>
                                ))}
                            {credits.map((entry) => (
                                <tr key={entry.id} className="border-t">
                                    <td className="py-2 pr-4">#{entry.id}</td>
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
                            ))}
                            {!credits.length && !isLoading && (
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
    );
}

export function AdminDashboardPage() {
    const query = useQuery<DashboardMetricsPayload | null>({
        queryKey: [...adminQueryKeys.resource("dashboard"), "metrics"],
        queryFn: async () => {
            const response = await adminApiClient.get<{
                data?: DashboardMetricsPayload;
            }>("/dashboard");
            return response.data.data ?? null;
        },
        // 优化查询配置，配合后端缓存
        staleTime: 1000 * 30, // 30秒内认为数据新鲜
        gcTime: 1000 * 60 * 5, // 5分钟内存缓存
        refetchOnWindowFocus: false, // 减少网络请求
        retry: 2, // 最多重试2次

        // 启用后台重新获取，保持数据相对新鲜
        refetchInterval: false, // 禁用自动轮询，但可以通过手动刷新
        refetchIntervalInBackground: false,

        // 网络重连时重新获取
        refetchOnReconnect: true,
    });

    const isLoading = query.isLoading;
    const payload = query.data ?? null;
    const usageTrend = payload?.usageTrend ?? [];
    const latestOrders = payload?.latestOrders ?? [];
    const recentCredits = payload?.recentCredits ?? [];
    const catalogSummary = payload?.catalogSummary ?? {
        products: 0,
        coupons: 0,
        contentPages: 0,
    };
    const metricCards: MetricCardDefinition[] = [
        {
            label: "总营收",
            value: formatCurrency(payload?.totals?.revenueCents ?? 0),
            skeletonClassName: "w-24",
        },
        {
            label: "订单数",
            value: (payload?.totals?.orderCount ?? 0).toString(),
            skeletonClassName: "w-16",
        },
        {
            label: "活跃订阅",
            value: (payload?.totals?.activeSubscriptions ?? 0).toString(),
            skeletonClassName: "w-16",
        },
        {
            label: "站点积分总额",
            value: (payload?.totals?.totalCredits ?? 0).toLocaleString(),
            skeletonClassName: "w-24",
        },
    ] as const;

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="站长总览"
                description="查看订单、营收、积分以及用量表现，快速跳转到常用运营操作。"
                actions={<DashboardActions />}
            />

            <MetricCards metrics={metricCards} isLoading={isLoading} />

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <TrendCard usageTrend={usageTrend} isLoading={isLoading} />
                <CatalogSummaryCard
                    summary={catalogSummary}
                    isLoading={isLoading}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <LatestOrdersCard isLoading={isLoading} orders={latestOrders} />
                <LatestCreditsCard
                    isLoading={isLoading}
                    credits={recentCredits}
                />
            </div>
        </div>
    );
}
