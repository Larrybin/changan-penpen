"use client";

import NextError from "next/error";

export default function GlobalError({
    error,
}: {
    error: Error & { digest?: string };
}) {
    if (process.env.NODE_ENV !== "production") {
        console.error("Global error captured:", error);
    }

    return (
        <html lang="zh-CN">
            <body>
                {/* `NextError` 是 Next.js 默认的错误页面组件，需要传入 statusCode。*/}
                <NextError statusCode={0} />
            </body>
        </html>
    );
}
