import handleApiError from "@/lib/api-error";
import { createApiErrorResponse } from "@/lib/http-error";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import {
    getUsageStats,
    type UsageGranularity,
} from "@/modules/creem/services/usage.service";

function formatDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

function parseGranularity(value: string | null): UsageGranularity | null {
    if (!value) {
        return "daily";
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === "daily" || normalized === "weekly" || normalized === "monthly") {
        return normalized;
    }

    return null;
}

async function maybeCompressResponse(body: string, request: Request) {
    const headers: Record<string, string> = { Vary: "Accept-Encoding" };
    if (typeof CompressionStream === "undefined") {
        return { body, headers };
    }

    const acceptEncoding = request.headers
        .get("accept-encoding")
        ?.toLowerCase()
        .split(",")
        .map((encoding) => encoding.trim()) ?? [];

    let encoding: "br" | "gzip" | null = null;
    if (acceptEncoding.includes("br")) {
        encoding = "br";
    } else if (acceptEncoding.includes("gzip")) {
        encoding = "gzip";
    }

    if (!encoding) {
        return { body, headers };
    }

    try {
        const stream = new CompressionStream(encoding);
        const writer = stream.writable.getWriter();
        await writer.write(new TextEncoder().encode(body));
        await writer.close();
        headers["Content-Encoding"] = encoding;
        return { body: stream.readable, headers };
    } catch (error) {
        console.warn("[api/usage/stats] failed to compress response", {
            encoding,
            error,
        });
        return { body, headers };
    }
}

export async function GET(request: Request) {
    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return createApiErrorResponse({
                status: 401,
                code: "UNAUTHORIZED",
                message: "Authentication required",
                severity: "high",
            });
        }

        const url = new URL(request.url);
        const days = Math.min(
            90,
            Math.max(1, Number(url.searchParams.get("days") || 30)),
        );
        const end = new Date();
        const start = new Date(
            end.getTime() - (days - 1) * 24 * 60 * 60 * 1000,
        );
        const fromDate = formatDate(start);
        const toDate = formatDate(end);

        const rawFeatures = url.searchParams.getAll("feature");
        const features = Array.from(
            new Set(
                rawFeatures
                    .flatMap((entry) => entry.split(","))
                    .map((feature) => feature.trim())
                    .filter((feature) => feature.length > 0),
            ),
        );

        const granularity = parseGranularity(
            url.searchParams.get("granularity"),
        );
        if (!granularity) {
            return createApiErrorResponse({
                status: 400,
                code: "INVALID_GRANULARITY",
                message: "granularity must be one of daily, weekly, or monthly",
                severity: "low",
            });
        }

        const stats = await getUsageStats(session.user.id, fromDate, toDate, {
            granularity,
            features: features.length > 0 ? features : undefined,
        });

        const rows =
            granularity === "daily"
                ? stats.rows.map((row) => ({
                      date: row.bucket,
                      feature: row.feature,
                      totalAmount: row.totalAmount,
                      unit: row.unit,
                  }))
                : stats.rows.map((row) => ({
                      period: row.bucket,
                      feature: row.feature,
                      totalAmount: row.totalAmount,
                      unit: row.unit,
                  }));

        const payload = JSON.stringify({
            success: true,
            data: {
                fromDate,
                toDate,
                granularity,
                rows,
                filters: features.length > 0 ? { feature: features } : undefined,
            },
        });

        const compressed = await maybeCompressResponse(payload, request);
        const responseHeaders = new Headers({
            "Content-Type": "application/json",
        });
        Object.entries(compressed.headers).forEach(([key, value]) => {
            responseHeaders.set(key, value);
        });

        return new Response(compressed.body, {
            status: 200,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error("[api/usage/stats] error:", error);
        return handleApiError(error);
    }
}
