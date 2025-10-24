import { desc, eq } from "drizzle-orm";
import { CheckSquare, CreditCard, List, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { customers, getDb, subscriptions, user as userTable } from "@/db";
import { getSession } from "@/modules/auth/utils/auth-utils";
import { SUBSCRIPTION_TIERS } from "@/modules/creem/config/subscriptions";

export default async function Dashboard() {
    const session = await getSession();
    let credits = 0;
    let subStatus = "账单信息不可用";
    let planName = "-";

    if (session?.user) {
        try {
            const db = await getDb();
            const [userBalance] = await db
                .select({ currentCredits: userTable.currentCredits })
                .from(userTable)
                .where(eq(userTable.id, session.user.id))
                .limit(1);

            credits = userBalance?.currentCredits ?? 0;

            const rows = await db
                .select({ id: customers.id })
                .from(customers)
                .where(eq(customers.userId, session.user.id))
                .limit(1);

            if (rows.length > 0) {
                const subs = await db
                    .select({
                        status: subscriptions.status,
                        productId: subscriptions.creemProductId,
                        updatedAt: subscriptions.updatedAt,
                    })
                    .from(subscriptions)
                    .where(eq(subscriptions.customerId, rows[0].id))
                    .orderBy(desc(subscriptions.updatedAt))
                    .limit(1);

                if (subs.length > 0) {
                    const rawStatus = subs[0].status || "unknown";
                    const statusMap: Record<string, string> = {
                        active: "已订阅",
                        paid: "已订阅",
                        trialing: "试用中",
                        canceled: "已取消",
                        expired: "已过期",
                    };
                    subStatus = statusMap[rawStatus] || rawStatus;
                    planName =
                        SUBSCRIPTION_TIERS.find(
                            (t) => t.productId === subs[0].productId,
                        )?.name || "-";
                } else {
                    subStatus = "未订阅";
                }
            } else {
                subStatus = "未订阅";
            }
        } catch (e) {
            // 避免 SSR 直接崩溃，保留默认占位值
            console.error("[dashboard] billing snapshot error", e);
        }
    }

    return (
        <div className="mx-auto max-w-[var(--container-max-w)] px-[var(--container-px)] py-12">
            <div className="mb-12 text-center">
                <h1 className="mb-4 font-bold text-title-sm">
                    Welcome to TodoApp
                </h1>
                <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
                    A simple and elegant todo application built with Next.js 15,
                    TailwindCSS, and shadcn/ui components.
                </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-[var(--grid-gap-section)] md:grid-cols-2">
                <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <List className="mr-2 h-5 w-5" />
                            View Todos
                        </CardTitle>
                        <CardDescription>
                            Browse and manage all your todos in one place
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/todos">
                            <Button className="w-full">
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Go to Todos
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <CreditCard className="mr-2 h-5 w-5" />
                            Billing & Payments
                        </CardTitle>
                        <CardDescription>
                            订阅与积分购买入口；查看当前订阅与剩余积分
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="text-muted-foreground text-sm">
                                当前订阅：
                                <span className="font-medium">{planName}</span>
                                （{subStatus}）
                            </div>
                            <div className="text-muted-foreground text-sm">
                                剩余积分：
                                <span className="font-medium">{credits}</span>
                            </div>
                            <Link href="/billing">
                                <Button className="mt-2 w-full">
                                    前往套餐页
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Plus className="mr-2 h-5 w-5" />
                            Create Todo
                        </CardTitle>
                        <CardDescription>
                            Add a new task to your todo list
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/todos/new">
                            <Button className="w-full" variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Todo
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 text-center">
                <h2 className="mb-4 font-semibold text-subtitle">Features</h2>
                <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-3">
                    <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                            <CheckSquare className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="mb-2 font-semibold">Task Management</h3>
                        <p className="text-muted-foreground text-sm">
                            Create, edit, and delete todos with ease
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <List className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="mb-2 font-semibold">Categories</h3>
                        <p className="text-muted-foreground text-sm">
                            Organize your todos with custom categories
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                            <Plus className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="mb-2 font-semibold">Rich Features</h3>
                        <p className="text-muted-foreground text-sm">
                            Priorities, due dates, images, and more
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 直接引入客户端组件：Server 组件可以渲染 Client 边界，无需 dynamic
