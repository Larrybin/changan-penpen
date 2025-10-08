CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique
    ON products (slug);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_unique
    ON coupons (code);

CREATE UNIQUE INDEX IF NOT EXISTS content_pages_slug_unique
    ON content_pages (slug);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_creem_subscription_id_unique
    ON subscriptions (creem_subscription_id);

CREATE UNIQUE INDEX IF NOT EXISTS credits_history_creem_order_id_unique
    ON credits_history (creem_order_id);
