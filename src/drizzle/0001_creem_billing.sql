-- customers table
CREATE TABLE IF NOT EXISTS "customers" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_id" text NOT NULL,
    "creem_customer_id" text,
    "email" text,
    "name" text,
    "country" text,
    "credits" integer NOT NULL DEFAULT 0,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "customers_creem_customer_id_unique" ON "customers" ("creem_customer_id");
CREATE INDEX IF NOT EXISTS "customers_user_id_idx" ON "customers" ("user_id");

-- subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "customer_id" integer NOT NULL,
    "creem_subscription_id" text NOT NULL,
    "creem_product_id" text,
    "status" text,
    "current_period_start" text,
    "current_period_end" text,
    "canceled_at" text,
    "metadata" text,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL,
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_creem_subscription_id_unique" ON "subscriptions" ("creem_subscription_id");
CREATE INDEX IF NOT EXISTS "subscriptions_customer_id_idx" ON "subscriptions" ("customer_id");

-- credits_history table
CREATE TABLE IF NOT EXISTS "credits_history" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "customer_id" integer NOT NULL,
    "amount" integer NOT NULL,
    "type" text NOT NULL,
    "description" text,
    "creem_order_id" text,
    "created_at" text NOT NULL,
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "credits_history_creem_order_id_unique" ON "credits_history" ("creem_order_id");
CREATE INDEX IF NOT EXISTS "credits_history_customer_id_idx" ON "credits_history" ("customer_id");

