import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, url }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) return jsonResp({ error: 'DB not available' }, 500);

  const category = url.searchParams.get('category') || 'all';
  const tag = url.searchParams.get('tag') || '';
  const q = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM skills WHERE status = 'published'";
  const params: unknown[] = [];

  if (category === 'featured') {
    query += ' AND featured = 1';
  } else if (category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%"${tag}"%`);
  }
  if (q) {
    query += ' AND (name LIKE ? OR display_name LIKE ? OR description LIKE ?)';
    const p = `%${q}%`;
    params.push(p, p, p);
  }

  query += ' ORDER BY sort_order ASC, downloads DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await db.prepare(query).bind(...params).all();
  return jsonResp({ skills: results.map(parseRow), page });
};

function parseRow(row: Record<string, unknown>) {
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

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
