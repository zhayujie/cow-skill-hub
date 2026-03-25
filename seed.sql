INSERT INTO skills (name, display_name, description, summary, version, author, category, tags, featured, sort_order, status, source_type, source_provider, source_url, homepage)
VALUES ('web-search', 'Web Search', '让 Agent 具备实时搜索互联网的能力', '为 CowAgent 提供实时互联网搜索能力，支持 Google、Bing 等搜索引擎。', '1.2.0', 'CowAgent', 'community', '["search","web"]', 1, 10, 'published', 'zip', 'cowagent', NULL, NULL);

INSERT INTO skills (name, display_name, description, summary, version, author, category, tags, featured, sort_order, status, source_type, source_provider, source_url, homepage)
VALUES ('code-runner', 'Code Runner', '在安全沙箱中运行代码并返回结果', '支持 Python、JavaScript、Shell 等多种语言的安全代码执行。', '1.0.0', 'CowAgent', 'community', '["coding","automation"]', 1, 20, 'published', 'zip', 'cowagent', NULL, NULL);

INSERT INTO skills (name, display_name, description, summary, version, author, category, tags, featured, sort_order, status, source_type, source_provider, source_url, homepage)
VALUES ('github-agent', 'GitHub Agent', '自动化 GitHub 工作流：创建 Issue、提交 PR、代码审查', '完整的 GitHub 操作能力，包括仓库管理、Issue 跟踪、PR 审查。', '1.1.0', 'CowAgent', 'community', '["devops","automation","coding"]', 1, 30, 'published', 'zip', 'cowagent', NULL, NULL);

INSERT INTO skills (name, display_name, description, summary, version, author, category, tags, featured, sort_order, status, source_type, source_provider, source_url, homepage)
VALUES ('auto-coder', 'Auto Coder', '基于 GitHub 仓库的自动化编程助手', '自动分析代码仓库并生成修复补丁、新功能代码。', '0.9.0', 'octocat', 'external', '["coding","ai"]', 1, 40, 'published', 'github', 'github', 'octocat/auto-coder', 'https://github.com/octocat/auto-coder');

INSERT INTO skills (name, display_name, description, summary, version, author, category, tags, featured, sort_order, status, source_type, source_provider, source_url, homepage)
VALUES ('peekaboo', 'Peekaboo', 'ClawHub 社区最受欢迎的网页内容提取技能', '由 ClawHub 社区开发的网页内容提取和分析工具。', '2.1.0', 'ClawHub/peekaboo', 'external', '["web","data"]', 0, 50, 'published', 'registry', 'clawhub', 'peekaboo', 'https://clawhub.ai/peekaboo');
