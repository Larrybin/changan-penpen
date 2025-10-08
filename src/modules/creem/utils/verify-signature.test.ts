import { describe, expect, it } from "vitest";
import { verifyCreemWebhookSignature } from "./verify-signature";

describe("verifyCreemWebhookSignature", () => {
    const payload = '{"id":1}';
    const secret = "top-secret";

    it("接受十六进制签名", async () => {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: { name: "SHA-256" } },
            false,
            ["sign"],
        );
        const sigBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(payload),
        );
        const bytes = new Uint8Array(sigBuffer);
        const hex = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        expect(await verifyCreemWebhookSignature(payload, hex, secret)).toBe(
            true,
        );
    });

    it("接受 base64 签名与 header 格式", async () => {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: { name: "SHA-256" } },
            false,
            ["sign"],
        );
        const sigBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(payload),
        );
        const base64 = Buffer.from(sigBuffer).toString("base64");
        const header = `t=123,v1=${base64}`;
        expect(await verifyCreemWebhookSignature(payload, header, secret)).toBe(
            true,
        );
    });

    it("长度不一致或无效值返回 false", async () => {
        expect(
            await verifyCreemWebhookSignature(payload, "invalid", secret),
        ).toBe(false);
        expect(
            await verifyCreemWebhookSignature(payload, "sig=bad", secret),
        ).toBe(false);
    });
});

