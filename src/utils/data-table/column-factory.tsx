/**
 * 列工厂工具函数
 * 提供预定义的列定义和列生成器
 */

import type { CellContext, ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { ColumnFactoryConfig, PredefinedColumnType } from "./types";

type RecordLike = Record<string, unknown>;

const STATUS_LABELS: Record<string, string> = {
    active: "活跃",
    inactive: "非活跃",
    pending: "待处理",
    completed: "已完成",
    failed: "失败",
    cancelled: "已取消",
    succeeded: "成功",
    processing: "处理中",
};

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const toDisplayString = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return "-";
};

const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return null;
};

const extractCurrency = (row: unknown): string | undefined => {
    if (!row || typeof row !== "object") return undefined;
    const record = row as RecordLike;
    if (isNonEmptyString(record.currency)) return record.currency;
    if (isNonEmptyString(record.currencyCode)) return record.currencyCode;
    return undefined;
};

const extractName = (row: RecordLike): string | undefined => {
    const candidates = [
        row.name,
        row.fullName,
        row.displayName,
        row.tenantName,
        row.customerName,
    ];
    for (const candidate of candidates) {
        if (isNonEmptyString(candidate)) {
            return candidate;
        }
    }
    return undefined;
};

const extractIdentifier = (value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return undefined;
};

export const formatters = {
    // 文本格式化
    text: (value: unknown): string => toDisplayString(value),

    // 数字格式化
    number: (value: unknown): string => {
        const numeric = toNumber(value);
        if (numeric === null) return "0";
        return new Intl.NumberFormat("zh-CN", {
            maximumFractionDigits: 2,
        }).format(numeric);
    },

    // 货币格式化（默认单位为分）
    currency: (amount: unknown, currency = "USD"): string => {
        const numeric = toNumber(amount) ?? 0;
        return new Intl.NumberFormat("zh-CN", {
            style: "currency",
            currency,
        }).format(numeric / 100);
    },

    // 日期格式化
    date: (value: unknown): string => {
        if (value instanceof Date) {
            return value.toISOString().slice(0, 10);
        }
        if (isNonEmptyString(value) && value.length >= 10) {
            return value.slice(0, 10);
        }
        return "-";
    },

    // 日期时间格式化
    datetime: (value: unknown): string => {
        if (value instanceof Date) {
            return value.toISOString().replace("T", " ").slice(0, 19);
        }
        if (isNonEmptyString(value) && value.length >= 19) {
            return value.slice(0, 19).replace("T", " ");
        }
        return "-";
    },

    // 布尔值格式化
    boolean: (value: unknown): string => (value ? "是" : "否"),

    // 状态格式化
    status: (value: unknown): string => {
        if (!isNonEmptyString(value)) return "-";
        const normalized = value.toLowerCase();
        return STATUS_LABELS[normalized] ?? value;
    },

    // 租户信息格式化
    tenant: (email: unknown, name?: unknown, id?: unknown): ReactNode => {
        const safeEmail = isNonEmptyString(email) ? email : "-";
        const safeName = isNonEmptyString(name) ? name : undefined;
        const safeId = extractIdentifier(id);

        return (
            <div>
                <div className="font-medium">{safeEmail}</div>
                {safeName || safeId ? (
                    <div className="text-xs text-muted-foreground">
                        {safeName}
                        {safeName && safeId ? " " : null}
                        {safeId ? `(${safeId})` : null}
                    </div>
                ) : null}
            </div>
        );
    },

    // ID 格式化
    id: (value: unknown): ReactNode => {
        const text = extractIdentifier(value);
        return <div className="font-medium">{text ? `#${text}` : "-"}</div>;
    },
} as const;

type RequiredFormat = NonNullable<ColumnFactoryConfig<RecordLike>["format"]>;

const renderWithFormat = <T,>(
    context: CellContext<T, unknown>,
    format: RequiredFormat,
): ReactNode => {
    const value = context.getValue();
    const original = context.row.original as RecordLike;

    switch (format) {
        case "number":
            return formatters.number(value);
        case "currency":
            return formatters.currency(value, extractCurrency(original));
        case "date":
            return formatters.date(value);
        case "datetime":
            return formatters.datetime(value);
        case "boolean":
            return formatters.boolean(value);
        case "status":
            return formatters.status(value);
        case "custom":
            return toDisplayString(value);
        default:
            return formatters.text(value);
    }
};

/**
 * 创建列定义的工厂函数
 */
export function createColumn<T = RecordLike>(
    accessorKey: keyof T | string,
    config: ColumnFactoryConfig<T> = {},
): ColumnDef<T, unknown> {
    const {
        header,
        cell,
        meta,
        sortable = true,
        format = "text",
        formatter: customFormatter,
        condition,
        ...restConfig
    } = config;

    const defaultHeader =
        typeof accessorKey === "string"
            ? accessorKey.charAt(0).toUpperCase() + accessorKey.slice(1)
            : String(accessorKey);

    const defaultCell = (context: CellContext<T, unknown>) => {
        if (condition && !condition(context.row.original)) {
            return null;
        }

        if (customFormatter) {
            return customFormatter(context.getValue(), context.row.original);
        }

        return renderWithFormat(context, format);
    };

    const column = {
        accessorKey: accessorKey as ColumnDef<T, unknown>["accessorKey"],
        header: header ?? defaultHeader,
        cell: cell ?? defaultCell,
        meta: {
            label: defaultHeader,
            ...meta,
        },
        enableSorting: sortable,
        ...restConfig,
    } satisfies ColumnDef<T, unknown>;

    return column;
}

/**
 * 创建预定义列
 */
export const predefinedColumns = {
    // ID 列
    id: <T = RecordLike>(label = "ID"): ColumnDef<T, unknown> =>
        ({
            accessorKey: "id",
            header: label,
            cell: ({ row }) => formatters.id(row.getValue("id")),
            meta: { label },
            enableSorting: true,
        }) satisfies ColumnDef<T, unknown>,

    // 邮箱列
    email: <T = RecordLike>(label = "邮箱"): ColumnDef<T, unknown> =>
        ({
            accessorKey: "email",
            header: label,
            cell: ({ row }) => {
                const record = row.original as RecordLike;
                return formatters.tenant(
                    row.getValue("email"),
                    extractName(record),
                    extractIdentifier(record.userId ?? record.id),
                );
            },
            meta: { label },
            enableSorting: true,
        }) satisfies ColumnDef<T, unknown>,

    // 租户列
    tenant: <T = RecordLike>(label = "租户"): ColumnDef<T, unknown> =>
        ({
            accessorKey: "customerEmail",
            header: label,
            cell: ({ row }) => {
                const record = row.original as RecordLike;
                return formatters.tenant(
                    row.getValue("customerEmail"),
                    extractName(record),
                    extractIdentifier(record.tenantId ?? record.userId),
                );
            },
            meta: { label },
            enableSorting: true,
        }) satisfies ColumnDef<T, unknown>,

    // 金额列
    amount: <T = RecordLike>(
        field: keyof T | string = "amountCents",
        label = "金额",
    ): ColumnDef<T, unknown> => {
        const accessor = String(field);
        const column = {
            accessorKey: accessor as ColumnDef<T, unknown>["accessorKey"],
            header: label,
            cell: ({ row }) =>
                formatters.currency(
                    row.getValue(accessor),
                    extractCurrency(row.original),
                ),
            meta: { label },
            enableSorting: true,
        } satisfies ColumnDef<T, unknown>;
        return column;
    },

    // 积分列
    credits: <T = RecordLike>(
        field: keyof T | string = "credits",
        label = "积分",
    ): ColumnDef<T, unknown> => {
        const accessor = String(field);
        const column = {
            accessorKey: accessor as ColumnDef<T, unknown>["accessorKey"],
            header: label,
            cell: ({ row }) => formatters.number(row.getValue(accessor)),
            meta: { label },
            enableSorting: true,
        } satisfies ColumnDef<T, unknown>;
        return column;
    },

    // 状态列
    status: <T = RecordLike>(
        field: keyof T | string = "status",
        label = "状态",
    ): ColumnDef<T, unknown> => {
        const accessor = String(field);
        const column = {
            accessorKey: accessor as ColumnDef<T, unknown>["accessorKey"],
            header: label,
            cell: ({ row }) => (
                <span className="capitalize">
                    {formatters.status(row.getValue(accessor))}
                </span>
            ),
            meta: { label },
            enableSorting: true,
        } satisfies ColumnDef<T, unknown>;
        return column;
    },

    // 创建时间列
    createdAt: <T = RecordLike>(label = "创建时间"): ColumnDef<T, unknown> =>
        ({
            accessorKey: "createdAt",
            header: label,
            cell: ({ row }) => (
                <div className="text-xs text-muted-foreground">
                    {formatters.datetime(row.getValue("createdAt"))}
                </div>
            ),
            meta: { label },
            enableSorting: true,
        }) satisfies ColumnDef<T, unknown>,

    // 更新时间列
    updatedAt: <T = RecordLike>(label = "更新时间"): ColumnDef<T, unknown> =>
        ({
            accessorKey: "updatedAt",
            header: label,
            cell: ({ row }) => (
                <div className="text-xs text-muted-foreground">
                    {formatters.datetime(row.getValue("updatedAt"))}
                </div>
            ),
            meta: { label },
            enableSorting: true,
        }) satisfies ColumnDef<T, unknown>,

    // 类型列
    type: <T = RecordLike>(
        field: keyof T | string = "type",
        label = "类型",
    ): ColumnDef<T, unknown> => {
        const accessor = String(field);
        const column = {
            accessorKey: accessor as ColumnDef<T, unknown>["accessorKey"],
            header: label,
            cell: ({ row }) => {
                const value = row.getValue(accessor);
                return value ? (
                    <span className="uppercase">{formatters.text(value)}</span>
                ) : (
                    "-"
                );
            },
            meta: { label },
            enableSorting: true,
        } satisfies ColumnDef<T, unknown>;
        return column;
    },

    // 操作列
    actions: <T = RecordLike>(
        renderActions: (row: T) => ReactNode,
        label = "操作",
    ): ColumnDef<T, unknown> =>
        ({
            id: "actions",
            header: "",
            cell: ({ row }) => renderActions(row.original),
            meta: { label },
            enableSorting: false,
        }) as ColumnDef<T, unknown>,
} as const;

/**
 * 根据预定义类型创建列
 */
export function createPredefinedColumn<T = RecordLike>(
    type: PredefinedColumnType,
    customConfig?: Partial<ColumnFactoryConfig<T>>,
): ColumnDef<T> {
    switch (type) {
        case "id":
            return predefinedColumns.id<T>();
        case "email":
            return predefinedColumns.email<T>();
        case "name":
            return createColumn<T>("name", {
                sortable: true,
                ...customConfig,
            });
        case "amount":
            return predefinedColumns.amount<T>();
        case "status":
            return predefinedColumns.status<T>();
        case "createdAt":
            return predefinedColumns.createdAt<T>();
        case "updatedAt":
            return predefinedColumns.updatedAt<T>();
        case "actions":
            throw new Error(
                "Actions column requires custom render function. Use predefinedColumns.actions() instead.",
            );
        default:
            throw new Error(`Unknown predefined column type: ${type}`);
    }
}

/**
 * 批量创建预定义列
 */
export function createPredefinedColumns<T = RecordLike>(
    types: PredefinedColumnType[],
    customColumns?: ColumnDef<T>[],
): ColumnDef<T>[] {
    const columns = types.map((type) => {
        if (type === "actions") {
            throw new Error(
                "Actions column requires custom render function. Use predefinedColumns.actions() separately.",
            );
        }
        return createPredefinedColumn<T>(type);
    });

    if (customColumns) {
        columns.push(...customColumns);
    }

    return columns;
}

/**
 * 创建租户相关的列集合
 */
export const createTenantColumns = <T = RecordLike>(): ColumnDef<T>[] => [
    predefinedColumns.email<T>("租户"),
    predefinedColumns.credits<T>("积分"),
    predefinedColumns.status<T>("subscriptionStatus", "订阅"),
    createColumn<T>("ordersCount", {
        header: "订单数",
        format: "number",
    }),
    predefinedColumns.amount<T>("revenueCents", "营收"),
    createColumn<T>("totalUsage", {
        header: "用量",
        format: "number",
    }),
    predefinedColumns.createdAt<T>(),
];

/**
 * 创建订单相关的列集合
 */
export const createOrderColumns = <T = RecordLike>(): ColumnDef<T>[] => [
    predefinedColumns.id<T>("订单"),
    predefinedColumns.tenant<T>(),
    predefinedColumns.amount<T>("amountCents", "金额"),
    predefinedColumns.status<T>(),
    predefinedColumns.createdAt<T>(),
];

/**
 * 创建积分历史相关的列集合
 */
export const createCreditHistoryColumns = <
    T = RecordLike,
>(): ColumnDef<T>[] => [
    predefinedColumns.id<T>("记录"),
    predefinedColumns.tenant<T>(),
    predefinedColumns.type<T>(),
    predefinedColumns.credits<T>("amount", "积分"),
    createColumn<T>("description", {
        header: "备注",
        format: "text",
    }),
    predefinedColumns.createdAt<T>("时间"),
];
