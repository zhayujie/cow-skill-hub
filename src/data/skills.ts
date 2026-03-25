export interface SkillData {
  name: string;
  displayName: string;
  description: string;
  summary: string;
  version: string;
  author: string;
  category: 'community' | 'external';
  tags: string[];
  featured: boolean;
  downloads: number;
  requiresEnv: string[];
  requiresBins: string[];
  platforms: string[];
  homepage?: string;
  sourceType: 'zip' | 'github' | 'registry';
  sourceProvider: 'cowagent' | 'github' | 'openclaw' | 'clawhub' | 'linkai' | 'community';
  sourceUrl?: string;
  sourcePath?: string;
  skillMd: string;
  files: SkillFile[];
}

export interface SkillFile {
  path: string;
  content: string;
  size: number;
}

export const categories = [
  { id: 'all', name: '全部', nameEn: 'All' },
  { id: 'featured', name: '推荐', nameEn: 'Featured' },
  { id: 'community', name: '社区', nameEn: 'Community' },
  { id: 'external', name: '第三方', nameEn: 'External' },
] as const;

export const providers: Record<string, { label: string; color: string }> = {
  cowagent: { label: 'CowAgent', color: 'bg-primary/10 text-primary border-primary/20' },
  github:  { label: 'GitHub', color: 'bg-gray-500/10 text-gray-300 border-gray-500/20' },
  openclaw: { label: 'OpenClaw', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  clawhub: { label: 'ClawHub', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  linkai:  { label: 'LinkAI', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  community: { label: '社区', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

export const tagOptions = [
  { id: 'search', name: '搜索' },
  { id: 'web', name: '网络' },
  { id: 'coding', name: '编程' },
  { id: 'productivity', name: '效率' },
  { id: 'api', name: 'API' },
  { id: 'automation', name: '自动化' },
  { id: 'data', name: '数据' },
  { id: 'ai', name: 'AI' },
  { id: 'devops', name: 'DevOps' },
  { id: 'communication', name: '通讯' },
] as const;

export const skills: SkillData[] = [
  {
    name: 'web-search',
    displayName: 'Web Search',
    description: '通过搜索引擎获取互联网实时信息，支持 Google、Bing 等多个搜索引擎。',
    summary: '通过搜索引擎获取互联网实时信息，支持 Google、Bing 等多个搜索引擎，自动提取和总结搜索结果。可配置搜索引擎偏好和结果数量，适用于需要实时数据的对话场景。',
    version: '1.0.0',
    author: 'CowAgent',
    category: 'community',
    tags: ['search', 'web'],
    featured: true,
    downloads: 3280,
    requiresEnv: ['GOOGLE_API_KEY'],
    requiresBins: [],
    platforms: ['darwin', 'linux', 'windows'],
    homepage: 'https://github.com/zhayujie/chatgpt-on-wechat',
    sourceType: 'zip',
    sourceProvider: 'cowagent',
    skillMd: `---
name: web-search
description: Search the web using Google/Bing API and summarize results.
metadata:
  requires:
    env: [GOOGLE_API_KEY]
---

# Web Search

Search the internet for real-time information using Google or Bing search APIs.

## Usage

When the user asks about current events, recent information, or anything that requires up-to-date data, use this skill to search the web.

### Supported Search Engines

- **Google Custom Search** - Requires \`GOOGLE_API_KEY\` and \`GOOGLE_CX_ID\`
- **Bing Search** - Requires \`BING_API_KEY\`

## Setup

1. Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Set the environment variable:

\`\`\`bash
export GOOGLE_API_KEY=your_api_key_here
\`\`\`

## Examples

- "Search for the latest news about AI agents"
- "What happened in tech this week?"
- "Find the current weather in Beijing"
`,
    files: [
      { path: 'SKILL.md', content: '(see skillMd)', size: 812 },
      {
        path: 'scripts/search.py',
        content: `#!/usr/bin/env python3
"""Web search script using Google/Bing API."""

import os
import sys
import json
import urllib.request
import urllib.parse

def google_search(query: str, api_key: str, cx: str, num: int = 5):
    """Search using Google Custom Search API."""
    params = urllib.parse.urlencode({
        'key': api_key,
        'cx': cx,
        'q': query,
        'num': num,
    })
    url = f"https://www.googleapis.com/customsearch/v1?{params}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    return data.get('items', [])

def main():
    query = ' '.join(sys.argv[1:])
    if not query:
        print("Usage: search.py <query>")
        sys.exit(1)
    api_key = os.environ.get('GOOGLE_API_KEY', '')
    cx = os.environ.get('GOOGLE_CX_ID', '')
    if not api_key:
        print("Error: GOOGLE_API_KEY not set")
        sys.exit(1)
    results = google_search(query, api_key, cx)
    for item in results:
        print(f"- {item['title']}")
        print(f"  {item['link']}")
        print(f"  {item.get('snippet', '')}")
        print()

if __name__ == '__main__':
    main()
`,
        size: 940,
      },
    ],
  },
  {
    name: 'github-tool',
    displayName: 'GitHub',
    description: '通过 gh CLI 操作 GitHub 仓库，支持 Issue、PR、Release 等操作。',
    summary: '通过 gh CLI 操作 GitHub 仓库，支持创建 Issue、查看 PR、管理 Release、浏览代码等常用操作。让 Agent 成为你的 GitHub 助手。',
    version: '1.2.0',
    author: 'CowAgent',
    category: 'community',
    tags: ['coding', 'devops', 'api'],
    featured: true,
    downloads: 2150,
    requiresEnv: [],
    requiresBins: ['gh'],
    platforms: ['darwin', 'linux', 'windows'],
    homepage: 'https://cli.github.com/',
    sourceType: 'zip',
    sourceProvider: 'cowagent',
    skillMd: `---
name: github-tool
description: "GitHub operations via gh CLI: issues, PRs, releases, code browsing."
metadata:
  requires:
    bins: [gh]
  install:
    - kind: brew
      formula: gh
      bins: [gh]
      label: "Install GitHub CLI (brew)"
---

# GitHub

Interact with GitHub repositories using the \`gh\` CLI tool.

## Capabilities

- Create and manage Issues
- View and review Pull Requests
- Create Releases
- Browse repository code
- Manage GitHub Actions workflows

## Prerequisites

Install the GitHub CLI:

\`\`\`bash
brew install gh
gh auth login
\`\`\`

## Examples

- "Create an issue titled 'Bug: login fails on mobile'"
- "Show me the open PRs for this repo"
- "Create a release v1.0.0 with the latest changes"
`,
    files: [
      { path: 'SKILL.md', content: '(see skillMd)', size: 620 },
    ],
  },
  {
    name: 'code-runner',
    displayName: 'Code Runner',
    description: '在沙箱环境中安全执行代码片段，支持 Python、JavaScript、Shell。',
    summary: '在沙箱环境中安全执行代码片段，支持 Python、JavaScript、Shell 等多种语言，自动捕获输出和错误。内置超时和资源限制保护。',
    version: '1.0.0',
    author: 'CowAgent',
    category: 'community',
    tags: ['coding', 'productivity'],
    featured: true,
    downloads: 4520,
    requiresEnv: [],
    requiresBins: ['python3'],
    platforms: ['darwin', 'linux', 'windows'],
    sourceType: 'zip',
    sourceProvider: 'cowagent',
    skillMd: `---
name: code-runner
description: Execute code snippets in a sandboxed environment.
metadata:
  requires:
    anyBins: [python3, node]
---

# Code Runner

Safely execute code snippets in a sandboxed environment with output capture.

## Supported Languages

- Python 3
- JavaScript (Node.js)
- Shell (Bash)

## Features

- Automatic timeout (30s default)
- Output and error capture
- Temporary file cleanup
- Resource limits

## Usage

When the user provides code to execute or asks to run a script, use the bash tool to execute it with appropriate sandboxing.
`,
    files: [
      { path: 'SKILL.md', content: '(see skillMd)', size: 450 },
      {
        path: 'scripts/sandbox.py',
        content: `#!/usr/bin/env python3
"""Sandboxed code execution with timeout and resource limits."""

import subprocess
import sys
import tempfile
import os

def run_code(code: str, lang: str = 'python', timeout: int = 30):
    """Execute code in a subprocess with timeout."""
    with tempfile.NamedTemporaryFile(mode='w', suffix=f'.{lang}', delete=False) as f:
        f.write(code)
        f.flush()
        try:
            cmd = ['python3', f.name] if lang == 'python' else ['node', f.name]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            return {'stdout': result.stdout, 'stderr': result.stderr, 'code': result.returncode}
        except subprocess.TimeoutExpired:
            return {'stdout': '', 'stderr': 'Execution timed out', 'code': -1}
        finally:
            os.unlink(f.name)

if __name__ == '__main__':
    import json
    code = sys.stdin.read()
    result = run_code(code)
    print(json.dumps(result, indent=2))
`,
        size: 780,
      },
    ],
  },
  {
    name: 'notion-sync',
    displayName: 'Notion Sync',
    description: '与 Notion 工作空间集成，支持读取和创建页面、管理数据库。',
    summary: '与 Notion 工作空间集成，支持读取和创建页面、管理数据库、搜索内容，实现知识库的自动化管理。',
    version: '0.9.0',
    author: 'community-user',
    category: 'community',
    tags: ['productivity', 'api'],
    featured: false,
    downloads: 890,
    requiresEnv: ['NOTION_API_KEY'],
    requiresBins: [],
    platforms: ['darwin', 'linux', 'windows'],
    homepage: 'https://developers.notion.com/',
    sourceType: 'zip',
    sourceProvider: 'community',
    skillMd: `---
name: notion-sync
description: Integrate with Notion workspace for page and database management.
metadata:
  requires:
    env: [NOTION_API_KEY]
---

# Notion Sync

Read and manage your Notion workspace content.

## Setup

1. Create a Notion integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Set the API key: \`export NOTION_API_KEY=secret_xxx\`
3. Share target pages/databases with your integration

## Capabilities

- Search across workspace
- Read page content
- Create new pages
- Update database entries
`,
    files: [
      { path: 'SKILL.md', content: '(see skillMd)', size: 520 },
    ],
  },
  {
    name: 'data-analysis',
    displayName: 'Data Analysis',
    description: '数据分析助手，支持 CSV/Excel 解析、统计分析和可视化图表。',
    summary: '数据分析助手，支持 CSV/Excel 文件解析、统计分析、数据可视化图表生成，输出专业的分析报告。适用于数据探索、趋势分析和报表生成场景。',
    version: '1.1.0',
    author: 'CowAgent',
    category: 'community',
    tags: ['data', 'ai', 'productivity'],
    featured: true,
    downloads: 1670,
    requiresEnv: [],
    requiresBins: ['python3'],
    platforms: ['darwin', 'linux', 'windows'],
    sourceType: 'zip',
    sourceProvider: 'cowagent',
    skillMd: `---
name: data-analysis
description: Analyze data from CSV/Excel files with statistical analysis and visualization.
metadata:
  requires:
    bins: [python3]
  install:
    - kind: pip
      package: pandas matplotlib openpyxl
      label: "Install data analysis dependencies"
---

# Data Analysis

Powerful data analysis with CSV/Excel parsing, statistics, and chart generation.

## Features

- CSV and Excel file parsing
- Descriptive statistics
- Data visualization (bar, line, scatter, pie charts)
- Correlation analysis
- Professional report generation

## Prerequisites

\`\`\`bash
pip install pandas matplotlib openpyxl
\`\`\`
`,
    files: [
      { path: 'SKILL.md', content: '(see skillMd)', size: 580 },
      { path: 'scripts/analyze.py', content: '# Data analysis script\nimport pandas as pd\nimport matplotlib\n...', size: 2400 },
      { path: 'templates/report.md', content: '# Analysis Report\n\n## Summary\n...', size: 320 },
    ],
  },
  {
    name: 'wechat-bot-helper',
    displayName: 'WeChat Bot Helper',
    description: '微信机器人增强工具，提供群管理、定时消息和自动回复。',
    summary: '微信机器人增强工具，提供群管理、定时消息、自动回复模板、消息转发等高级功能。帮助运营者更高效地管理微信群和用户互动。',
    version: '1.0.0',
    author: 'community-user',
    category: 'community',
    tags: ['communication', 'automation'],
    featured: false,
    downloads: 2340,
    requiresEnv: [],
    requiresBins: [],
    platforms: ['darwin', 'linux', 'windows'],
    sourceType: 'zip',
    sourceProvider: 'community',
    skillMd: `---
name: wechat-bot-helper
description: Enhanced WeChat bot features including group management and scheduled messages.
---

# WeChat Bot Helper

Advanced features for WeChat bot management.

## Features

- Group management commands
- Scheduled message sending
- Auto-reply templates
- Message forwarding rules
- Keyword monitoring
`,
    files: [
      { path: 'SKILL.md', content: '(see skillMd)', size: 380 },
    ],
  },
  {
    name: 'peekaboo',
    displayName: 'Peekaboo',
    description: 'ClawHub 热门技能 - 生成有趣的 ASCII 艺术和文本动画。',
    summary: '来自 ClawHub 社区的热门技能，可以生成有趣的 ASCII 艺术和文本动画效果，为对话增添趣味性。',
    version: '2.1.0',
    author: 'clawhub-community',
    category: 'external',
    tags: ['ai', 'productivity'],
    featured: false,
    downloads: 5670,
    requiresEnv: [],
    requiresBins: [],
    platforms: ['darwin', 'linux', 'windows'],
    homepage: 'https://clawhub.com/skills/peekaboo',
    sourceType: 'registry',
    sourceProvider: 'clawhub',
    sourceUrl: 'peekaboo',
    skillMd: '',
    files: [],
  },
  {
    name: 'auto-coder',
    displayName: 'Auto Coder',
    description: 'GitHub 开源项目 - 根据需求自动生成代码并创建 PR。',
    summary: '来自 GitHub 的开源自动编码技能，能根据自然语言需求描述自动分析代码库、生成代码修改并创建 Pull Request。支持多种编程语言。',
    version: '0.8.0',
    author: 'someone',
    category: 'external',
    tags: ['coding', 'automation', 'ai'],
    featured: false,
    downloads: 1200,
    requiresEnv: [],
    requiresBins: ['git'],
    platforms: ['darwin', 'linux'],
    homepage: 'https://github.com/someone/auto-coder',
    sourceType: 'github',
    sourceProvider: 'github',
    sourceUrl: 'someone/auto-coder',
    skillMd: '',
    files: [],
  },
  {
    name: 'linkai-knowledge',
    displayName: 'LinkAI Knowledge Base',
    description: 'LinkAI 知识库接入，为 Agent 提供企业级知识问答能力。',
    summary: '通过 LinkAI 知识库接口，为 Agent 提供企业级知识问答能力。支持文档上传、向量检索和精准回答，适合客服、内部助手等场景。',
    version: '1.0.0',
    author: 'LinkAI',
    category: 'external',
    tags: ['ai', 'api', 'productivity'],
    featured: true,
    downloads: 3100,
    requiresEnv: ['LINKAI_API_KEY'],
    requiresBins: [],
    platforms: ['darwin', 'linux', 'windows'],
    homepage: 'https://link-ai.tech',
    sourceType: 'registry',
    sourceProvider: 'linkai',
    sourceUrl: 'knowledge-base',
    skillMd: '',
    files: [],
  },
];

export function getSkillByName(name: string): SkillData | undefined {
  return skills.find(s => s.name === name);
}

export function getSkillsByCategory(category: string): SkillData[] {
  if (category === 'all') return skills;
  return skills.filter(s => s.category === category);
}

export function getSkillsByProvider(provider: string): SkillData[] {
  return skills.filter(s => s.sourceProvider === provider);
}

export function searchSkills(query: string): SkillData[] {
  const q = query.toLowerCase();
  return skills.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.displayName.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  );
}

export function formatDownloads(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}
