import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    type: text("type").notNull().default("one_time"),
    status: text("status").notNull().default("draft"),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
});

export const coupons = sqliteTable("coupons", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    description: text("description"),
    discountType: text("discount_type").notNull().default("percentage"),
    discountValue: integer("discount_value").notNull().default(0),
    maxRedemptions: integer("max_redemptions"),
    redeemedCount: integer("redeemed_count").notNull().default(0),
    startsAt: text("starts_at"),
    endsAt: text("ends_at"),
    status: text("status").notNull().default("inactive"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
});

export const contentPages = sqliteTable("content_pages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary"),
    language: text("language"),
    status: text("status").notNull().default("draft"),
    content: text("content"),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
});
