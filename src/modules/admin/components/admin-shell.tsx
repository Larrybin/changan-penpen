"use client";

import { CheckSquare, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useMenu } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/modules/auth/models/user.model";
import { adminAuthProvider } from "@/modules/admin/providers/auth-provider";
import adminRoutes from "@/modules/admin/routes/admin.routes";

interface AdminShellProps {
    children: React.ReactNode;
    user: AuthUser;
}

export function AdminShell({ children, user }: AdminShellProps) {
    const { menuItems } = useMenu();
    const pathname = usePathname();
    const router = useRouter();

    const groups = useMemo(() => {
        const grouped = new Map<
            string,
            Array<(typeof menuItems)[number] & { route: string }>
        >();
        menuItems
            .filter((item) => !item.meta?.hide)
            .forEach((item) => {
                const route = item.route ?? adminRoutes.root;
                const key = item.meta?.group ?? "概览";
                const entry = grouped.get(key) ?? [];
                entry.push({ ...item, route });
                grouped.set(key, entry);
            });

        return Array.from(grouped.entries()).map(([group, entries]) => ({
            group,
            entries: entries.sort((a, b) => {
                const orderA =
                    typeof a.meta?.order === "number" ? a.meta?.order : 10;
                const orderB =
                    typeof b.meta?.order === "number" ? b.meta?.order : 10;
                if (orderA !== orderB) return orderA - orderB;
                return (a.label ?? a.name).localeCompare(
                    b.label ?? b.name ?? "",
                );
            }),
        }));
    }, [menuItems]);

    const handleLogout = async () => {
        const result = await adminAuthProvider.logout?.();
        if (result && typeof result.redirectTo === "string") {
            router.push(result.redirectTo);
        }
    };

    return (
        <div className="flex min-h-screen bg-muted/40">
            <aside className="flex w-64 flex-col border-r border-border bg-background">
                <div className="flex items-center space-x-2 px-6 py-5 border-b border-border">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">站长仪表盘</span>
                </div>
                <div className="px-6 py-4 border-b border-border">
                    <p className="text-sm text-muted-foreground">
                        {user.email}
                    </p>
                </div>
                <nav className="px-3 py-4 space-y-4">
                    {groups.map(({ group, entries }) => (
                        <div key={group} className="space-y-1">
                            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {group}
                            </p>
                            {entries.map((item) => {
                                const isActive = pathname?.startsWith(
                                    item.route ?? "",
                                );
                                return (
                                    <Link
                                        key={item.key}
                                        href={item.route ?? "#"}
                                        className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
                <div className="px-6 py-4 mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" /> 退出登录
                    </Button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-8 py-10">{children}</div>
            </main>
        </div>
    );
}
