"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 导入新的优化工具
import { useDataTable } from "@/hooks/data";
import type { CreditHistoryEntry } from "@/modules/admin/types/resource.types";
import {
    createCreditHistoryColumns,
    predefinedColumns,
} from "@/utils/data-table";

/**
 * 优化后的积分历史页面
 * 展示了如何处理复杂的数据场景
 */
export function CreditsHistoryPageOptimized() {
    // 使用DataTable Hook，支持过滤器
    const tableData = useDataTable<CreditHistoryEntry>({
        resource: "credits-history",
        columns: [], // 将在下面创建
        itemNameSingular: "积分记录",
        itemNamePlural: "积分记录",
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

    // 使用列工厂创建积分历史列
    const columns = useMemo(() => {
        // 获取标准积分历史列
        const standardColumns =
            createCreditHistoryColumns<CreditHistoryEntry>();

        // 自定义ID列显示
        const idColumn = {
            ...predefinedColumns.id<CreditHistoryEntry>("记录"),
            cell: ({ row }) => (
                <div className="font-medium">#{row.getValue("id")}</div>
            ),
        };

        // 替换第一列为自定义ID列
        return [idColumn, ...standardColumns.slice(1)];
    }, []);

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="积分流水"
                description="追踪积分增减，支持按租户筛选。"
                actions={
                    <form
                        className="flex w-full gap-2 md:w-auto"
                        onSubmit={(event) => event.preventDefault()}
                    >
                        <Input
                            placeholder="按租户 ID 过滤"
                            value={tableData.filterValues.tenantId || ""}
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
                itemNameSingular="积分记录"
                itemNamePlural="积分记录"
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
