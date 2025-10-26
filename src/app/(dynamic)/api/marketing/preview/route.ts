import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { applyRateLimit } from "@/lib/rate-limit";
import { getMarketingPreviewPayload } from "@/modules/marketing/services/preview.service";

export async function GET(request: Request) {
    const cfContext = await getCloudflareContext({ async: true });
    const waitUntil =
        typeof cfContext?.ctx?.waitUntil === "function"
            ? cfContext.ctx.waitUntil.bind(cfContext.ctx)
            : undefined;
    const rateLimitResult = await applyRateLimit({
        request,
        identifier: "marketing:preview",
        env: cfContext?.env,
        waitUntil,
        message: "Too many preview requests",
        upstash: {
            strategy: { type: "sliding", requests: 6, window: "10 s" },
            prefix: "@ratelimit/marketing-preview",
            includeHeaders: true,
        },
    });
    if (!rateLimitResult.ok) {
        return rateLimitResult.response;
    }

    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
        return NextResponse.json(
            { message: "Missing preview token" },
            { status: 400 },
        );
    }

    const payload = await getMarketingPreviewPayload(token);
    if (!payload) {
        return NextResponse.json(
            { message: "Preview token invalid or expired" },
            { status: 404 },
        );
    }

    return NextResponse.json({ data: payload });
}
