import {
    splitSignatureFromParams,
    verifyCreemReturnUrlSignature,
} from "@/modules/creem/utils/verify-signature";

export type VerificationState =
    | "verified"
    | "invalid"
    | "missingSignature"
    | "missingSecret";

export type VerificationResult = {
    state: VerificationState;
    params: Record<string, string>;
};

export type ReturnDetails = {
    requestId?: string;
    checkoutId?: string;
    status?: string;
    timestamp?: string;
};

export function normalizeSearchParams(
    searchParams?: Record<string, string | string[] | undefined>,
): Record<string, string> {
    if (!searchParams) {
        return {};
    }
    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries(searchParams)) {
        if (typeof value === "string") {
            record[key] = value;
        } else if (Array.isArray(value) && value.length > 0) {
            const first = value.find((item) => typeof item === "string");
            if (first) {
                record[key] = first;
            }
        }
    }
    return record;
}

export async function evaluateReturnRedirect(
    searchParams: Record<string, string | string[] | undefined> | undefined,
    context: string,
): Promise<VerificationResult> {
    const normalized = normalizeSearchParams(searchParams);
    const { signature, sanitized } = splitSignatureFromParams(normalized);
    const secret = process.env.CREEM_WEBHOOK_SECRET;

    if (!secret) {
        console.error(
            `[billing/${context}] CREEM_WEBHOOK_SECRET missing for return verification`,
            { params: sanitized },
        );
        return { state: "missingSecret", params: sanitized };
    }

    if (!signature) {
        console.warn(`[billing/${context}] Missing signature on Creem return`, {
            params: sanitized,
        });
        return { state: "missingSignature", params: sanitized };
    }

    const valid = await verifyCreemReturnUrlSignature(
        sanitized,
        secret,
        signature,
    );
    if (!valid) {
        console.error(`[billing/${context}] Invalid Creem return signature`, {
            params: sanitized,
            signature,
        });
        return { state: "invalid", params: sanitized };
    }

    return { state: "verified", params: sanitized };
}

export function extractReturnDetails(
    params: Record<string, string>,
): ReturnDetails {
    return {
        requestId: params.request_id ?? params.requestId,
        checkoutId: params.checkout_id ?? params.checkoutId,
        status:
            params.status ??
            params.payment_status ??
            params.state ??
            params.checkout_status,
        timestamp: params.timestamp ?? params.t,
    };
}
