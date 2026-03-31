-- Rebuild users for OAuth: provider column + UNIQUE(provider, username).
-- Run ONCE on local + remote D1. Do not re-run after users already has `provider`.
--
-- Local:  cd ref/cow-skill-hub && npx wrangler d1 execute cow-skill-hub --local --file=migrations/001_users_provider.sql
-- Remote: cd ref/cow-skill-hub && npx wrangler d1 execute cow-skill-hub --remote --file=migrations/001_users_provider.sql

PRAGMA foreign_keys = OFF;

-- If this D1 never had users, create legacy-shaped empty table so INSERT..SELECT below is valid.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  github_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

DROP TABLE IF EXISTS users_new;

CREATE TABLE users_new (
  id            TEXT PRIMARY KEY,
  provider      TEXT NOT NULL DEFAULT 'github' CHECK (provider IN ('github', 'google')),
  username      TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  github_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, username)
);

INSERT OR IGNORE INTO users_new (id, provider, username, display_name, avatar_url, github_url, role, created_at)
SELECT id, 'github', username, display_name, avatar_url, github_url, role, created_at FROM users;

DROP TABLE IF EXISTS users;

ALTER TABLE users_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_skills_author ON skills(author_id);

PRAGMA foreign_keys = ON;
