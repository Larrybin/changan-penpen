import { recordMetric } from "@/lib/observability/metrics";

export interface ApiMetricPayload {
    route: string;
    method: string;
    status: number;
    durationMs: number;
    traceId?: string;
    userId?: string;
}

export function recordApiRequestMetric(payload: ApiMetricPayload): void {
    const tags = {
        route: payload.route,
        method: payload.method,
        status: payload.status,
        traceId: payload.traceId,
        userId: payload.userId,
    };
    recordMetric("api.request.count", 1, tags);
    recordMetric("api.request.duration", payload.durationMs, tags);
    if (payload.status >= 400) {
        recordMetric("api.request.error", 1, tags);
    }
}
