import { NextResponse } from "next/server";
import { getPlatformContext } from "@/lib/platform/context";
import { applyRateLimit } from "@/lib/rate-limit";
import { getMarketingPreviewPayload } from "@/modules/marketing/services/preview.service";

export async function GET(request: Request) {
    const platformContext = await getPlatformContext({ async: true });
    const waitUntil = platformContext.waitUntil;
    const rateLimitResult = await applyRateLimit({
        request,
        identifier: "marketing:preview",
        env: platformContext.env,
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
