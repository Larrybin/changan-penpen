export async function register() {
    // 保留占位以便未来接入自定义 instrumentation。
}

export function onRequestError(error: unknown, request: Request) {
    const details = request?.url ?? "unknown request";
    console.error("Next.js request error:", error, details);
}
