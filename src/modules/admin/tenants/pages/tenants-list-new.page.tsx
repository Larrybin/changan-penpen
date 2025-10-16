"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 导入新的工具
import { useSimpleDataTable } from "@/hooks/data";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { TenantSummaryRecord } from "@/modules/admin/types/resource.types";
import { createTenantColumns, predefinedColumns } from "@/utils/data-table";

/**
 * 重构后的租户列表页面
 * 使用新的数据表格工具，大大简化代码
 */
export function TenantsListPageRefactored() {
    // 使用统一的Hook管理数据
    const {
        data: tenants,
        isLoading,
        search,
        setSearch,
        hasActiveFilters,
        pageIndex,
        pageSize,
        pageCount,
        totalCount,
        setPageIndex,
        setPageSize,
    } = useSimpleDataTable<TenantSummaryRecord>({
        resource: "tenants",
        columns: [], // 将在下面使用columnFactory创建
        itemNameSingular: "租户",
        itemNamePlural: "租户",
        enableSearch: true,
    });

    // 使用列工厂创建表格列
    const columns = useMemo(() => {
        const baseColumns = createTenantColumns<TenantSummaryRecord>();

        const actionsColumn = predefinedColumns.actions<TenantSummaryRecord>(
            (row) => (
                <Button asChild size="sm" variant="ghost">
                    <Link href={adminRoutes.tenants.show(String(row.id))}>
                        查看
                    </Link>
                </Button>
            ),
        );

        return [...baseColumns, actionsColumn];
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
                            value={search || ""}
                            onChange={(event) =>
                                setSearch?.(event.target.value)
                            }
                        />
                        <Button type="submit" variant="outline">
                            搜索
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSearch?.("")}
                            >
                                清除
                            </Button>
                        )}
                    </form>
                }
            />

            <DataTable
                columns={columns}
                data={tenants}
                isLoading={isLoading}
                itemNameSingular="租户"
                itemNamePlural="租户"
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageCount={pageCount}
                totalCount={totalCount}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                getRowHref={(row) => adminRoutes.tenants.show(String(row.id))}
            />
        </div>
    );
}
