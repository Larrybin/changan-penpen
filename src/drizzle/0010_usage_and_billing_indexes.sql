CREATE INDEX IF NOT EXISTS "usage_daily_date_idx" ON "usage_daily" ("date");
CREATE INDEX IF NOT EXISTS "usage_daily_user_created_at_idx" ON "usage_daily" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");
CREATE INDEX IF NOT EXISTS "orders_customer_created_at_idx" ON "orders" ("customer_id", "created_at");

CREATE INDEX IF NOT EXISTS "credits_history_created_at_idx" ON "credits_history" ("created_at");
CREATE INDEX IF NOT EXISTS "credits_history_customer_created_at_idx" ON "credits_history" ("customer_id", "created_at");
