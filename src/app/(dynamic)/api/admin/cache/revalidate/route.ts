import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function resolveRevalidateToken(): string | null {
    const runtimeToken = process.env.CACHE_REVALIDATE_TOKEN;
    if (runtimeToken?.trim()) {
        return runtimeToken.trim();
    }
    try {
        const context = getCloudflareContext();
        const envToken = context.env?.CACHE_REVALIDATE_TOKEN;
        if (typeof envToken === "string" && envToken.trim().length > 0) {
            return envToken.trim();
        }
    } catch {
        // ignore — context may be unavailable during build-time execution
    }
    return null;
}

export async function POST(request: Request) {
    const token = resolveRevalidateToken();
    if (!token) {
        return NextResponse.json(
            { error: "Cache revalidation token is not configured" },
            { status: 501 },
        );
    }

    const authHeader = request.headers.get("authorization");
    const expectedHeader = `Bearer ${token}`;
    if (!authHeader || authHeader.trim() !== expectedHeader) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 403 },
        );
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

    return NextResponse.json({ revalidated: uniqueTags });
}
