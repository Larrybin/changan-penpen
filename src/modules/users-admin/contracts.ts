import type { PaginationDefaults } from "@/modules/admin-shared/utils/pagination";

import type {
    AdminUserDetail,
    AdminUserListItem,
    AdminUserTransaction,
} from "./models";

export interface ListUsersOptions extends Partial<PaginationDefaults> {
    email?: string;
    name?: string;
}

export interface ListUsersResult {
    data: AdminUserListItem[];
    total: number;
    page: number;
    perPage: number;
}

export interface AdminUserService {
    listUsers(options?: ListUsersOptions): Promise<ListUsersResult>;
    getUserDetail(userId: string): Promise<AdminUserDetail | null>;
}

export type { AdminUserDetail, AdminUserListItem, AdminUserTransaction };
