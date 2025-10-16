"use client";

import { useMemo } from "react";
import type { CellContext } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 导入新的优化工具
import { useDataTable } from "@/hooks/data";
import type { OrderRecord } from "@/modules/admin/types/resource.types";
import { createOrderColumns, predefinedColumns } from "@/utils/data-table";

/**
 * 优化后的订单列表页面
 * 展示了如何处理过滤器场景
 */
export function OrdersListPageOptimized() {
    // 使用DataTable Hook，支持过滤器
    const tableData = useDataTable<OrderRecord>({
        resource: "orders",
        columns: [], // 将在下面创建
        itemNameSingular: "订单",
        itemNamePlural: "订单",
        enableSearch: false, // 禁用默认搜索，使用自定义过滤
        searchOptions: {
            // 配置过滤器
            filters: [
                {
                    field: "tenantId",
                    operator: "eq",
                },
            ],
        },
    });

    // 使用列工厂创建订单列
    const columns = useMemo(() => {
        // 获取标准订单列
        const standardColumns = createOrderColumns<OrderRecord>();

        // 自定义ID列显示
        const idColumn = {
            ...predefinedColumns.id<OrderRecord>("订单"),
            cell: ({ row }: CellContext<OrderRecord, unknown>) => (
                <div className="font-medium">#{row.getValue("id")}</div>
            ),
        };

        // 替换第一列为自定义ID列
        return [idColumn, ...standardColumns.slice(1)];
    }, []);

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="订单与营收"
                description="按租户查看订单流水与金额。"
                actions={
                    <form
                        className="flex w-full gap-2 md:w-auto"
                        onSubmit={(event) => event.preventDefault()}
                    >
                        <Input
                            placeholder="按租户 ID 过滤"
                            value={
                                typeof tableData.filterValues.tenantId ===
                                "string"
                                    ? tableData.filterValues.tenantId
                                    : ""
                            }
                            onChange={(event) =>
                                tableData.setFilter?.(
                                    "tenantId",
                                    event.target.value,
                                )
                            }
                        />
                        <Button type="submit" variant="outline">
                            筛选
                        </Button>
                        {tableData.hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    tableData.setFilter?.("tenantId", "")
                                }
                            >
                                清除
                            </Button>
                        )}
                    </form>
                }
            />

            <DataTable
                columns={columns}
                data={tableData.data}
                isLoading={tableData.isLoading}
                itemNameSingular="订单"
                itemNamePlural="订单"
                pageIndex={tableData.pageIndex}
                pageSize={tableData.pageSize}
                pageCount={tableData.pageCount}
                totalCount={tableData.totalCount}
                onPageChange={tableData.setPageIndex}
                onPageSizeChange={tableData.setPageSize}
            />
        </div>
    );
}
