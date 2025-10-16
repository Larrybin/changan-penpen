"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 导入新的优化工具
import { useSimpleDataTable } from "@/hooks/data";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { TenantSummaryRecord } from "@/modules/admin/types/resource.types";
import { createTenantColumns, predefinedColumns } from "@/utils/data-table";

/**
 * 优化后的租户列表页面 - 使用列工厂
 * 展示了如何最大化利用预定义的列配置
 */
export function TenantsListPageOptimized() {
    // 使用统一的Hook管理所有数据状态
    const tableData = useSimpleDataTable<TenantSummaryRecord>({
        resource: "tenants",
        columns: [], // 列将在下面创建
        itemNameSingular: "租户",
        itemNamePlural: "租户",
        enableSearch: true,
    });

    // 使用列工厂创建标准列 + 自定义操作列
    const columns = useMemo(() => {
        // 获取标准的租户列
        const standardColumns = createTenantColumns<TenantSummaryRecord>();

        // 添加操作列
        const actionsColumn = predefinedColumns.actions<TenantSummaryRecord>(
            (row) => (
                <Button asChild size="sm" variant="ghost">
                    <Link href={adminRoutes.tenants.show(String(row.id))}>
                        查看
                    </Link>
                </Button>
            ),
        );

        return [...standardColumns, actionsColumn];
    }, []);

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
                            value={tableData.search || ""}
                            onChange={(event) =>
                                tableData.setSearch?.(event.target.value)
                            }
                        />
                        <Button type="submit" variant="outline">
                            搜索
                        </Button>
                        {tableData.hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => tableData.setSearch?.("")}
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
                itemNameSingular="租户"
                itemNamePlural="租户"
                pageIndex={tableData.pageIndex}
                pageSize={tableData.pageSize}
                pageCount={tableData.pageCount}
                totalCount={tableData.totalCount}
                onPageChange={tableData.setPageIndex}
                onPageSizeChange={tableData.setPageSize}
                getRowHref={(row) => adminRoutes.tenants.show(String(row.id))}
            />
        </div>
    );
}
