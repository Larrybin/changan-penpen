import type { BaseRecord } from "@/lib/crud/types";

type Identifier = number | string;

export interface AuditLogRecord extends BaseRecord {
    id: Identifier;
    createdAt?: string | null;
    adminEmail?: string | null;
    action?: string | null;
    targetType?: string | null;
    targetId?: Identifier | null;
    metadata?: unknown;
}

export interface CreditHistoryEntry extends BaseRecord {
    id: Identifier;
    amount?: number | null;
    type?: string | null;
    description?: string | null;
    createdAt?: string | null;
    customerEmail?: string | null;
    userId?: string | null;
}

export interface OrderRecord extends BaseRecord {
    id: Identifier;
    amountCents?: number | null;
    currency?: string | null;
    status?: string | null;
    createdAt?: string | null;
    customerEmail?: string | null;
    userId?: string | null;
}

export interface ContentPageRecord extends BaseRecord {
    id: Identifier;
    title?: string | null;
    slug?: string | null;
    language?: string | null;
    status?: string | null;
    updatedAt?: string | null;
}

export interface CouponRecord extends BaseRecord {
    id: Identifier;
    code?: string | null;
    discountType?: string | null;
    discountValue?: number | null;
    maxRedemptions?: number | null;
    redeemedCount?: number | null;
    status?: string | null;
}

export interface ProductRecord extends BaseRecord {
    id: Identifier;
    name?: string | null;
    slug?: string | null;
    priceCents?: number | null;
    currency?: string | null;
    status?: string | null;
}

export interface ReportRecord extends BaseRecord {
    id: Identifier;
    type?: string | null;
    parameters?: unknown;
    status?: string | null;
    createdAt?: string | null;
    downloadUrl?: string | null;
}

export interface TenantSummaryRecord extends BaseRecord {
    id: Identifier;
    email?: string | null;
    name?: string | null;
    credits?: number | null;
    subscriptionStatus?: string | null;
    ordersCount?: number | null;
    revenueCents?: number | null;
    totalUsage?: number | null;
    createdAt?: string | null;
}

export interface AdminTodoRecord extends BaseRecord {
    id: Identifier;
    userId?: string | null;
    userEmail?: string | null;
    title?: string | null;
    description?: string | null;
    categoryId?: number | null;
    categoryName?: string | null;
    status?: string | null;
    priority?: string | null;
    imageUrl?: string | null;
    imageAlt?: string | null;
    completed?: boolean | null;
    dueDate?: string | null;
}

export interface TodoCategoryRecord extends BaseRecord {
    id: Identifier;
    name?: string | null;
}

export interface UsageAggregateRecord extends BaseRecord {
    userId?: string | null;
    email?: string | null;
    date?: string | null;
    feature?: string | null;
    totalAmount?: number | null;
    unit?: string | null;
}
