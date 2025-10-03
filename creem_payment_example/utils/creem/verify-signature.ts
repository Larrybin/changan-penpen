import { createHmac } from "crypto";

export function verifyCreemWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Create HMAC SHA256 digest of raw payload
    const hmac = createHmac("sha256", secret);
    const digest = hmac.update(payload).digest();
    const hex = digest.toString("hex");
    const b64 = digest.toString("base64");

    const header = (signature || "").trim();

    // Case 1: header is raw hex or base64 digest
    if (header && (timingSafeEqual(header, hex) || timingSafeEqual(header, b64))) {
      return true;
    }

    // Case 2: header contains kv pairs like "t=...,v1=..."
    // Try to locate a "v1" style signature value
    const parts = header.split(/[;,\s]/).map((p) => p.trim()).filter(Boolean);
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
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
