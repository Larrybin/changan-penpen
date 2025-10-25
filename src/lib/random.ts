const globalCrypto: Crypto | undefined =
    typeof globalThis !== "undefined"
        ? (globalThis as { crypto?: Crypto }).crypto
        : undefined;

function getNodeCrypto(): typeof import("node:crypto") | undefined {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require("node:crypto") as typeof import("node:crypto");
    } catch {
        return undefined;
    }
}

const UINT32_MAX = 0x100000000;

export function secureRandomInt(maxExclusive: number): number {
    if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
        return 0;
    }

    const max = Math.floor(maxExclusive);
    if (max <= 0) {
        return 0;
    }

    const limit = Math.floor(UINT32_MAX / max) * max;

    if (globalCrypto && typeof globalCrypto.getRandomValues === "function") {
        let rand: number;
        const arr = new Uint32Array(1);
        do {
            globalCrypto.getRandomValues(arr);
            rand = arr[0];
        } while (rand >= limit);
        return rand % max;
    }

    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
        let rand: number;
        do {
            rand = nodeCrypto.randomBytes(4).readUInt32BE(0);
        } while (rand >= limit);
        return rand % max;
    }

    return 0;
}

function secureRandomFraction(): number {
    if (globalCrypto && typeof globalCrypto.getRandomValues === "function") {
        const arr = new Uint32Array(1);
        globalCrypto.getRandomValues(arr);
        return arr[0] / UINT32_MAX;
    }

    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
        return nodeCrypto.randomBytes(4).readUInt32BE(0) / UINT32_MAX;
    }

    return 0;
}

export function secureRandomNumber(min: number, max: number): number {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        throw new TypeError("min and max must be finite numbers");
    }
    if (max <= min) {
        return min;
    }
    return min + secureRandomFraction() * (max - min);
}

export function createRandomId(): string {
    if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
        return globalCrypto.randomUUID();
    }

    if (globalCrypto && typeof globalCrypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        globalCrypto.getRandomValues(bytes);
        let out = "";
        for (let i = 0; i < bytes.length; i++) {
            out += bytes[i].toString(16).padStart(2, "0");
        }
        return out;
    }

    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
        if (typeof nodeCrypto.randomUUID === "function") {
            return nodeCrypto.randomUUID();
        }
        return nodeCrypto.randomBytes(16).toString("hex");
    }

    const timestamp = Date.now();
    const performanceNow =
        typeof performance !== "undefined" &&
        typeof performance.now === "function"
            ? Math.floor(performance.now() * 1000)
            : 0;
    return `${timestamp}-${performanceNow}`;
}

export function secureRandomString(
    length: number,
    alphabet = "abcdefghijklmnopqrstuvwxyz0123456789",
): string {
    if (!Number.isInteger(length) || length <= 0) {
        return "";
    }

    const chars: string[] = [];
    for (let i = 0; i < length; i++) {
        const index = secureRandomInt(alphabet.length);
        chars.push(alphabet.charAt(index));
    }

    return chars.join("");
}
