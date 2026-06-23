-- CowAgent Skill Hub - MySQL Database Schema (self-hosted / Node deployment)
--
-- This mirrors schema.sql (D1/SQLite) for MySQL 8.0+.
-- Import with: mysql -u <user> -p <database> < mysql/schema.sql

SET NAMES utf8mb4;

-- Users (OAuth login and skill ownership)
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(191) PRIMARY KEY,                          -- e.g. github:123 or google:sub
  provider      VARCHAR(16)  NOT NULL DEFAULT 'github',
  username      VARCHAR(191) NOT NULL,
  display_name  VARCHAR(255) NOT NULL DEFAULT '',
  avatar_url    TEXT,
  github_url    TEXT,
  role          VARCHAR(16)  NOT NULL DEFAULT 'user',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_provider_username (provider, username),
  CONSTRAINT chk_users_provider CHECK (provider IN ('github', 'google')),
  CONSTRAINT chk_users_role CHECK (role IN ('admin', 'user'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS skills (
  name             VARCHAR(191) PRIMARY KEY,                       -- unique slug, e.g. "web-search"
  display_name     VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  summary          TEXT NOT NULL,
  version          VARCHAR(32)  NOT NULL DEFAULT '1.0.0',
  author           VARCHAR(255) NOT NULL DEFAULT 'CowAgent',
  author_id        VARCHAR(191) NULL,
  category         VARCHAR(16)  NOT NULL DEFAULT 'community',
  tags             TEXT NOT NULL,                                  -- JSON array (stored as text)
  featured         TINYINT      NOT NULL DEFAULT 0,
  sort_order       INT          NOT NULL DEFAULT 100,
  downloads        INT          NOT NULL DEFAULT 0,
  views            INT          NOT NULL DEFAULT 0,
  status           VARCHAR(16)  NOT NULL DEFAULT 'published',
  skill_md         LONGTEXT     NOT NULL,
  requires_env     TEXT NOT NULL,
  requires_bins    TEXT NOT NULL,
  platforms        TEXT NOT NULL,
  homepage         TEXT,
  source_type      VARCHAR(16)  NOT NULL DEFAULT 'zip',
  source_provider  VARCHAR(32)  NOT NULL DEFAULT 'cowagent',
  source_url       TEXT,
  source_path      TEXT,
  r2_key           VARCHAR(512) NULL,                              -- object storage key
  sha256           VARCHAR(128) NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_skills_category CHECK (category IN ('community', 'external')),
  CONSTRAINT chk_skills_status CHECK (status IN ('draft', 'pending', 'published', 'hidden')),
  CONSTRAINT chk_skills_source_type CHECK (source_type IN ('zip', 'github', 'registry')),
  CONSTRAINT chk_skills_source_provider CHECK (source_provider IN ('cowagent', 'github', 'openclaw', 'clawhub', 'linkai', 'community')),
  CONSTRAINT fk_skills_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS skill_files (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  skill_name  VARCHAR(191) NOT NULL,
  path        VARCHAR(512) NOT NULL,
  content     LONGTEXT     NOT NULL,
  size        INT          NOT NULL DEFAULT 0,
  UNIQUE KEY uq_skill_files (skill_name, path),
  CONSTRAINT fk_skill_files_skill FOREIGN KEY (skill_name) REFERENCES skills(name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS install_logs (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  skill_name  VARCHAR(191) NOT NULL,
  user_agent  TEXT,
  cow_version VARCHAR(64),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_install_logs_skill FOREIGN KEY (skill_name) REFERENCES skills(name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tag_definitions (
  id         VARCHAR(64) PRIMARY KEY,
  name       VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO tag_definitions (id, name, sort_order) VALUES
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
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_status ON skills(status);
CREATE INDEX idx_skills_featured ON skills(featured);
CREATE INDEX idx_skills_downloads ON skills(downloads);
CREATE INDEX idx_skills_provider ON skills(source_provider);
CREATE INDEX idx_skills_author ON skills(author_id);
CREATE INDEX idx_skill_files_name ON skill_files(skill_name);
CREATE INDEX idx_install_logs_name ON install_logs(skill_name);
CREATE INDEX idx_install_logs_date ON install_logs(created_at);
