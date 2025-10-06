"use client";

import { useList } from "@refinedev/core";
import type { AuditLogRecord } from "@/modules/admin/types/resource.types";

const formatDateTime = (value?: string | null) =>
    typeof value === "string" && value.length > 0
        ? value.slice(0, 19)
        : "-";

const formatMetadata = (metadata: unknown) => {
    if (metadata == null || metadata === "") {
        return "-";
    }

    if (typeof metadata === "string") {
        return metadata;
    }

    try {
        return JSON.stringify(metadata);
    } catch (error) {
        return String(metadata);
    }
};

export function AuditLogsPage() {
    const { query, result } = useList<AuditLogRecord>({
        resource: "audit-logs",
    });
    const isLoading = query.isLoading;
    const logs = result?.data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">操作日志</h1>
                <p className="text-sm text-muted-foreground">
                    追踪后台关键操作，满足审计需求。
                </p>
            </div>
            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">时间</th>
                            <th className="px-4 py-3">管理员</th>
                            <th className="px-4 py-3">动作</th>
                            <th className="px-4 py-3">目标</th>
                            <th className="px-4 py-3">详情</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    加载中...
                                </td>
                            </tr>
                        )}
                        {!isLoading && logs.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无日志记录。
                                </td>
                            </tr>
                        )}
                        {logs.map((log) => (
                            <tr key={log.id} className="border-t">
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {formatDateTime(log.createdAt)}
                                </td>
                                <td className="px-4 py-3">{log.adminEmail ?? "-"}</td>
                                <td className="px-4 py-3">{log.action ?? "-"}</td>
                                <td className="px-4 py-3">
                                    {log.targetType ?? "-"}
                                    {log.targetId ? `#${log.targetId}` : ""}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    <code className="rounded bg-muted px-2 py-1">
                                        {formatMetadata(log.metadata)}
                                    </code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
