import { describe, expect, it, vi } from "vitest";
import { verifyCreemWebhookSignature } from "../verify-signature";

async function computeSignature(payload: string, secret: string) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"],
    );
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        enc.encode(payload),
    );
    const bytes = new Uint8Array(signature);
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const b64 = Buffer.from(bytes).toString("base64");
    return { hex, b64 };
}

describe("verifyCreemWebhookSignature", () => {
    it("accepts direct hex signatures", async () => {
        const payload = JSON.stringify({ event: "test" });
        const secret = "shhh";
        const { hex } = await computeSignature(payload, secret);

        await expect(
            verifyCreemWebhookSignature(payload, hex, secret),
        ).resolves.toBe(true);
    });

    it("accepts signatures embedded in header formats", async () => {
        const payload = "{}";
        const secret = "header-secret";
        const { hex, b64 } = await computeSignature(payload, secret);
        const header = `t=12345, v1=${hex}, sig=${b64}`;

        await expect(
            verifyCreemWebhookSignature(payload, header, secret),
        ).resolves.toBe(true);
    });

    it("rejects invalid signatures", async () => {
        const result = await verifyCreemWebhookSignature(
            "{}",
            "invalid",
            "secret",
        );
        expect(result).toBe(false);
    });

    it("returns false when verification throws", async () => {
        const subtleSpy = vi
            .spyOn(crypto.subtle, "sign")
            .mockRejectedValue(new Error("boom"));

        const result = await verifyCreemWebhookSignature(
            "{}",
            "whatever",
            "secret",
        );
        expect(result).toBe(false);

        subtleSpy.mockRestore();
    });
});
