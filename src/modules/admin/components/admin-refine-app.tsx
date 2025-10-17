"use client";

import { AdminToaster } from "@/modules/admin/providers/notification-provider";
import { AdminQueryProvider } from "@/modules/admin/providers/query-client";
import type { AuthUser } from "@/modules/auth/models/user.model";
import { AdminShell } from "./admin-shell";

interface AdminRefineAppProps {
    children: React.ReactNode;
    user: AuthUser;
}

export function AdminRefineApp({ children, user }: AdminRefineAppProps) {
    return (
        <AdminQueryProvider>
            <AdminShell user={user}>{children}</AdminShell>
            <AdminToaster />
        </AdminQueryProvider>
    );
}
