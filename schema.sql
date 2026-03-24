-- CowAgent Skill Hub - D1 Database Schema

CREATE TABLE IF NOT EXISTS skills (
  name             TEXT PRIMARY KEY,                -- unique slug, e.g. "web-search"
  display_name     TEXT NOT NULL,                   -- display name, e.g. "Web Search"
  description      TEXT NOT NULL DEFAULT '',        -- short one-liner for cards
  summary          TEXT NOT NULL DEFAULT '',        -- longer 2-3 sentence overview for detail page (fallback to description)
  version          TEXT NOT NULL DEFAULT '1.0.0',
  author           TEXT NOT NULL DEFAULT 'CowAgent',
  category         TEXT NOT NULL DEFAULT 'official' CHECK (category IN ('official', 'community', 'external')),
  tags             TEXT NOT NULL DEFAULT '[]',      -- JSON array, e.g. '["search","web"]'
  featured         INTEGER NOT NULL DEFAULT 0,      -- 1 = show on homepage featured section
  sort_order       INTEGER NOT NULL DEFAULT 100,    -- lower = higher priority
  downloads        INTEGER NOT NULL DEFAULT 0,
  views            INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'pending', 'published', 'hidden')),
  skill_md         TEXT NOT NULL DEFAULT '',        -- full SKILL.md content for detail page rendering
  requires_env     TEXT NOT NULL DEFAULT '[]',      -- JSON array, e.g. '["GOOGLE_API_KEY"]'
  requires_bins    TEXT NOT NULL DEFAULT '[]',      -- JSON array, e.g. '["gh","curl"]'
  platforms        TEXT NOT NULL DEFAULT '["darwin","linux","windows"]', -- JSON array of supported OS
  homepage         TEXT,                            -- external homepage URL
  source_type      TEXT NOT NULL DEFAULT 'zip' CHECK (source_type IN ('zip', 'github', 'registry')),
  source_provider  TEXT NOT NULL DEFAULT 'cowagent' CHECK (source_provider IN ('cowagent', 'github', 'openclaw', 'clawhub', 'linkai', 'community')),
  source_url       TEXT,                           -- github: "owner/repo", clawhub: slug, etc.
  source_path      TEXT,                           -- subdirectory within source (for multi-skill repos)
  r2_key           TEXT,                           -- R2 object key, e.g. "skills/web-search/1.0.0.zip"
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skill_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name  TEXT NOT NULL REFERENCES skills(name) ON DELETE CASCADE,
  path        TEXT NOT NULL,                       -- relative path, e.g. "scripts/search.py"
  content     TEXT NOT NULL DEFAULT '',            -- file text content (for preview)
  size        INTEGER NOT NULL DEFAULT 0,          -- file size in bytes
  UNIQUE(skill_name, path)
);

CREATE TABLE IF NOT EXISTS install_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name  TEXT NOT NULL REFERENCES skills(name) ON DELETE CASCADE,
  client_ip   TEXT,
  user_agent  TEXT,
  cow_version TEXT,                                -- CowAgent version
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tag definitions for frontend display and filtering
CREATE TABLE IF NOT EXISTS tag_definitions (
  id         TEXT PRIMARY KEY,                     -- tag slug, e.g. "coding"
  name       TEXT NOT NULL,                        -- display name, e.g. "编程"
  sort_order INTEGER NOT NULL DEFAULT 100          -- lower = show first
);

INSERT OR IGNORE INTO tag_definitions (id, name, sort_order) VALUES
  ('search', '搜索', 10),
  ('web', '网络', 20),
  ('coding', '编程', 30),
  ('productivity', '效率', 40),
  ('api', 'API', 50),
  ('automation', '自动化', 60),
  ('data', '数据', 70),
  ('ai', 'AI', 80),
  ('devops', 'DevOps', 90),
  ('communication', '通讯', 100);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);
CREATE INDEX IF NOT EXISTS idx_skills_featured ON skills(featured);
CREATE INDEX IF NOT EXISTS idx_skills_downloads ON skills(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_skills_provider ON skills(source_provider);
CREATE INDEX IF NOT EXISTS idx_skill_files_name ON skill_files(skill_name);
CREATE INDEX IF NOT EXISTS idx_install_logs_name ON install_logs(skill_name);
CREATE INDEX IF NOT EXISTS idx_install_logs_date ON install_logs(created_at);
