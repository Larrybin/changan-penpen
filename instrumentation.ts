import { logMetrics, recordMetric } from "@/lib/observability/metrics";

export async function register() {
    // 在启动时输出残留指标，避免漏报。
    await logMetrics("startup");
}

export function onRequestError(error: unknown, request: Request) {
    const details = request?.url ?? "unknown request";
    recordMetric("request.error", 1, {
        method: request?.method ?? "UNKNOWN",
        url: details,
    });
    console.error("Next.js request error:", error, details);
    void logMetrics("request-error");
}
