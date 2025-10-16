"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTableData } from "@/modules/admin/hooks/use-table-data";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { TenantSummaryRecord } from "@/modules/admin/types/resource.types";
import { createTenantColumns } from "@/utils/data-table";

export function TenantsListRefactoredPage() {
    // 使用统一的表格数据Hook
    const tableData = useTableData<TenantSummaryRecord, { search: string }>({
        resource: "tenants",
        initialFilters: {
            search: "",
        },
        filters: {
            transformFilters: (filters) => {
                const result: Array<{
                    field: string;
                    operator: "contains";
                    value: string;
                }> = [];

                if (filters.search) {
                    result.push({
                        field: "search",
                        operator: "contains",
                        value: filters.search,
                    });
                }

                return result;
            },
        },
    });

    // 使用预定义的列配置
    const columns = useMemo(
        () => createTenantColumns<TenantSummaryRecord>(),
        [],
    );

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="租户总览"
                description="查看所有注册用户的订阅、积分与用量情况。"
                actions={
                    <form
                        className="flex w-full gap-2 md:w-auto"
                        onSubmit={(event) => event.preventDefault()}
                    >
                        <Input
                            placeholder="搜索邮箱或名称"
                            value={tableData.filters.search}
                            onChange={(event) =>
                                tableData.updateFilter(
                                    "search",
                                    event.target.value,
                                )
                            }
                        />
                        <Button type="submit" variant="outline">
                            搜索
                        </Button>
                    </form>
                }
            />
            <DataTable
                columns={columns}
                data={tableData.data}
                isLoading={tableData.isLoading}
                itemNameSingular="租户"
                itemNamePlural="租户"
                pageIndex={tableData.pagination.pageIndex}
                pageSize={tableData.pagination.pageSize}
                pageCount={tableData.pagination.pageCount}
                totalCount={tableData.totalCount}
                onPageChange={tableData.setPageIndex}
                onPageSizeChange={(newPageSize) => {
                    tableData.setPageSize(newPageSize);
                }}
                getRowHref={(row) => adminRoutes.tenants.show(String(row.id))}
            />
        </div>
    );
}
