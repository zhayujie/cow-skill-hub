-- Optional English display name / description for the /en/ pages.
-- Empty values fall back to display_name / description, so this is safe to
-- apply before any translations exist. Run ONCE (ADD COLUMN is not idempotent).
--
-- Local:  npx wrangler d1 execute cow-skill-hub --local --file=migrations/002_skills_en.sql
-- Remote: npx wrangler d1 execute cow-skill-hub --remote --file=migrations/002_skills_en.sql
--
-- MySQL (self-hosted):
--   ALTER TABLE skills ADD COLUMN display_name_en VARCHAR(255) NULL, ADD COLUMN description_en TEXT NULL;

ALTER TABLE skills ADD COLUMN display_name_en TEXT NOT NULL DEFAULT '';
ALTER TABLE skills ADD COLUMN description_en TEXT NOT NULL DEFAULT '';
