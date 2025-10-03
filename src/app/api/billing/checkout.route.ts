import { NextResponse } from "next/server";

type Body = {
    priceId?: string;
    plan?: string;
    quantity?: number;
};

export async function POST(req: Request) {
    try {
        const { priceId, quantity }: Body = await req.json();
        if (!priceId) {
            return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
        }

        const secret = process.env.STRIPE_SECRET_KEY;
        if (!secret) {
            return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
        }

        const origin = new URL(req.url).origin;
        const body = new URLSearchParams({
            mode: "subscription",
            "line_items[0][price]": priceId,
            "line_items[0][quantity]": String(quantity ?? 1),
            success_url: `${origin}/billing?status=success`,
            cancel_url: `${origin}/billing?status=cancel`,
            automatic_tax: "enabled",
        });

        const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${secret}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });

        const text = await res.text();
        if (!res.ok) {
            let message = text;
            try {
                const j = JSON.parse(text);
                message = j?.error?.message ?? text;
            } catch {
                // noop
            }
            return NextResponse.json({ error: `Stripe error: ${message}` }, { status: 502 });
        }

        const data = JSON.parse(text);
        return NextResponse.json({ id: data.id, url: data.url }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export function GET() {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

