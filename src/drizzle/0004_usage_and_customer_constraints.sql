CREATE UNIQUE INDEX IF NOT EXISTS usage_daily_user_feature_date_unique
    ON usage_daily (user_id, feature, date);

CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_unique
    ON customers (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS customers_creem_customer_id_unique
    ON customers (creem_customer_id);
