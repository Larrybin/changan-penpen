import { NextResponse } from "next/server";

export function GET() {
    throw new Error("Sentry Example API Error");
}

export function POST() {
    return NextResponse.json({ status: "ok" });
}
