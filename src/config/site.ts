/**
 * Site branding & feature configuration.
 *
 * A single source of truth for all brand-facing strings, links and feature
 * toggles, so the same codebase serves both the public CowAgent deployment and
 * neutral-branded private deployments.
 *
 * Everything is overridable via environment variables. When nothing is set the
 * defaults reproduce the original public CowAgent branding, so the `main`
 * branch / Cloudflare deployment keeps its current look untouched.
 *
 * Private/self-hosted deployments typically set (e.g. in docker-compose):
 *   SITE_BRAND_NAME="Agent Skill Hub"
 *   SITE_SHOW_LOGIN=false
 *   SITE_SHOW_BRAND_LINKS=false
 *   SITE_GITHUB_URL=""        # empty hides the GitHub source link
 *   SITE_DOCS_URL=""          # empty hides the docs link
 */
import type { APIContext } from 'astro';

export interface SiteConfig {
  /** Brand name shown in nav, footer and <title>, e.g. "CowAgent Skill Hub". */
  brandName: string;
  /** Short name shown next to the logo in the nav, e.g. "Skill Hub". */
  shortName: string;
  /** Agent product name used in body copy ("发送给 X 一键安装"), e.g. "CowAgent". */
  agentName: string;
  /** Default meta description. */
  description: string;
  /** Logo path under /public; empty hides the logo image. */
  logoUrl: string;
  /** CLI binary name used in install commands, e.g. "cow" -> "cow skill install". */
  cliName: string;
  /** Default author label for skills that have none, e.g. "CowAgent". */
  defaultAuthor: string;
  /** Footer copyright owner, e.g. "CowAgent". Empty hides the copyright line. */
  copyrightOwner: string;
  /** Marketing/home site link; empty hides it. */
  brandUrl: string;
  /** Docs link; empty hides it. */
  docsUrl: string;
  /** Source repo link; empty hides it. */
  githubUrl: string;
  /** Whether to show external brand links (home/docs) in nav & footer. */
  showBrandLinks: boolean;
  /** Whether to show the login entry (OAuth). Off for anonymous self-hosting. */
  showLogin: boolean;
}

function readEnv(locals: APIContext['locals'] | undefined, key: string): string | undefined {
  const fromCfEnv = (locals as any)?.runtime?.env?.[key];
  const fromProcess =
    typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  const value = fromCfEnv ?? fromProcess;
  return value == null ? undefined : value.toString();
}

function readBool(
  locals: APIContext['locals'] | undefined,
  key: string,
  fallback: boolean,
): boolean {
  const raw = readEnv(locals, key);
  if (raw == null || raw === '') return fallback;
  return /^(1|true|yes|on)$/i.test(raw.trim());
}

/**
 * Resolve site config for the current request. Reads env on every call so a
 * single build can serve different brands depending on runtime environment.
 */
export function getSiteConfig(locals?: APIContext['locals']): SiteConfig {
  // When DEPLOY_TARGET=node (self-hosted), default brand links/login OFF so a
  // private instance is neutral out of the box; still overridable per-var.
  const isNode = (readEnv(locals, 'DEPLOY_TARGET') || '').toLowerCase() === 'node';

  const brandName = readEnv(locals, 'SITE_BRAND_NAME') || 'CowAgent Skill Hub';
  const shortName = readEnv(locals, 'SITE_SHORT_NAME') || 'Skill Hub';
  const cliName = readEnv(locals, 'SITE_CLI_NAME') || 'cow';
  // Agent product name in body copy. Public default keeps "CowAgent"; private
  // deployments fall back to the (neutral) short name unless overridden.
  const agentName =
    readEnv(locals, 'SITE_AGENT_NAME') || (isNode ? shortName : 'CowAgent');

  return {
    brandName,
    shortName,
    agentName,
    description:
      readEnv(locals, 'SITE_DESCRIPTION') ||
      (isNode
        ? 'Browse, search, and install skills'
        : 'Browse, search, and install skills for CowAgent'),
    logoUrl: readEnv(locals, 'SITE_LOGO_URL') ?? '/logo/cow-logo.png',
    cliName,
    defaultAuthor: readEnv(locals, 'SITE_DEFAULT_AUTHOR') || (isNode ? 'Community' : 'CowAgent'),
    copyrightOwner: readEnv(locals, 'SITE_COPYRIGHT_OWNER') ?? (isNode ? '' : 'CowAgent'),
    brandUrl: readEnv(locals, 'SITE_BRAND_URL') ?? (isNode ? '' : 'https://cowagent.ai'),
    docsUrl:
      readEnv(locals, 'SITE_DOCS_URL') ?? (isNode ? '' : 'https://docs.cowagent.ai/skills/hub'),
    githubUrl:
      readEnv(locals, 'SITE_GITHUB_URL') ??
      (isNode ? '' : 'https://github.com/zhayujie/cow-skill-hub'),
    // Brand links / login default ON for public (Cloudflare), OFF for self-hosted.
    showBrandLinks: readBool(locals, 'SITE_SHOW_BRAND_LINKS', !isNode),
    showLogin: readBool(locals, 'SITE_SHOW_LOGIN', !isNode),
  };
}
