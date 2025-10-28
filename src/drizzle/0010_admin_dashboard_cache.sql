CREATE TABLE IF NOT EXISTS `admin_dashboard_cache` (
    `key` text PRIMARY KEY NOT NULL,
    `tenant_id` text,
    `from_date` text,
    `payload` text NOT NULL,
    `created_at` text NOT NULL,
    `updated_at` text NOT NULL,
    `expires_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `admin_dashboard_cache_tenant_from_idx`
    ON `admin_dashboard_cache` (`tenant_id`, `from_date`);

CREATE INDEX IF NOT EXISTS `admin_dashboard_cache_expires_at_idx`
    ON `admin_dashboard_cache` (`expires_at`);
