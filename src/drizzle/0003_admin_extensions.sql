CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "site_name" text,
    "domain" text,
    "logo_url" text,
    "favicon_url" text,
    "seo_title" text,
    "seo_description" text,
    "seo_og_image" text,
    "sitemap_enabled" integer DEFAULT 0 NOT NULL,
    "robots_rules" text,
    "brand_primary_color" text,
    "brand_secondary_color" text,
    "brand_font_family" text,
    "head_html" text,
    "footer_html" text,
    "default_language" text,
    "enabled_languages" text,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_singleton" ON "site_settings" ("id");

CREATE TABLE IF NOT EXISTS "products" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "slug" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "currency" text DEFAULT 'USD' NOT NULL,
    "type" text DEFAULT 'one_time' NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "metadata" text,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" ("slug");

CREATE TABLE IF NOT EXISTS "coupons" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "code" text NOT NULL,
    "description" text,
    "discount_type" text DEFAULT 'percentage' NOT NULL,
    "discount_value" integer DEFAULT 0 NOT NULL,
    "max_redemptions" integer,
    "redeemed_count" integer DEFAULT 0 NOT NULL,
    "starts_at" text,
    "ends_at" text,
    "status" text DEFAULT 'inactive' NOT NULL,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_unique" ON "coupons" ("code");

CREATE TABLE IF NOT EXISTS "content_pages" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "title" text NOT NULL,
    "slug" text NOT NULL,
    "summary" text,
    "language" text,
    "status" text DEFAULT 'draft' NOT NULL,
    "content" text,
    "published_at" text,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "content_pages_slug_unique" ON "content_pages" ("slug");

CREATE TABLE IF NOT EXISTS "orders" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "customer_id" integer NOT NULL,
    "amount_cents" integer DEFAULT 0 NOT NULL,
    "currency" text DEFAULT 'USD' NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "source" text,
    "creem_order_id" text,
    "created_at" text NOT NULL,
    CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE cascade ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "orders_customer_id_idx" ON "orders" ("customer_id");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");

CREATE TABLE IF NOT EXISTS "reports" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "type" text NOT NULL,
    "parameters" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "download_url" text,
    "created_at" text NOT NULL,
    "completed_at" text
);
CREATE INDEX IF NOT EXISTS "reports_type_idx" ON "reports" ("type");

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "admin_email" text NOT NULL,
    "action" text NOT NULL,
    "target_type" text,
    "target_id" text,
    "metadata" text,
    "created_at" text NOT NULL
);
CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_idx" ON "admin_audit_logs" ("created_at");
