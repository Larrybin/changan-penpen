const encoder = new TextEncoder();

function timingSafeEqual(a: string, b: string) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

async function hmacSha256(payload: string, secret: string) {
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const bytes = new Uint8Array(sig);
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    let b64 = "";
    if (typeof Buffer !== "undefined") {
        b64 = Buffer.from(bytes).toString("base64");
    } else {
        b64 = btoa(String.fromCharCode(...bytes));
    }
    return { hex, b64 } as const;
}

async function sha256Hex(input: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export interface ReplayProtectionStore {
    checkAndRemember(identifier: string, ttlSeconds: number): Promise<boolean>;
}

class InMemoryReplayProtectionStore implements ReplayProtectionStore {
    private readonly cache = new Map<string, number>();

    async checkAndRemember(
        identifier: string,
        ttlSeconds: number,
    ): Promise<boolean> {
        const now = Date.now();
        this.cleanup(now);
        const expiresAt = this.cache.get(identifier);
        if (expiresAt && expiresAt > now) {
            return false;
        }
        this.cache.set(identifier, now + ttlSeconds * 1000);
        return true;
    }

    private cleanup(now: number) {
        for (const [key, expiresAt] of this.cache) {
            if (expiresAt <= now) {
                this.cache.delete(key);
            }
        }
    }
}

const defaultReplayStore = new InMemoryReplayProtectionStore();

export function createRedisReplayProtectionStore(redis: {
    set: (
        key: string,
        value: string,
        options: { ex: number; nx: true },
    ) => Promise<string | null>;
}): ReplayProtectionStore {
    return {
        async checkAndRemember(identifier: string, ttlSeconds: number) {
            const result = await redis.set(identifier, "1", {
                ex: ttlSeconds,
                nx: true,
            });
            return result === "OK";
        },
    };
}

export type VerifySignatureOptions = {
    toleranceSeconds?: number;
    replayStore?: ReplayProtectionStore;
    now?: () => number;
};

export async function verifyCreemWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    options: VerifySignatureOptions = {},
): Promise<boolean> {
    try {
        const header = (signature || "").trim();
        if (!header) {
            return false;
        }

        const parsed = parseSignatureHeader(header);
        const timestamp = parsed.timestamp;
        const candidateSignatures = parsed.signatures;

        if (!timestamp) {
            return false;
        }

        const now = options.now?.() ?? Date.now();
        const toleranceSeconds = options.toleranceSeconds ?? 5 * 60;
        const delta = Math.abs(now - timestamp * 1000);
        if (delta > toleranceSeconds * 1000) {
            return false;
        }

        const { hex, b64 } = await hmacSha256(payload, secret);
        const match = candidateSignatures.some(
            (value) =>
                timingSafeEqual(value, hex) || timingSafeEqual(value, b64),
        );
        if (!match) {
            return false;
        }

        const replayStore = options.replayStore ?? defaultReplayStore;
        const fingerprint = await sha256Hex(
            `${timestamp}:${candidateSignatures[0]}:${payload}`,
        );
        const fresh = await replayStore.checkAndRemember(
            fingerprint,
            toleranceSeconds,
        );
        if (!fresh) {
            return false;
        }

        return true;
    } catch (error) {
        console.error("[creem] verify signature error", error);
        return false;
    }
}

function parseSignatureHeader(signature: string) {
    const signatures = new Set<string>();
    let timestamp: number | null = null;

    const direct = signature.replace(/\s+/g, "");
    if (direct && !direct.includes("=")) {
        signatures.add(direct);
    }

    const parts = signature
        .split(/[;,\s]/)
        .map((part) => part.trim())
        .filter(Boolean);

    for (const part of parts) {
        const [rawKey, ...rawValueParts] = part.split("=");
        if (!rawKey || rawValueParts.length === 0) {
            continue;
        }
        const value = rawValueParts.join("=");
        if (!value) {
            continue;
        }
        const normalizedKey = rawKey.toLowerCase();
        if (normalizedKey === "t" || normalizedKey === "timestamp") {
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
                timestamp = parsed;
            }
        } else if (normalizedKey === "v1" || normalizedKey === "sig") {
            signatures.add(value);
        }
    }

    return {
        timestamp,
        signatures: Array.from(signatures),
    } as const;
}
