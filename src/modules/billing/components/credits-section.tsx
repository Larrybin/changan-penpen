"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ApiErrorPayload {
    code: string;
    message: string;
    details?: unknown;
}

interface ApiErrorResponse {
    success: false;
    error: ApiErrorPayload;
    status: number;
    timestamp: string;
    traceId: string;
}

interface BalanceSuccessResponse {
    success: true;
    data: {
        credits: number;
    };
    error?: null;
}

interface CreditTransaction {
    id: string;
    amount: number;
    remainingAmount: number;
    type: string;
    description: string;
    expirationDate: string | null;
    paymentIntentId?: string | null;
    createdAt: string | null;
}

interface HistorySuccessResponse {
    success: true;
    data: {
        transactions: CreditTransaction[];
        pagination: {
            total: number;
            pages: number;
            current: number;
        };
    };
    error?: null;
}

async function requestJson<TSuccess extends { success: true }>(
    input: RequestInfo,
    init: RequestInit,
    fallbackMessage: string,
): Promise<TSuccess> {
    const response = await fetch(input, init);
    const json = (await response.json()) as TSuccess | ApiErrorResponse;
    const success = "success" in json ? Boolean(json.success) : response.ok;

    if (!response.ok || !success) {
        const errorPayload =
            "error" in json ? { error: json.error } : undefined;
        const errorMessage = extractErrorMessage(errorPayload);
        throw new Error(errorMessage || fallbackMessage);
    }

    return json as TSuccess;
}

const defaultHeaders = { "Content-Type": "application/json" } as const;

function fetchBalanceData() {
    return requestJson<BalanceSuccessResponse>(
        "/api/v1/credits/balance",
        { method: "GET", headers: defaultHeaders },
        "获取余额失败",
    );
}

function fetchHistoryData() {
    return requestJson<HistorySuccessResponse>(
        "/api/v1/credits/history?limit=10",
        { method: "GET", headers: defaultHeaders },
        "获取交易历史失败",
    );
}

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
});

function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return dateTimeFormatter.format(date);
}

function loadCreditsSnapshot() {
    return Promise.all([fetchBalanceData(), fetchHistoryData()]).then(
        ([balanceJson, historyJson]) => ({
            balance: balanceJson.data?.credits ?? 0,
            transactions: historyJson.data?.transactions ?? [],
        }),
    );
}

function resolveLoadErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return "无法获取积分信息，请稍后再试";
}

function extractErrorMessage(payload: { error?: unknown } | null | undefined) {
    if (!payload || !payload.error) return "";
    const { error } = payload;
    if (typeof error === "string") return error;
    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
    ) {
        return (error as { message: string }).message;
    }
    return "";
}

export default function CreditsSection() {
    const [isLoading, setIsLoading] = useState(true);
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const snapshot = await loadCreditsSnapshot();
            setBalance(snapshot.balance);
            setTransactions(snapshot.transactions);
        } catch (err) {
            console.error("[CreditsSection] fetch error:", err);
            setError(resolveLoadErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const balanceDisplay = useMemo(() => {
        if (balance === null) return "-";
        return balance.toLocaleString("zh-CN");
    }, [balance]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>积分余额</CardTitle>
                    <CardDescription>
                        实时读取用户积分，并在访问时自动尝试发放月度福利。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <Skeleton className="h-10 w-32" />
                    ) : error ? (
                        <p className="text-destructive text-sm">{error}</p>
                    ) : (
                        <p className="font-semibold text-3xl">
                            {balanceDisplay}
                        </p>
                    )}
                    <Button
                        onClick={handleRefresh}
                        disabled={isLoading || refreshing}
                    >
                        {refreshing ? "刷新中..." : "刷新积分"}
                    </Button>
                    <p className="text-muted-foreground text-xs">
                        手动刷新会重新请求积分余额，并触发月度免费积分发放逻辑（若满足时间条件）。
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>最近交易</CardTitle>
                    <CardDescription>
                        展示最近 10 条积分交易记录。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : error ? (
                        <p className="text-destructive text-sm">{error}</p>
                    ) : transactions.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            暂无交易记录。
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted/60 text-left font-semibold text-muted-foreground text-xs uppercase">
                                    <tr>
                                        <th className="px-3 py-2">时间</th>
                                        <th className="px-3 py-2">类型</th>
                                        <th className="px-3 py-2">数量</th>
                                        <th className="px-3 py-2">余额</th>
                                        <th className="px-3 py-2">描述</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((item) => (
                                        <tr key={item.id} className="border-t">
                                            <td className="px-3 py-2 text-muted-foreground text-xs">
                                                {formatDateTime(item.createdAt)}
                                            </td>
                                            <td className="px-3 py-2 uppercase">
                                                {item.type}
                                            </td>
                                            <td
                                                className={
                                                    item.amount >= 0
                                                        ? "px-3 py-2 font-medium text-green-600"
                                                        : "px-3 py-2 font-medium text-destructive"
                                                }
                                            >
                                                {item.amount}
                                            </td>
                                            <td className="px-3 py-2">
                                                {item.remainingAmount}
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground text-xs">
                                                {item.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
