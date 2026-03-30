import type { APIContext } from 'astro';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export function getDB(locals: APIContext['locals']) {
  return (locals as any).runtime?.env?.DB ?? null;
}

export function getBucket(locals: APIContext['locals']) {
  return (locals as any).runtime?.env?.BUCKET ?? null;
}

export function parseSkillRow(row: Record<string, unknown>) {
  return {
    name: row.name,
    display_name: row.display_name,
    description: row.description,
    summary: row.summary,
    version: row.version,
    author: row.author,
    category: row.category,
    tags: safeParse(row.tags as string, []),
    featured: !!(row.featured as number),
    status: row.status,
    requires_env: safeParse(row.requires_env as string, []),
    requires_bins: safeParse(row.requires_bins as string, []),
    platforms: safeParse(row.platforms as string, ['darwin', 'linux', 'windows']),
    homepage: row.homepage,
    source_type: row.source_type,
    source_provider: row.source_provider,
    source_url: row.source_url,
    has_mirror: !!(row.r2_key),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function safeParse(s: string, fallback: unknown) {
  try { return JSON.parse(s); } catch { return fallback; }
}

const GITHUB_SPEC_RE = /^[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_.\-]+$/;

export function isValidGitHubSpec(spec: string | null | undefined): boolean {
  return typeof spec === 'string' && GITHUB_SPEC_RE.test(spec);
}

const SAFE_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_\-]{0,63}$/;

export function isValidSkillName(name: string | undefined): boolean {
  return typeof name === 'string' && SAFE_NAME_RE.test(name);
}

export function errorResponse(logLabel: string, err: unknown, status = 500) {
  console.error(logLabel, err);
  return json({ error: 'Internal Server Error' }, status);
}
