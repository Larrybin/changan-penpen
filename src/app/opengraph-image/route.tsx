import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const width = 1200;
const height = 630;

export const runtime = "edge";

function getParam(params: URLSearchParams, key: string, fallback = ""): string {
    const value = params.getAll(key);
    const candidate = value[0];
    if (candidate && candidate.length > 0) {
        return candidate;
    }
    return fallback;
}

function truncate(value: string, max: number): string {
    const normalized = value.trim();
    if (normalized.length <= max) {
        return normalized;
    }
    return `${normalized.slice(0, max - 1)}…`;
}

export function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const title = truncate(getParam(params, "title", "Changan Penpen"), 120);
    const description = truncate(
        getParam(params, "description", "Collaborative design workspace"),
        180,
    );
    const siteName = truncate(getParam(params, "siteName", "Penpen"), 80);
    const locale = truncate(getParam(params, "locale", "en"), 8).toUpperCase();
    const path = truncate(getParam(params, "path", ""), 60);

    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                color: "#f9fafb",
                padding: "64px",
                position: "relative",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: "0",
                    background:
                        "radial-gradient(circle at top left, rgba(147, 197, 253, 0.25), transparent 55%)",
                }}
            />
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                }}
            >
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "28px",
                        fontWeight: 600,
                        color: "#fde68a",
                    }}
                >
                    {siteName}
                    <span
                        style={{
                            display: path ? "inline-flex" : "none",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "20px",
                            color: "#facc15",
                        }}
                    >
                        <span style={{ opacity: 0.6 }}>•</span>
                        {path}
                    </span>
                </span>
                <h1
                    style={{
                        fontSize: "72px",
                        lineHeight: 1.05,
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                        margin: 0,
                    }}
                >
                    {title}
                </h1>
            </div>
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    fontSize: "28px",
                    color: "rgba(248, 250, 252, 0.8)",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        maxWidth: "720px",
                        fontSize: "32px",
                        lineHeight: 1.35,
                        color: "rgba(248, 250, 252, 0.85)",
                    }}
                >
                    {description}
                </p>
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "28px",
                        fontWeight: 500,
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            width: "14px",
                            height: "14px",
                            borderRadius: "9999px",
                            backgroundColor: "#38bdf8",
                        }}
                    />
                    {locale}
                </span>
            </div>
        </div>,
        {
            width,
            height,
        },
    );
}
