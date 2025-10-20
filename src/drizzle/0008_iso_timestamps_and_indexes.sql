PRAGMA foreign_keys=OFF;

-- Migrate user table to ISO8601 timestamps and camelCase column names
ALTER TABLE `user` RENAME TO `user_old`;
CREATE TABLE `user` (
    `id` text PRIMARY KEY NOT NULL,
    `name` text NOT NULL,
    `email` text NOT NULL,
    `email_verified` integer DEFAULT 0 NOT NULL,
    `image` text,
    `current_credits` integer DEFAULT 0 NOT NULL,
    `lastCreditRefreshAt` text,
    `createdAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    `updatedAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO `user` (
    `id`,
    `name`,
    `email`,
    `email_verified`,
    `image`,
    `current_credits`,
    `lastCreditRefreshAt`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `id`,
    `name`,
    `email`,
    `email_verified`,
    `image`,
    `current_credits`,
    CASE
        WHEN `last_credit_refresh_at` IS NULL THEN NULL
        ELSE strftime('%Y-%m-%dT%H:%M:%fZ', `last_credit_refresh_at` / 1000.0, 'unixepoch')
    END,
    strftime('%Y-%m-%dT%H:%M:%fZ', `created_at` / 1000.0, 'unixepoch'),
    strftime('%Y-%m-%dT%H:%M:%fZ', `updated_at` / 1000.0, 'unixepoch')
FROM `user_old`;
DROP TABLE `user_old`;
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);

-- Migrate session table
ALTER TABLE `session` RENAME TO `session_old`;
CREATE TABLE `session` (
    `id` text PRIMARY KEY NOT NULL,
    `expiresAt` text NOT NULL,
    `token` text NOT NULL,
    `createdAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    `updatedAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    `ip_address` text,
    `user_agent` text,
    `user_id` text NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `session` (
    `id`,
    `expiresAt`,
    `token`,
    `createdAt`,
    `updatedAt`,
    `ip_address`,
    `user_agent`,
    `user_id`
)
SELECT
    `id`,
    strftime('%Y-%m-%dT%H:%M:%fZ', `expires_at` / 1000.0, 'unixepoch'),
    `token`,
    strftime('%Y-%m-%dT%H:%M:%fZ', `created_at` / 1000.0, 'unixepoch'),
    strftime('%Y-%m-%dT%H:%M:%fZ', `updated_at` / 1000.0, 'unixepoch'),
    `ip_address`,
    `user_agent`,
    `user_id`
FROM `session_old`;
DROP TABLE `session_old`;
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);

-- Migrate account table
ALTER TABLE `account` RENAME TO `account_old`;
CREATE TABLE `account` (
    `id` text PRIMARY KEY NOT NULL,
    `account_id` text NOT NULL,
    `provider_id` text NOT NULL,
    `user_id` text NOT NULL,
    `access_token` text,
    `refresh_token` text,
    `id_token` text,
    `accessTokenExpiresAt` text,
    `refreshTokenExpiresAt` text,
    `scope` text,
    `password` text,
    `createdAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    `updatedAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `account` (
    `id`,
    `account_id`,
    `provider_id`,
    `user_id`,
    `access_token`,
    `refresh_token`,
    `id_token`,
    `accessTokenExpiresAt`,
    `refreshTokenExpiresAt`,
    `scope`,
    `password`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `id`,
    `account_id`,
    `provider_id`,
    `user_id`,
    `access_token`,
    `refresh_token`,
    `id_token`,
    CASE
        WHEN `access_token_expires_at` IS NULL THEN NULL
        ELSE strftime('%Y-%m-%dT%H:%M:%fZ', `access_token_expires_at` / 1000.0, 'unixepoch')
    END,
    CASE
        WHEN `refresh_token_expires_at` IS NULL THEN NULL
        ELSE strftime('%Y-%m-%dT%H:%M:%fZ', `refresh_token_expires_at` / 1000.0, 'unixepoch')
    END,
    `scope`,
    `password`,
    strftime('%Y-%m-%dT%H:%M:%fZ', `created_at` / 1000.0, 'unixepoch'),
    strftime('%Y-%m-%dT%H:%M:%fZ', `updated_at` / 1000.0, 'unixepoch')
FROM `account_old`;
DROP TABLE `account_old`;

-- Migrate verification table
ALTER TABLE `verification` RENAME TO `verification_old`;
CREATE TABLE `verification` (
    `id` text PRIMARY KEY NOT NULL,
    `identifier` text NOT NULL,
    `value` text NOT NULL,
    `expiresAt` text NOT NULL,
    `createdAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    `updatedAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO `verification` (
    `id`,
    `identifier`,
    `value`,
    `expiresAt`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `id`,
    `identifier`,
    `value`,
    strftime('%Y-%m-%dT%H:%M:%fZ', `expires_at` / 1000.0, 'unixepoch'),
    strftime('%Y-%m-%dT%H:%M:%fZ', `created_at` / 1000.0, 'unixepoch'),
    strftime('%Y-%m-%dT%H:%M:%fZ', `updated_at` / 1000.0, 'unixepoch')
FROM `verification_old`;
DROP TABLE `verification_old`;

-- Migrate credit_transactions table
ALTER TABLE `credit_transactions` RENAME TO `credit_transactions_old`;
CREATE TABLE `credit_transactions` (
    `id` text PRIMARY KEY NOT NULL DEFAULT ('ctxn_' || lower(hex(randomblob(12)))),
    `user_id` text NOT NULL,
    `amount` integer NOT NULL,
    `remainingAmount` integer NOT NULL DEFAULT 0,
    `type` text NOT NULL,
    `description` text NOT NULL,
    `expirationDate` text,
    `expirationDateProcessedAt` text,
    `paymentIntentId` text,
    `createdAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    `updatedAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `credit_transactions` (
    `id`,
    `user_id`,
    `amount`,
    `remainingAmount`,
    `type`,
    `description`,
    `expirationDate`,
    `expirationDateProcessedAt`,
    `paymentIntentId`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `id`,
    `user_id`,
    `amount`,
    `remaining_amount`,
    `type`,
    `description`,
    CASE
        WHEN `expiration_date` IS NULL THEN NULL
        ELSE strftime('%Y-%m-%dT%H:%M:%fZ', `expiration_date` / 1000.0, 'unixepoch')
    END,
    CASE
        WHEN `expiration_date_processed_at` IS NULL THEN NULL
        ELSE strftime('%Y-%m-%dT%H:%M:%fZ', `expiration_date_processed_at` / 1000.0, 'unixepoch')
    END,
    `payment_intent_id`,
    strftime('%Y-%m-%dT%H:%M:%fZ', `created_at` / 1000.0, 'unixepoch'),
    strftime('%Y-%m-%dT%H:%M:%fZ', `updated_at` / 1000.0, 'unixepoch')
FROM `credit_transactions_old`;
DROP TABLE `credit_transactions_old`;
CREATE INDEX `credit_transactions_user_id_idx` ON `credit_transactions` (`user_id`);
CREATE INDEX `credit_transactions_type_idx` ON `credit_transactions` (`type`);
CREATE INDEX `credit_transactions_created_at_idx` ON `credit_transactions` (`createdAt`);
CREATE INDEX `credit_transactions_expiration_idx` ON `credit_transactions` (`expirationDate`);
CREATE INDEX `credit_transactions_payment_intent_idx` ON `credit_transactions` (`paymentIntentId`);

-- Migrate todos table
ALTER TABLE `todos` RENAME TO `todos_old`;
CREATE TABLE `todos` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `title` text NOT NULL,
    `description` text,
    `categoryId` integer,
    `userId` text NOT NULL,
    `status` text NOT NULL DEFAULT 'pending',
    `priority` text NOT NULL DEFAULT 'medium',
    `imageUrl` text,
    `imageAlt` text,
    `completed` integer NOT NULL DEFAULT 0,
    `dueDate` text,
    `createdAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    `updatedAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `todos` (
    `id`,
    `title`,
    `description`,
    `categoryId`,
    `userId`,
    `status`,
    `priority`,
    `imageUrl`,
    `imageAlt`,
    `completed`,
    `dueDate`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `id`,
    `title`,
    `description`,
    `category_id`,
    `user_id`,
    `status`,
    `priority`,
    `image_url`,
    `image_alt`,
    `completed`,
    `due_date`,
    `created_at`,
    `updated_at`
FROM `todos_old`;
DROP TABLE `todos_old`;
CREATE INDEX `todos_user_id_idx` ON `todos` (`userId`);
CREATE INDEX `todos_status_idx` ON `todos` (`status`);
CREATE INDEX `todos_created_at_idx` ON `todos` (`createdAt`);

-- Migrate categories table
ALTER TABLE `categories` RENAME TO `categories_old`;
CREATE TABLE `categories` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `name` text NOT NULL,
    `color` text DEFAULT '#6366f1',
    `description` text,
    `userId` text NOT NULL,
    `createdAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    `updatedAt` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `categories` (
    `id`,
    `name`,
    `color`,
    `description`,
    `userId`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `id`,
    `name`,
    `color`,
    `description`,
    `user_id`,
    `created_at`,
    `updated_at`
FROM `categories_old`;
DROP TABLE `categories_old`;

PRAGMA foreign_keys=ON;
