"use client";

import { Refine } from "@refinedev/core";
import { adminRefineResources } from "@/modules/admin/constants";
import { adminAuthProvider } from "@/modules/admin/providers/auth-provider";
import { adminDataProvider } from "@/modules/admin/providers/data-provider";
import {
    AdminToaster,
    notificationProvider,
} from "@/modules/admin/providers/notification-provider";
import { AdminQueryProvider } from "@/modules/admin/providers/query-client";
import type { AuthUser } from "@/modules/auth/models/user.model";
import { AdminShell } from "./admin-shell";

interface AdminRefineAppProps {
    children: React.ReactNode;
    user: AuthUser;
}

export function AdminRefineApp({ children, user }: AdminRefineAppProps) {
    return (
        <Refine
            authProvider={adminAuthProvider}
            dataProvider={adminDataProvider}
            notificationProvider={notificationProvider}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
            }}
            resources={adminRefineResources}
        >
            <AdminQueryProvider>
                <AdminShell user={user}>{children}</AdminShell>
            </AdminQueryProvider>
            <AdminToaster />
        </Refine>
    );
}
