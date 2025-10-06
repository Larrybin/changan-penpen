"use client";

import { useCreate, useList } from "@refinedev/core";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REPORT_TYPES = [
    { value: "orders", label: "订单报表" },
    { value: "usage", label: "用量报表" },
    { value: "credits", label: "积分报表" },
];

export function ReportsPage() {
    const { query, result } = useList({ resource: "reports" });
    const isLoading = query.isLoading;
    const refetch = query.refetch;
    const { mutateAsync: createReport } = useCreate();
    const [form, setForm] = useState({ type: "orders", tenantId: "" });

    const handleGenerate = async (event: React.FormEvent) => {
        event.preventDefault();
        await createReport({
            resource: "reports",
            values: {
                type: form.type,
                tenantId: form.tenantId || undefined,
            },
        });
        setForm((prev) => ({ ...prev, tenantId: "" }));
        refetch();
    };

    const reports = result?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">报表导出</h1>
                    <p className="text-sm text-muted-foreground">
                        生成订单、用量、积分的 CSV 报表。
                    </p>
                </div>
                <form
                    className="flex flex-col gap-2 md:flex-row md:items-end"
                    onSubmit={handleGenerate}
                >
                    <div className="grid gap-1">
                        <label
                            className="text-xs font-medium uppercase text-muted-foreground"
                            htmlFor="report-type"
                        >
                            报表类型
                        </label>
                        <select
                            id="report-type"
                            className="rounded-md border px-3 py-2 text-sm"
                            value={form.type}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    type: event.target.value,
                                }))
                            }
                        >
                            {REPORT_TYPES.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-1">
                        <label
                            className="text-xs font-medium uppercase text-muted-foreground"
                            htmlFor="report-tenant"
                        >
                            租户 ID（可选）
                        </label>
                        <Input
                            id="report-tenant"
                            value={form.tenantId}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    tenantId: event.target.value,
                                }))
                            }
                            placeholder="全部租户"
                        />
                    </div>
                    <Button type="submit" disabled={false}>
                        生成报表
                    </Button>
                </form>
            </div>

            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">类型</th>
                            <th className="px-4 py-3">参数</th>
                            <th className="px-4 py-3">状态</th>
                            <th className="px-4 py-3">创建时间</th>
                            <th className="px-4 py-3">下载</th>
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
                        {!isLoading && reports.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    尚未生成报表。
                                </td>
                            </tr>
                        )}
                        {reports.map((report) => (
                            <tr key={report.id} className="border-t">
                                <td className="px-4 py-3 font-medium">
                                    {report.type}
                                </td>
                                <td className="px-4 py-3">
                                    <code className="rounded bg-muted px-2 py-1 text-xs">
                                        {report.parameters ?? "{}"}
                                    </code>
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    {report.status}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {report.createdAt?.slice(0, 19)}
                                </td>
                                <td className="px-4 py-3">
                                    {report.downloadUrl ? (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link
                                                href={report.downloadUrl}
                                                target="_blank"
                                            >
                                                下载
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            生成中
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
