export async function register() {
    // 与根目录 instrumentation 保持一致，预留扩展点。
}

export function onRequestError(error: unknown, request: Request) {
    const details = request?.url ?? "unknown request";
    console.error("App Router request error:", error, details);
}
