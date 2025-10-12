"use client";

import { useState } from "react";

const throwClientError = () => {
    throw new Error("Sentry Frontend Error");
};

async function callExampleApi(setStatus: (value: string) => void) {
    try {
        const response = await fetch("/api/sentry-example-api");
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        setStatus("API 请求成功（预期不会发生）");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus(`API 请求抛出了异常：${message}`);
    }
}

export default function SentryExamplePage() {
    const [status, setStatus] = useState<string>("");

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col gap-6 px-6 py-16">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold">Sentry 演示页面</h1>
                <p className="text-muted-foreground text-base leading-relaxed">
                    点击下方按钮触发前端或 API 错误，确认事件是否成功上报到
                    Sentry。
                </p>
            </header>
            <div className="flex flex-wrap gap-4">
                <button
                    className="rounded-md bg-red-600 px-4 py-2 text-white shadow hover:bg-red-700"
                    type="button"
                    onClick={throwClientError}
                >
                    触发前端错误
                </button>
                <button
                    className="rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
                    type="button"
                    onClick={() => callExampleApi(setStatus)}
                >
                    调用示例 API
                </button>
            </div>
            {status ? (
                <p
                    aria-atomic="true"
                    aria-live="polite"
                    className="rounded-md border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-blue-900"
                >
                    {status}
                </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
                若需要排查真实请求，可在 Sentry 控制台的 Issues、Traces 或
                Replays 栏目查看事件详情。
            </p>
        </div>
    );
}
