import type { BaseRecord } from "@refinedev/core";

export type AdminUserRole = "admin" | "user";
export type AdminUserStatus = "active" | "inactive";

export interface AdminUserListItem extends BaseRecord {
    id: string;
    email?: string | null;
    name?: string | null;
    role: AdminUserRole;
    status: AdminUserStatus;
    createdAt?: string | null;
    credits?: number | null;
}

export interface AdminUserCreditHistoryItem {
    id: number;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string | null;
}

export interface AdminUserSubscriptionItem {
    id: number;
    status: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    canceledAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface AdminUserUsageItem {
    id: number;
    date: string;
    feature: string;
    totalAmount: number;
    unit: string;
}

export interface AdminUserDetail {
    user: {
        id: string;
        email: string | null;
        name: string | null;
        emailVerified: boolean;
        role: AdminUserRole;
        status: AdminUserStatus;
        createdAt: string | null;
        updatedAt: string | null;
        image: string | null;
    };
    customer: {
        id: number;
        credits: number;
        createdAt: string | null;
        updatedAt: string | null;
    } | null;
    subscriptions: AdminUserSubscriptionItem[];
    creditsHistory: AdminUserCreditHistoryItem[];
    usage: AdminUserUsageItem[];
}
