/**
 * Path-based i18n.
 *
 * The default language lives at unprefixed URLs ("/", "/<skill>"); other
 * languages live under a prefix ("/en/", "/en/<skill>"). The middleware
 * rewrites prefixed requests onto the same page routes and exposes the
 * resolved language as `Astro.locals.lang`.
 */

export type Lang = 'zh' | 'en';

export const DEFAULT_LANG: Lang = 'zh';
export const PREFIXED_LANGS: readonly Lang[] = ['en'];
export const LANG_COOKIE = 'cow_lang';

export const HREFLANG: Record<Lang, string> = { zh: 'zh-CN', en: 'en' };
export const OG_LOCALE: Record<Lang, string> = { zh: 'zh_CN', en: 'en_US' };

export function isLang(v: unknown): v is Lang {
  return v === 'zh' || v === 'en';
}

/** Map a language-neutral path ("/", "/pptx") to its URL in `lang`. */
export function localizePath(path: string, lang: Lang): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return p;
  return p === '/' ? `/${lang}/` : `/${lang}${p}`;
}

/** Split a request path into its language prefix and the language-neutral rest. */
export function splitLangPrefix(pathname: string): { lang: Lang; path: string } {
  for (const lang of PREFIXED_LANGS) {
    if (pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)) {
      return { lang, path: pathname.slice(lang.length + 1) || '/' };
    }
  }
  return { lang: DEFAULT_LANG, path: pathname };
}

/** Canonical form of a language-neutral path: no trailing slash except root. */
export function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
}

// Known tag ids get a proper English label; unknown ids fall back to the id.
const TAG_NAMES_EN: Record<string, string> = {
  office: 'Productivity',
  productivity: 'Productivity',
  coding: 'Coding',
  data: 'Data',
  content: 'Content Creation',
  search: 'Search',
  web: 'Web',
  api: 'API',
  automation: 'Automation',
  ai: 'AI',
  devops: 'DevOps',
  communication: 'Communication',
};

export function tagLabel(id: string, name: string | undefined, lang: Lang): string {
  if (lang === 'zh') return name || id;
  if (TAG_NAMES_EN[id]) return TAG_NAMES_EN[id];
  return id.charAt(0).toUpperCase() + id.slice(1);
}

const messages = {
  zh: {
    langSwitchLabel: 'English',
    langSwitchShort: 'EN',
    navSubmit: '提交技能',
    navDocs: '文档',
    repoLabel: (brand: string) => `${brand} 源码仓库`,
    accountMenu: '账号菜单',
    login: '登录',
    logout: '退出登录',
    footerDocs: '文档',
    copyright: (owner: string) => `© 2026 ${owner}. Open source under MIT License.`,

    homeTitleSuffix: 'AI Agent 技能市场',
    defaultDescription: (agent: string) =>
      `浏览、搜索并一键安装 ${agent} 技能：官方推荐、社区贡献及 GitHub、ClawHub 等第三方 Skills，覆盖办公效率、编程开发、数据分析、内容创作与搜索研究，一行命令即可为 AI Agent 扩展新能力。`,
    heroTitle: '发现和安装技能',
    heroSubtitle: '浏览官方推荐和社区贡献的 Skills，一行命令即可为你的 Agent 扩展新能力',
    searchPlaceholder: '搜索技能名称、描述或标签...',
    copy: '复制',
    copied: '已复制!',
    copiedShort: '已复制',
    installTooltip: (agent: string) => `终端输入或发送给 ${agent} 一键安装`,
    tagsLabel: '标签',
    loadMore: '加载更多',
    skillCount: (shown: number | string, total: number | string) => `已显示 ${shown} / ${total} 个技能`,
    noMatch: '未找到匹配的技能',

    featured: '推荐',
    categoryCommunity: '社区',
    categoryExternal: '第三方',
    categoryExternalShort: '三方',
    breadcrumbRoot: '技能',
    installCommand: '安装命令',
    viewOn: (provider: string) => `前往 ${provider} 查看`,
    viewOnSource: '前往源平台查看',
    viewDetailsOn: (provider: string) => `前往 ${provider} 查看详情`,
    viewDetailsOnSource: '前往源平台查看详情',
    requiresEnv: '需要环境变量',
    requiresBins: '需要工具',
    tabOverview: '概述',
    tabFiles: '文件',
    externalNoContent: (agent: string) => `此技能由第三方平台提供，${agent} 可通过 CLI 直接安装使用。`,
    noContent: '暂无技能详情内容。',

    notFoundTitle: '页面不存在',
    notFoundText: '你访问的技能或页面不存在，可能已被移除或改名。',
    backHome: '返回技能列表',

    submitTitle: '提交技能',
    submitDescription: (agent: string) => `提交技能到 ${agent} 技能社区`,
    submitHeading: '提交技能到社区',
    submitIntroBefore: '上传包含',
    submitIntroAfter: '的文件夹或 zip，安全检查及审核通过后会公开发布。',
    errOauthState: '登录验证失败，请重试',
    errOauthToken: '无法完成授权，请重试',
    errOauthUser: '无法读取账号信息',
    errLogin: '登录出错',
    loginRequired: '请先登录后再提交技能',
    loginGithub: '使用 GitHub 登录',
    loginGoogle: '使用 Google 登录',
    currentAuthor: '当前作者',
    dropHint: '拖拽 zip 或文件夹到此处，或点击下方选择',
    maxSize: '最大 5 MB',
    chooseZip: '选择 zip',
    chooseFolder: '选择文件夹',
    parsing: '正在解析文件…',
    fieldSlug: '唯一标识',
    fieldDisplayName: '显示名称',
    fieldDescription: '简短描述',
    fieldTags: '标签（可选）',
    fieldFiles: '将包含的文件',
    submitButton: '提交技能',
    successTitle: '感谢你的贡献！',
    successText: '技能已提交成功。我们会对其进行安全检测和审核，通过后将在技能广场中公开展示。',
    ok: '好的',
  },
  en: {
    langSwitchLabel: '中文',
    langSwitchShort: '中文',
    navSubmit: 'Submit',
    navDocs: 'Docs',
    repoLabel: (brand: string) => `${brand} source code`,
    accountMenu: 'Account menu',
    login: 'Log in',
    logout: 'Log out',
    footerDocs: 'Docs',
    copyright: (owner: string) => `© 2026 ${owner}. Open source under MIT License.`,

    homeTitleSuffix: 'AI Agent Skills Marketplace',
    defaultDescription: (agent: string) =>
      `Browse, search and install ${agent} skills in one command: official picks, community contributions and third-party skills from GitHub and ClawHub for productivity, coding, data analysis, content creation and research.`,
    heroTitle: 'Discover and Install Skills',
    heroSubtitle: 'Browse official and community skills, and extend your agent with a single command',
    searchPlaceholder: 'Search skills by name, description or tag...',
    copy: 'Copy',
    copied: 'Copied!',
    copiedShort: 'Copied',
    installTooltip: (agent: string) => `Run in a terminal or send to ${agent} to install`,
    tagsLabel: 'Tags',
    loadMore: 'Load more',
    skillCount: (shown: number | string, total: number | string) => `Showing ${shown} of ${total} skills`,
    noMatch: 'No matching skills found',

    featured: 'Featured',
    categoryCommunity: 'Community',
    categoryExternal: 'Third-party',
    categoryExternalShort: 'Third-party',
    breadcrumbRoot: 'Skills',
    installCommand: 'Install command',
    viewOn: (provider: string) => `View on ${provider}`,
    viewOnSource: 'View on source platform',
    viewDetailsOn: (provider: string) => `View details on ${provider}`,
    viewDetailsOnSource: 'View details on source platform',
    requiresEnv: 'Required environment variables',
    requiresBins: 'Required tools',
    tabOverview: 'Overview',
    tabFiles: 'Files',
    externalNoContent: (agent: string) =>
      `This skill is provided by a third-party platform and can be installed in ${agent} via the CLI.`,
    noContent: 'No details available for this skill yet.',

    notFoundTitle: 'Page Not Found',
    notFoundText: 'The skill or page you are looking for does not exist. It may have been removed or renamed.',
    backHome: 'Back to all skills',

    submitTitle: 'Submit a Skill',
    submitDescription: (agent: string) => `Submit a skill to the ${agent} skill community`,
    submitHeading: 'Submit a Skill to the Community',
    submitIntroBefore: 'Upload a folder or zip that contains',
    submitIntroAfter: '. It will be published after safety checks and review.',
    errOauthState: 'Login verification failed, please try again',
    errOauthToken: 'Authorization could not be completed, please try again',
    errOauthUser: 'Unable to read account information',
    errLogin: 'Login error',
    loginRequired: 'Please log in before submitting a skill',
    loginGithub: 'Log in with GitHub',
    loginGoogle: 'Log in with Google',
    currentAuthor: 'Author',
    dropHint: 'Drag a zip or folder here, or choose one below',
    maxSize: 'Up to 5 MB',
    chooseZip: 'Choose zip',
    chooseFolder: 'Choose folder',
    parsing: 'Parsing files…',
    fieldSlug: 'Unique ID',
    fieldDisplayName: 'Display name',
    fieldDescription: 'Short description',
    fieldTags: 'Tags (optional)',
    fieldFiles: 'Files to include',
    submitButton: 'Submit skill',
    successTitle: 'Thanks for your contribution!',
    successText:
      'Your skill has been submitted. It will be listed publicly once it passes safety checks and review.',
    ok: 'OK',
  },
} satisfies Record<Lang, Record<string, unknown>>;

export type Messages = (typeof messages)['zh'];

export function t(lang: Lang): Messages {
  return messages[lang];
}
