export type CreemCustomer = {
    id: string;
    email?: string;
    name?: string;
    country?: string;
};

export type CreemOrder = {
    id: string;
};

export type CreemSubscription = {
    id: string;
    customer: CreemCustomer | string;
    product?: string | { id: string };
    status?: string;
    current_period_start_date?: string;
    current_period_end_date?: string;
    canceled_at?: string | null;
    metadata?: Record<string, unknown>;
};

export type CreemCheckout = {
    customer: CreemCustomer;
    order: CreemOrder;
    subscription?: CreemSubscription | null;
    metadata?: {
        user_id?: string;
        product_type?: "subscription" | "credits" | string;
        credits?: number;
        [k: string]: unknown;
    };
};

export type CreemWebhookEvent = {
    eventType: string;
    object: unknown;
};
