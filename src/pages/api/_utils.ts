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
    ...row,
    tags: safeParse(row.tags as string, []),
    requires_env: safeParse(row.requires_env as string, []),
    requires_bins: safeParse(row.requires_bins as string, []),
    platforms: safeParse(row.platforms as string, ['darwin', 'linux', 'windows']),
    featured: !!(row.featured as number),
  };
}

function safeParse(s: string, fallback: unknown) {
  try { return JSON.parse(s); } catch { return fallback; }
}
