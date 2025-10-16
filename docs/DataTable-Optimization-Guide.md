# 数据表格优化指南

## 概述

本指南介绍如何使用新的数据表格优化工具来简化 Admin 模块中的 DataTable 实现，减少代码重复，提高开发效率。

## 问题分析

### 原有代码存在的问题

1. **分页状态重复**：每个页面都重复定义 `pageIndex`, `pageSize`, `pageCount` 状态
2. **Column定义重复**：相似的列定义模式在不同页面间重复
3. **搜索逻辑重复**：搜索状态和过滤器逻辑在多个页面中重复实现
4. **维护困难**：修改一个功能需要在多个文件中进行相同的更改

### 解决方案

通过创建统一的工具函数和 Hook，将通用逻辑抽象出来，实现代码复用。

## 新工具架构

### 1. Hook层 (`src/hooks/data/`)

#### `usePaginatedData`
统一分页逻辑的核心Hook，提供：
- 分页状态管理
- 数据获取
- 分页操作方法
- 分页状态计算

```typescript
const {
    data,
    isLoading,
    pageIndex,
    pageSize,
    pageCount,
    totalCount,
    setPageIndex,
    setPageSize,
    goToNextPage,
    goToPreviousPage,
    refresh,
} = usePaginatedData({
    resource: "tenants",
    initialPageSize: 20,
});
```

#### `useSearchFilter`
统一搜索和过滤器逻辑，提供：
- 搜索状态管理
- 过滤器管理
- 防抖搜索
- 预定义过滤器配置

```typescript
const {
    search,
    filters,
    filterValues,
    setSearch,
    setFilter,
    clearSearch,
    hasActiveFilters,
} = useSearchFilter({
    searchFields: ["email", "name"],
    filters: [
        { field: "status", operator: "eq" }
    ],
});
```

#### `useDataTable`
组合Hook，整合分页、搜索、过滤功能：
```typescript
const tableData = useSimpleDataTable({
    resource: "tenants",
    columns: columns,
    itemNameSingular: "租户",
    itemNamePlural: "租户",
    enableSearch: true,
});
```

### 2. 工具层 (`src/utils/data-table/`)

#### `columnFactory`
提供预定义的列定义和列生成器：
- 格式化工具函数
- 预定义列类型
- 批量列创建功能

```typescript
// 使用预定义列
const columns = [
    predefinedColumns.email<T>("租户"),
    predefinedColumns.amount<T>("amountCents", "金额"),
    predefinedColumns.createdAt<T>(),
    predefinedColumns.actions<T>((row) => <Button>查看</Button>),
];

// 使用批量创建
const columns = createTenantColumns<T>();
```

#### `DataTableProvider`
提供上下文和默认配置：
```typescript
<DataTableProvider config={{ defaultPageSize: 30 }}>
    <App />
</DataTableProvider>
```

## 使用指南

### 基础用法（推荐）

对于简单的列表页面，使用 `useSimpleDataTable`：

```typescript
"use client";

import { useSimpleDataTable } from "@/hooks/data";
import { createTenantColumns, predefinedColumns } from "@/utils/data-table";
import { DataTable } from "@/components/data/data-table";

export function TenantsListPage() {
    const tableData = useSimpleDataTable<TenantSummaryRecord>({
        resource: "tenants",
        columns: [], // 将使用列工厂创建
        itemNameSingular: "租户",
        itemNamePlural: "租户",
        enableSearch: true,
    });

    // 使用列工厂创建列
    const columns = useMemo(() => [
        ...createTenantColumns<TenantSummaryRecord>(),
        predefinedColumns.actions<TenantSummaryRecord>(
            (row) => <Button>查看</Button>
        ),
    ], []);

    return (
        <DataTable
            columns={columns}
            data={tableData.data}
            isLoading={tableData.isLoading}
            // ... 其他DataTable属性
            {...tableData}
        />
    );
}
```

### 高级用法

对于需要自定义过滤器的页面：

```typescript
export function OrdersListPage() {
    const tableData = useDataTable<OrderRecord>({
        resource: "orders",
        columns: createOrderColumns<OrderRecord>(),
        itemNameSingular: "订单",
        itemNamePlural: "订单",
        enableSearch: false, // 禁用默认搜索
        searchOptions: {
            filters: [
                { field: "tenantId", operator: "eq" },
                { field: "status", operator: "eq" },
            ],
        },
    });

    return (
        <>
            {/* 过滤器UI */}
            <Input
                placeholder="按租户ID过滤"
                value={tableData.filterValues.tenantId || ""}
                onChange={(e) => tableData.setFilter?.("tenantId", e.target.value)}
            />

            <DataTable {...tableData} />
        </>
    );
}
```

## 预定义列类型

### 标准列类型

- `id` - ID列，显示为 `#123`
- `email` - 邮箱列，支持显示名称
- `amount` - 金额列，自动货币格式化
- `status` - 状态列，支持状态映射
- `createdAt` - 创建时间列
- `updatedAt` - 更新时间列
- `actions` - 操作列，需要自定义渲染

### 批量列集合

- `createTenantColumns()` - 租户相关列集合
- `createOrderColumns()` - 订单相关列集合
- `createCreditHistoryColumns()` - 积分历史相关列集合

## 迁移步骤

### 1. 评估现有页面
- 识别重复的分页逻辑
- 分析列定义模式
- 确定搜索/过滤需求

### 2. 选择合适的Hook
- 简单列表：`useSimpleDataTable`
- 复杂过滤：`useDataTable`
- 自定义需求：`usePaginatedData` + `useSearchFilter`

### 3. 使用列工厂
- 检查是否有预定义列集合
- 使用 `predefinedColumns` 创建标准列
- 自定义特殊列

### 4. 测试验证
- 确保分页功能正常
- 验证搜索/过滤逻辑
- 检查列显示和排序

## 性能优化

### 1. 减少重渲染
- 使用 `useMemo` 缓存列定义
- 合理使用 `useCallback`

### 2. 查询优化
- 利用防抖搜索
- 合理的默认页面大小
- 有效的缓存策略

### 3. 内存管理
- 及时清理不需要的状态
- 避免内存泄漏

## 最佳实践

### 1. 代码组织
```typescript
// 推荐：使用列工厂
const columns = useMemo(() => [
    ...createTenantColumns<T>(),
    predefinedColumns.actions<T>(renderActions),
], []);

// 避免：手动定义所有列
const columns = useMemo(() => [
    {
        accessorKey: "email",
        header: "邮箱",
        cell: ({ row }) => { /* 复杂逻辑 */ }
    },
    // ... 更多重复代码
], []);
```

### 2. Hook使用
```typescript
// 推荐：使用组合Hook
const tableData = useSimpleDataTable(options);

// 避免：拆分为多个Hook
const pagination = usePaginatedData(paginationOptions);
const search = useSearchFilter(searchOptions);
// 手动组合状态...
```

### 3. 类型安全
```typescript
// 推荐：明确类型
const columns: ColumnDef<TenantRecord>[] = useMemo(() => [
    // 列定义
], []);

// 避免：隐式类型
const columns = useMemo(() => [
    // 列定义
], []);
```

## 示例对比

### 优化前（原始代码）
```typescript
// 192行代码
export function TenantsListPage() {
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    const filters: CrudFilter[] = useMemo(
        () => search ? [{ field: "search", operator: "contains", value: search }] : [],
        [search],
    );

    const { query, result } = useList<TenantSummaryRecord>({
        resource: "tenants",
        pagination: { current: pageIndex + 1, pageSize },
        filters,
    });

    const isLoading = query.isLoading;
    const tenants = result?.data ?? [];
    const total = result?.total ?? 0;
    const pageCount = Math.ceil(total / pageSize);

    // 139行的列定义...
    const columns: ColumnDef<TenantSummaryRecord>[] = useMemo(() => [
        // 重复的列定义
    ], []);

    return (
        // JSX结构
    );
}
```

### 优化后
```typescript
// 约80行代码，减少60%
export function TenantsListPageOptimized() {
    const tableData = useSimpleDataTable<TenantSummaryRecord>({
        resource: "tenants",
        columns: [], // 使用列工厂
        itemNameSingular: "租户",
        itemNamePlural: "租户",
        enableSearch: true,
    });

    const columns = useMemo(() => [
        ...createTenantColumns<TenantSummaryRecord>(),
        predefinedColumns.actions<TenantSummaryRecord>(
            (row) => <Button>查看</Button>
        ),
    ], []);

    return (
        // 简化的JSX结构
    );
}
```

## 扩展性

### 1. 添加新的预定义列
在 `column-factory.ts` 中添加新的预定义列：

```typescript
export const predefinedColumns = {
    // 现有列...

    // 新列
    category: <T>(label = "分类"): ColumnDef<T> => ({
        accessorKey: "category",
        header: label,
        cell: ({ row }) => {
            // 自定义渲染逻辑
        },
    }),
};
```

### 2. 创建新的列集合
```typescript
export const createProductColumns = <T>(): ColumnDef<T>[] => [
    predefinedColumns.id<T>("产品"),
    predefinedColumns.textColumn<T>("name", "产品名称"),
    predefinedColumns.amount<T>("priceCents", "价格"),
    predefinedColumns.status<T>("status", "状态"),
    predefinedColumns.createdAt<T>(),
];
```

### 3. 添加新的Hook
```typescript
export const useProductSearch = createSearchFilterHook({
    searchFields: ["name", "description", "category"],
    filters: [
        commonFilters.exactMatch("category"),
        commonFilters.range("priceCents"),
    ],
});
```

## 总结

通过使用这些优化工具，我们实现了：

1. **代码减少60%**：从192行减少到约80行
2. **类型安全**：完整的TypeScript支持
3. **易于维护**：集中管理通用逻辑
4. **快速开发**：预定义的列和Hook
5. **高度可扩展**：模块化设计

这些工具可以显著提高开发效率，减少重复代码，并为未来的功能扩展提供了良好的基础。