import type { PaginationDefaults } from "@/modules/admin-shared/utils/pagination";

export interface TenantSummary {
    id: string;
    email: string | null;
    name: string | null;
    createdAt: Date | string;
    lastSignIn: Date | string | null;
    credits: number;
    hasCustomer: boolean;
    subscriptionStatus: string | null;
    ordersCount: number;
    revenueCents: number;
    totalUsage: number;
}

export interface TenantCreditsEntry {
    id: string;
    amount: number;
    type: string;
    createdAt: Date | string;
}

export interface TenantSubscriptionEntry {
    id: string;
    status: string | null;
    currentPeriodStart: Date | string | null;
    currentPeriodEnd: Date | string | null;
    canceledAt: Date | string | null;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
}

export interface TenantUsageEntry {
    date: Date | string;
    total: number;
    unit: string | null;
}

export interface TenantDetail extends Omit<TenantSummary, "totalUsage"> {
    creditsHistory: TenantCreditsEntry[];
    subscriptions: TenantSubscriptionEntry[];
    usage: TenantUsageEntry[];
}

export interface TenantListResult {
    data: TenantSummary[];
    total: number;
}

export interface ListTenantsOptions extends Partial<PaginationDefaults> {
    search?: string;
}

export interface TenantAdminService {
    listTenants(options?: ListTenantsOptions): Promise<TenantListResult>;
    getTenantDetail(userId: string): Promise<TenantDetail | null>;
}
