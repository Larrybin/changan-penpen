import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const isoNow = () => new Date().toISOString();

export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
        .default(false)
        .notNull(),
    image: text("image"),
    currentCredits: integer("current_credits").notNull().default(0),
    lastCreditRefreshAt: text("lastCreditRefreshAt"),
    createdAt: text("createdAt").notNull().$defaultFn(isoNow),
    updatedAt: text("updatedAt").notNull().$defaultFn(isoNow).$onUpdate(isoNow),
});

export const session = sqliteTable("session", {
    id: text("id").primaryKey(),
    expiresAt: text("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: text("createdAt").notNull().$defaultFn(isoNow),
    updatedAt: text("updatedAt").notNull().$defaultFn(isoNow).$onUpdate(isoNow),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: text("accessTokenExpiresAt"),
    refreshTokenExpiresAt: text("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: text("createdAt").notNull().$defaultFn(isoNow),
    updatedAt: text("updatedAt").notNull().$defaultFn(isoNow).$onUpdate(isoNow),
});

export const verification = sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: text("expiresAt").notNull(),
    createdAt: text("createdAt").notNull().$defaultFn(isoNow),
    updatedAt: text("updatedAt").notNull().$defaultFn(isoNow).$onUpdate(isoNow),
});
