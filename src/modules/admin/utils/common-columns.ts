import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type {
    CreditHistoryEntry,
    OrderRecord,
    TenantSummaryRecord,
} from "@/modules/admin/types/resource.types";
import {
    createColumn,
    createCreditHistoryColumns,
    createOrderColumns,
    createTenantColumns,
    predefinedColumns,
} from "@/utils/data-table";

/**
 * 预定义的租户列集合
 */
export const tenantColumns: ColumnDef<TenantSummaryRecord>[] =
    createTenantColumns<TenantSummaryRecord>();

/**
 * 预定义的订单列集合
 */
export const orderColumns: ColumnDef<OrderRecord>[] =
    createOrderColumns<OrderRecord>();

/**
 * 预定义的积分历史列集合
 */
export const creditHistoryColumns: ColumnDef<CreditHistoryEntry>[] =
    createCreditHistoryColumns<CreditHistoryEntry>();

/**
 * 根据需要生成新的租户列集合，避免引用共享导致的副作用
 */
export function getTenantColumns(): ColumnDef<TenantSummaryRecord>[] {
    return createTenantColumns<TenantSummaryRecord>();
}

export function getOrderColumns(): ColumnDef<OrderRecord>[] {
    return createOrderColumns<OrderRecord>();
}

export function getCreditHistoryColumns(): ColumnDef<CreditHistoryEntry>[] {
    return createCreditHistoryColumns<CreditHistoryEntry>();
}

/**
 * 通用列工厂，便于在业务模块中快速生成常用列
 */
export const commonColumns = {
    id: <T>(label = "ID") => predefinedColumns.id<T>(label),
    email: <T>(label = "邮箱") => predefinedColumns.email<T>(label),
    tenant: <T>(label = "租户") => predefinedColumns.tenant<T>(label),
    status: <T>(field: keyof T | string = "status", label = "状态") =>
        predefinedColumns.status<T>(field, label),
    amount: <T>(field: keyof T | string = "amountCents", label = "金额") =>
        predefinedColumns.amount<T>(field, label),
    credits: <T>(field: keyof T | string = "credits", label = "积分") =>
        predefinedColumns.credits<T>(field, label),
    createdAt: <T>(label = "创建时间") => predefinedColumns.createdAt<T>(label),
    updatedAt: <T>(label = "更新时间") => predefinedColumns.updatedAt<T>(label),
    description: <T>(field: keyof T, label = "备注") =>
        createColumn<T>(field, {
            header: label,
            format: "text",
        }),
    actions: <T>(renderActions: (row: T) => ReactNode, label = "操作") =>
        predefinedColumns.actions<T>(renderActions, label),
};
