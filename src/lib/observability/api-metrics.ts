import { recordMetric } from "@/lib/observability/metrics";

export interface ApiMetricPayload {
    route: string;
    method: string;
    status: number;
    durationMs: number;
    traceId?: string;
    userId?: string;
    service?: string;
}

export function recordApiRequestMetric(payload: ApiMetricPayload): void {
    const outcome =
        payload.status >= 500
            ? "server_error"
            : payload.status >= 400
              ? "client_error"
              : "success";
    const tags = {
        route: payload.route,
        method: payload.method,
        status: payload.status,
        traceId: payload.traceId,
        userId: payload.userId,
        service: payload.service,
        outcome,
    };
    recordMetric("external_api.request.count", 1, tags);
    recordMetric("external_api.request.duration_ms", payload.durationMs, tags);
}
