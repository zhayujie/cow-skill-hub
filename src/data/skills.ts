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
    homepage: 'https://github.com/zhayujie/CowAgent',
    sourceType: 'zip',
    sourceProvider: 'cowagent',
    files: [
      { path: 'SKILL.md', content: '(SKILL.md content)', size: 812 },
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
    files: [
      { path: 'SKILL.md', content: '(SKILL.md content)', size: 620 },
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
    files: [
      { path: 'SKILL.md', content: '(SKILL.md content)', size: 450 },
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
    files: [
      { path: 'SKILL.md', content: '(SKILL.md content)', size: 520 },
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
    files: [
      { path: 'SKILL.md', content: '(SKILL.md content)', size: 580 },
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
    files: [
      { path: 'SKILL.md', content: '(SKILL.md content)', size: 380 },
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
    sourceUrl: 'https://github.com/someone/auto-coder',
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
    files: [],
  },
  ...generateMockSkills(),
];

function generateMockSkills(): SkillData[] {
  const templates: Array<{ name: string; display: string; desc: string; cat: SkillData['category']; tags: string[]; featured: boolean; provider: SkillData['sourceProvider']; author: string }> = [
    { name: 'pdf-reader', display: 'PDF 阅读器', desc: '解析和提取 PDF 文件内容，支持文本、表格和图片识别。', cat: 'community', tags: ['productivity', 'data'], featured: true, provider: 'cowagent', author: 'CowAgent' },
    { name: 'email-sender', display: '邮件发送', desc: '通过 SMTP 协议发送邮件，支持 HTML 模板和附件。', cat: 'community', tags: ['communication', 'automation'], featured: false, provider: 'community', author: 'mail-dev' },
    { name: 'image-gen', display: '图片生成', desc: '基于 DALL-E / Stable Diffusion 生成高质量图片。', cat: 'community', tags: ['ai', 'productivity'], featured: true, provider: 'cowagent', author: 'CowAgent' },
    { name: 'sql-helper', display: 'SQL 助手', desc: '自然语言转 SQL，支持 MySQL、PostgreSQL、SQLite。', cat: 'community', tags: ['data', 'coding'], featured: false, provider: 'community', author: 'db-fans' },
    { name: 'translation', display: '多语言翻译', desc: '支持 100+ 种语言互译，基于大模型的高质量翻译。', cat: 'community', tags: ['ai', 'productivity'], featured: true, provider: 'cowagent', author: 'CowAgent' },
    { name: 'calendar-sync', display: '日历同步', desc: '同步 Google Calendar / Outlook 日程，智能提醒。', cat: 'community', tags: ['productivity', 'api'], featured: false, provider: 'community', author: 'cal-user' },
    { name: 'stock-tracker', display: '股票行情', desc: '实时查询 A股、港股、美股行情与K线数据。', cat: 'external', tags: ['data', 'api'], featured: false, provider: 'clawhub', author: 'fin-dev' },
    { name: 'weather-query', display: '天气查询', desc: '全球天气预报查询，支持未来7天预报和空气质量。', cat: 'community', tags: ['api', 'search'], featured: false, provider: 'community', author: 'weather-fan' },
    { name: 'markdown-editor', display: 'Markdown 编辑', desc: '增强 Markdown 编辑能力，支持 Mermaid 图表和数学公式。', cat: 'community', tags: ['coding', 'productivity'], featured: false, provider: 'cowagent', author: 'CowAgent' },
    { name: 'docker-manager', display: 'Docker 管理', desc: '通过自然语言管理 Docker 容器、镜像和网络。', cat: 'community', tags: ['devops', 'automation'], featured: true, provider: 'cowagent', author: 'CowAgent' },
    { name: 'jira-connector', display: 'Jira 连接器', desc: '连接 Jira 项目管理，创建和更新 Issue、Sprint。', cat: 'external', tags: ['productivity', 'api'], featured: false, provider: 'github', author: 'pm-tools' },
    { name: 'slack-bot', display: 'Slack 机器人', desc: '在 Slack 频道中收发消息、管理工作流。', cat: 'external', tags: ['communication', 'automation'], featured: false, provider: 'github', author: 'slack-dev' },
    { name: 'redis-tool', display: 'Redis 工具', desc: '可视化操作 Redis，支持键值查看、TTL管理和发布订阅。', cat: 'community', tags: ['devops', 'data'], featured: false, provider: 'community', author: 'cache-master' },
    { name: 'api-tester', display: 'API 测试', desc: '快速测试 REST/GraphQL API，生成测试报告和文档。', cat: 'community', tags: ['coding', 'api'], featured: true, provider: 'cowagent', author: 'CowAgent' },
    { name: 'file-converter', display: '文件格式转换', desc: '支持 Word/Excel/PPT/图片 等 50+ 种格式互转。', cat: 'community', tags: ['productivity'], featured: false, provider: 'community', author: 'convert-pro' },
    { name: 'youtube-dl', display: 'YouTube 下载', desc: '下载 YouTube 视频和字幕，支持多种格式和分辨率。', cat: 'external', tags: ['web', 'automation'], featured: false, provider: 'clawhub', author: 'media-dev' },
    { name: 'text-to-speech', display: '文本转语音', desc: '将文本转换为自然语音，支持中英日韩多语种。', cat: 'community', tags: ['ai', 'communication'], featured: false, provider: 'community', author: 'tts-lab' },
    { name: 'ocr-reader', display: 'OCR 文字识别', desc: '从图片中提取文字，支持多语言和手写体识别。', cat: 'community', tags: ['ai', 'data'], featured: true, provider: 'cowagent', author: 'CowAgent' },
    { name: 'git-helper', display: 'Git 助手', desc: '简化 Git 操作，自动生成 commit message 和 changelog。', cat: 'community', tags: ['coding', 'devops'], featured: false, provider: 'cowagent', author: 'CowAgent' },
    { name: 'k8s-manager', display: 'K8s 管理', desc: '通过自然语言管理 Kubernetes 集群、Pod 和服务。', cat: 'community', tags: ['devops', 'automation'], featured: false, provider: 'community', author: 'cloud-ops' },
    { name: 'rss-reader', display: 'RSS 阅读器', desc: '订阅和聚合 RSS 源，智能摘要和分类推送。', cat: 'community', tags: ['web', 'productivity'], featured: false, provider: 'community', author: 'feed-lover' },
    { name: 'password-gen', display: '密码生成器', desc: '生成安全密码，支持自定义规则和强度检测。', cat: 'community', tags: ['productivity', 'automation'], featured: false, provider: 'community', author: 'sec-helper' },
    { name: 'qr-code', display: '二维码工具', desc: '生成和识别二维码，支持自定义样式和Logo嵌入。', cat: 'community', tags: ['productivity'], featured: false, provider: 'community', author: 'qr-maker' },
    { name: 'json-formatter', display: 'JSON 格式化', desc: 'JSON 美化、压缩、校验和 Schema 生成工具。', cat: 'community', tags: ['coding', 'productivity'], featured: false, provider: 'cowagent', author: 'CowAgent' },
    { name: 'regex-helper', display: '正则助手', desc: '自然语言描述正则需求，自动生成和测试正则表达式。', cat: 'community', tags: ['coding', 'ai'], featured: false, provider: 'community', author: 'regex-fan' },
    { name: 'cron-scheduler', display: '定时任务', desc: '可视化配置 Cron 表达式，管理定时任务执行。', cat: 'community', tags: ['devops', 'automation'], featured: false, provider: 'community', author: 'timer-dev' },
    { name: 'airtable-sync', display: 'Airtable 同步', desc: '双向同步 Airtable 数据，支持自动化工作流。', cat: 'external', tags: ['productivity', 'api'], featured: false, provider: 'github', author: 'table-sync' },
    { name: 'figma-export', display: 'Figma 导出', desc: '从 Figma 设计稿导出切图、样式和组件代码。', cat: 'external', tags: ['coding', 'productivity'], featured: false, provider: 'github', author: 'design-dev' },
    { name: 'aws-helper', display: 'AWS 助手', desc: '管理 AWS 云资源，支持 EC2、S3、Lambda 等服务。', cat: 'community', tags: ['devops', 'api'], featured: false, provider: 'community', author: 'aws-user' },
    { name: 'mindmap-gen', display: '思维导图生成', desc: '从文本自动生成思维导图，支持多种导出格式。', cat: 'community', tags: ['productivity', 'ai'], featured: false, provider: 'community', author: 'mind-creator' },
    { name: 'unit-converter', display: '单位换算', desc: '长度、重量、温度、货币等各类单位智能换算。', cat: 'community', tags: ['productivity'], featured: false, provider: 'community', author: 'unit-calc' },
    { name: 'podcast-parser', display: '播客解析', desc: '解析播客音频内容，自动生成文字稿和摘要。', cat: 'external', tags: ['ai', 'data'], featured: false, provider: 'clawhub', author: 'podcast-ai' },
    { name: 'css-generator', display: 'CSS 生成器', desc: '通过描述生成 CSS 样式，支持动画、渐变和布局。', cat: 'community', tags: ['coding', 'ai'], featured: false, provider: 'community', author: 'style-gen' },
    { name: 'log-analyzer', display: '日志分析', desc: '智能分析服务器日志，定位异常和性能瓶颈。', cat: 'community', tags: ['devops', 'data'], featured: false, provider: 'cowagent', author: 'CowAgent' },
    { name: 'feishu-bot', display: '飞书机器人', desc: '飞书群机器人消息推送和交互式卡片。', cat: 'community', tags: ['communication', 'api'], featured: false, provider: 'community', author: 'lark-fan' },
    { name: 'dingtalk-bot', display: '钉钉机器人', desc: '钉钉群聊机器人，支持富文本消息和交互卡片。', cat: 'community', tags: ['communication', 'api'], featured: false, provider: 'community', author: 'ding-dev' },
    { name: 'ci-reporter', display: 'CI 报告', desc: '聚合 GitHub Actions / GitLab CI 构建结果并推送通知。', cat: 'external', tags: ['devops', 'automation'], featured: false, provider: 'github', author: 'ci-master' },
    { name: 'sentry-monitor', display: 'Sentry 监控', desc: '实时监控 Sentry 异常告警，智能分类和建议修复。', cat: 'external', tags: ['devops', 'api'], featured: false, provider: 'github', author: 'monitor-pro' },
    { name: 'chart-builder', display: '图表构建', desc: '通过自然语言描述生成 ECharts / Chart.js 图表。', cat: 'community', tags: ['data', 'ai'], featured: true, provider: 'cowagent', author: 'CowAgent' },
    { name: 'resume-builder', display: '简历生成', desc: '基于模板快速生成专业简历，支持多种格式导出。', cat: 'external', tags: ['productivity', 'ai'], featured: false, provider: 'clawhub', author: 'resume-ai' },
    { name: 'ip-lookup', display: 'IP 查询', desc: '查询 IP 地址归属地、运营商和地理位置信息。', cat: 'community', tags: ['search', 'api'], featured: false, provider: 'community', author: 'net-tools' },
    { name: 'dns-checker', display: 'DNS 检测', desc: '批量检测域名 DNS 解析，支持多节点全球探测。', cat: 'community', tags: ['devops', 'web'], featured: false, provider: 'community', author: 'dns-admin' },
    { name: 'screenshot-tool', display: '网页截图', desc: '对网页进行全页面或区域截图，支持移动端模拟。', cat: 'community', tags: ['web', 'automation'], featured: false, provider: 'cowagent', author: 'CowAgent' },
    { name: 'db-migration', display: '数据库迁移', desc: '自动生成和执行数据库迁移脚本，支持多数据库。', cat: 'community', tags: ['coding', 'devops'], featured: false, provider: 'community', author: 'migrate-pro' },
    { name: 'sitemap-gen', display: 'Sitemap 生成', desc: '自动爬取站点生成 sitemap.xml，助力 SEO 优化。', cat: 'community', tags: ['web', 'automation'], featured: false, provider: 'community', author: 'seo-helper' },
    { name: 'clipboard-sync', display: '剪贴板同步', desc: '跨设备剪贴板同步，支持文本、图片和文件。', cat: 'community', tags: ['productivity', 'automation'], featured: false, provider: 'community', author: 'clip-sync' },
    { name: 'news-digest', display: '新闻摘要', desc: '聚合多源新闻并生成 AI 摘要，支持关键词订阅。', cat: 'external', tags: ['search', 'ai'], featured: false, provider: 'linkai', author: 'news-ai' },
    { name: 'code-review', display: '代码审查', desc: 'AI 辅助代码审查，检测潜在 Bug 和安全漏洞。', cat: 'community', tags: ['coding', 'ai'], featured: true, provider: 'cowagent', author: 'CowAgent' },
    { name: 'terraform-helper', display: 'Terraform 助手', desc: '自然语言生成 Terraform 配置，管理云基础设施。', cat: 'community', tags: ['devops', 'automation'], featured: false, provider: 'community', author: 'iac-dev' },
    { name: 'webhook-relay', display: 'Webhook 转发', desc: '接收和转发 Webhook 事件，支持过滤和转换。', cat: 'community', tags: ['api', 'automation'], featured: false, provider: 'community', author: 'hook-master' },
    { name: 'color-palette', display: '配色方案', desc: '基于 AI 生成和谐配色方案，支持品牌色提取。', cat: 'community', tags: ['ai', 'productivity'], featured: false, provider: 'community', author: 'color-gen' },
  ];

  return templates.map((t, i) => ({
    name: t.name,
    displayName: t.display,
    description: t.desc,
    summary: t.desc,
    version: ['1.0.0', '1.1.0', '0.9.0', '2.0.0', '1.2.0'][i % 5],
    author: t.author,
    category: t.cat,
    tags: t.tags,
    featured: t.featured,
    downloads: 100 + i * 73,
    requiresEnv: [],
    requiresBins: [],
    platforms: ['darwin', 'linux', 'windows'],
    sourceType: t.provider === 'clawhub' || t.provider === 'linkai' ? 'registry' as const : t.provider === 'github' ? 'github' as const : 'zip' as const,
    sourceProvider: t.provider,
    files: [],
  }));
}

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
