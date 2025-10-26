CREATE TABLE IF NOT EXISTS `marketing_content_drafts` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `locale` text NOT NULL,
    `section` text NOT NULL,
    `payload` text NOT NULL,
    `status` text NOT NULL DEFAULT 'draft',
    `version` integer NOT NULL DEFAULT 1,
    `last_published_version` integer,
    `preview_token` text,
    `preview_token_expires_at` text,
    `updated_by` text,
    `created_at` text NOT NULL,
    `updated_at` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `marketing_content_drafts_locale_section_idx`
    ON `marketing_content_drafts` (`locale`, `section`);

CREATE UNIQUE INDEX IF NOT EXISTS `marketing_content_drafts_preview_token_idx`
    ON `marketing_content_drafts` (`preview_token`);

CREATE TABLE IF NOT EXISTS `marketing_content_versions` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `locale` text NOT NULL,
    `section` text NOT NULL,
    `version` integer NOT NULL,
    `payload` text NOT NULL,
    `metadata_version` text,
    `created_by` text,
    `created_at` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `marketing_content_versions_locale_section_version_idx`
    ON `marketing_content_versions` (`locale`, `section`, `version`);

CREATE INDEX IF NOT EXISTS `marketing_content_versions_locale_section_idx`
    ON `marketing_content_versions` (`locale`, `section`);

CREATE TABLE IF NOT EXISTS `marketing_content_audit` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `locale` text NOT NULL,
    `section` text NOT NULL,
    `action` text NOT NULL,
    `message` text,
    `metadata` text,
    `actor` text,
    `version` integer,
    `created_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `marketing_content_audit_locale_section_idx`
    ON `marketing_content_audit` (`locale`, `section`);
