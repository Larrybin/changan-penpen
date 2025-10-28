"use client";

import { CheckSquare, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { getSafeInternalRedirectOrDefault } from "@/lib/security/redirect";
import { toast } from "@/lib/toast";
import {
    buildAdminMenuGroups,
    DEFAULT_ADMIN_MENU_GROUP,
} from "@/modules/admin/constants";
import { adminAuthProvider } from "@/modules/admin/providers/auth-provider";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { AuthUser } from "@/modules/auth/models/user.model";

interface AdminShellProps {
    children: React.ReactNode;
    user: AuthUser;
}

export function AdminShell({ children, user }: AdminShellProps) {
    const pathname = usePathname();
    const router = useRouter();

    const groups = useMemo(() => {
        return buildAdminMenuGroups().map((group) => ({
            group: group.name,
            entries: group.items,
        }));
    }, []);

    const handleLogout = async () => {
        try {
            const result = await adminAuthProvider.logout?.();
            if (result && typeof result.redirectTo === "string") {
                router.push(
                    getSafeInternalRedirectOrDefault(
                        result.redirectTo,
                        "/login",
                    ),
                );
            }
        } catch (_error) {
            toast.error("退出登录失败，请稍后再试");
        }
    };

    return (
        <div className="flex min-h-screen bg-muted/40">
            <aside className="flex w-[var(--layout-sidebar-width)] flex-col border-border border-r bg-background">
                <div className="flex items-center gap-2 border-border border-b px-6 py-5">
                    <CheckSquare
                        aria-hidden="true"
                        className="h-5 w-5 text-primary"
                        focusable="false"
                        role="img"
                    />
                    <span className="font-semibold text-lg">站长仪表盘</span>
                </div>
                <div className="border-border border-b px-6 py-4">
                    <p className="text-muted-foreground text-sm">
                        {user.email}
                    </p>
                </div>
                <nav className="flex flex-1 flex-col gap-4 px-3 py-4">
                    {groups.map(({ group, entries }) => (
                        <div key={group} className="space-y-1.5">
                            <p className="px-3 font-semibold text-muted-foreground text-xs uppercase tracking-[0.12em]">
                                {group ?? DEFAULT_ADMIN_MENU_GROUP}
                            </p>
                            {entries.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== adminRoutes.root &&
                                        pathname?.startsWith(`${item.href}/`));
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`block rounded-md px-3 py-2 font-medium text-sm transition-colors ${
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
                <div className="mt-auto px-6 py-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> 退出登录
                    </Button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                <PageContainer fullHeight>{children}</PageContainer>
            </main>
        </div>
    );
}
