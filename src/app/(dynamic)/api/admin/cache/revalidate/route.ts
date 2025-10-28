import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { CACHE_TAGS } from "@/lib/cache/cache-tags";
import { clearStaticConfigCache } from "@/lib/static-config";
import { getPlatformEnv } from "@/lib/platform/context";

async function resolveRevalidateToken(): Promise<string | null> {
    const runtimeToken = process.env.CACHE_REVALIDATE_TOKEN;
    if (runtimeToken?.trim()) {
        return runtimeToken.trim();
    }
    try {
        const env = await getPlatformEnv<
            { CACHE_REVALIDATE_TOKEN?: string }
        >({ async: false });
        const envToken = env?.CACHE_REVALIDATE_TOKEN;
        if (typeof envToken === "string" && envToken.trim().length > 0) {
            return envToken.trim();
        }
    } catch {
        // ignore — context may be unavailable during build-time execution
    }
    return null;
}

export async function POST(request: Request) {
    const token = await resolveRevalidateToken();
    if (!token) {
        return NextResponse.json(
            { error: "Cache revalidation token is not configured" },
            { status: 501 },
        );
    }

    const authHeader = request.headers.get("authorization");
    const expectedHeader = `Bearer ${token}`;
    if (!authHeader || authHeader.trim() !== expectedHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON payload" },
            { status: 400 },
        );
    }

    const tags = Array.isArray((body as { tags?: unknown }).tags)
        ? ((body as { tags: unknown[] }).tags ?? [])
              .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
              .filter((tag) => tag.length > 0)
        : [];

    if (!tags.length) {
        return NextResponse.json(
            { error: "At least one cache tag is required" },
            { status: 400 },
        );
    }

    const uniqueTags = Array.from(new Set(tags));
    for (const tag of uniqueTags) {
        revalidateTag(tag);
    }

    if (
        uniqueTags.some(
            (tag) =>
                tag === CACHE_TAGS.siteSettings ||
                tag === CACHE_TAGS.optimizationProgress ||
                tag.startsWith("static-config:") ||
                tag.startsWith("marketing-section:"),
        )
    ) {
        clearStaticConfigCache();
    }

    return NextResponse.json({ revalidated: uniqueTags });
}
