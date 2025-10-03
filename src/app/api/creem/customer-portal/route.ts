import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { getDb } from "@/db";
import { customers } from "@/modules/creem/schemas/billing.schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const db = await getDb();
        const row = await db
            .select({ creemCustomerId: customers.creemCustomerId })
            .from(customers)
            .where(eq(customers.userId, session.user.id))
            .limit(1);
        const creemCustomerId = row[0]?.creemCustomerId;
        if (!creemCustomerId) {
            return new Response("No subscription/customer found", { status: 404 });
        }

        const { env } = await getCloudflareContext();
        const resp = await fetch(`${env.CREEM_API_URL}/customers/billing`, {
            method: "POST",
            headers: {
                "x-api-key": env.CREEM_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ customer_id: creemCustomerId }),
        });
        if (!resp.ok) {
            const t = await resp.text();
            return new Response(`Failed to get portal link: ${t}`, { status: 500 });
        }
        type BillingPortalResponse = { url?: string; portal_url?: string; billing_url?: string };
        const json = (await resp.json()) as unknown as BillingPortalResponse;
        const url = json?.url || json?.portal_url || json?.billing_url;
        if (!url || typeof url !== "string") {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid response from Creem: missing portal url", data: null }),
                { status: 502, headers: { "Content-Type": "application/json" } },
            );
        }
        // 标准化字段：data.portalUrl，同时保留旧字段以兼容既有前端；附带 meta.raw 便于调试
        const payload = {
            success: true,
            data: { portalUrl: url },
            error: null as string | null,
            // legacy fields for backward compatibility
            url: json?.url,
            portal_url: json?.portal_url,
            billing_url: json?.billing_url,
            meta: { raw: json },
        };
        return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        return new Response("Internal Server Error", { status: 500 });
    }
}
