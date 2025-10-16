import { NextResponse } from "next/server";

const SUPPORTED_VERSIONS = ["v1"] as const;

export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            versions: SUPPORTED_VERSIONS,
            latest: SUPPORTED_VERSIONS[0],
        },
    });
}
