function timingSafeEqual(a: string, b: string) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

async function hmacSha256(payload: string, secret: string) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const bytes = new Uint8Array(sig);
    // hex
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    // base64
    let b64 = "";
    if (typeof Buffer !== "undefined") {
        b64 = Buffer.from(bytes).toString("base64");
    } else {
        // Browser/Workers fallback
        b64 = btoa(String.fromCharCode(...bytes));
    }
    return { hex, b64 } as const;
}

export async function verifyCreemWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
): Promise<boolean> {
    try {
        const { hex, b64 } = await hmacSha256(payload, secret);
        const header = (signature || "").trim();

        if (
            header &&
            (timingSafeEqual(header, hex) || timingSafeEqual(header, b64))
        ) {
            return true;
        }

        const parts = header
            .split(/[;,\s]/)
            .map((p) => p.trim())
            .filter(Boolean);
        const kv: Record<string, string> = {};
        for (const p of parts) {
            const idx = p.indexOf("=");
            if (idx > 0) kv[p.slice(0, idx)] = p.slice(idx + 1);
        }
        const v1 = kv["v1"] || kv["sig"] || "";
        if (v1 && (timingSafeEqual(v1, hex) || timingSafeEqual(v1, b64))) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("[creem] verify signature error", error);
        return false;
    }
}
