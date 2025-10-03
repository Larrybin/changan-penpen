import { headers } from "next/headers";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { getUsageDaily } from "@/modules/creem/services/usage.service";

function formatDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default async function UsagePage() {
    const auth = await getAuthInstance();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return (
            <div className="mx-auto max-w-[var(--container-max-w)] py-12 px-[var(--container-px)]">
                <h1 className="text-title-sm font-bold mb-3">用量统计</h1>
                <p className="text-muted-foreground">请先登录后查看。</p>
            </div>
        );
    }

    const end = new Date();
    const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
    const fromDate = formatDate(start);
    const toDate = formatDate(end);
    const rows = await getUsageDaily(session.user.id, fromDate, toDate);

    // 按日期→feature 分组
    const byDate: Record<
        string,
        { feature: string; total: number; unit: string }[]
    > = {};
    for (const r of rows) {
        byDate[r.date] ||= [];
        byDate[r.date].push({
            feature: r.feature,
            total: r.totalAmount,
            unit: r.unit,
        });
    }
    const sortedDates = Object.keys(byDate).sort();

    return (
        <div className="mx-auto max-w-[var(--container-max-w)] py-12 px-[var(--container-px)]">
            <h1 className="text-title-sm font-bold mb-6">
                用量统计（最近 30 天）
            </h1>
            <div className="space-y-4">
                {sortedDates.length === 0 ? (
                    <p className="text-muted-foreground">暂无用量。</p>
                ) : (
                    sortedDates.map((d) => (
                        <div key={d} className="border rounded p-4">
                            <div className="font-semibold mb-2">{d}</div>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                {byDate[d].map((it, idx) => (
                                    <li key={idx}>
                                        {it.feature}: {it.total} {it.unit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
