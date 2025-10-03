-- usage events: 细粒度事件
CREATE TABLE IF NOT EXISTS "usage_events" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_id" text NOT NULL,
    "feature" text NOT NULL,
    "amount" integer NOT NULL,
    "unit" text NOT NULL,
    "metadata" text,
    "created_at" text NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "usage_events_user_id_idx" ON "usage_events" ("user_id");
CREATE INDEX IF NOT EXISTS "usage_events_created_idx" ON "usage_events" ("created_at");
CREATE INDEX IF NOT EXISTS "usage_events_feature_idx" ON "usage_events" ("feature");

-- daily aggregate: 便于统计查询
CREATE TABLE IF NOT EXISTS "usage_daily" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_id" text NOT NULL,
    "date" text NOT NULL,
    "feature" text NOT NULL,
    "total_amount" integer NOT NULL,
    "unit" text NOT NULL,
    "created_at" text NOT NULL,
    "updated_at" text NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "usage_daily_user_date_feature_unique" ON "usage_daily" ("user_id","date","feature");
CREATE INDEX IF NOT EXISTS "usage_daily_user_date_idx" ON "usage_daily" ("user_id","date");

