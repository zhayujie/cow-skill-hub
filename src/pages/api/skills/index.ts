import type { APIRoute } from 'astro';
import { json, getDB, parseSkillRow } from '../_utils';

export const GET: APIRoute = async ({ locals, url }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const category = url.searchParams.get('category') || 'all';
  const provider = url.searchParams.get('provider') || 'all';
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

  if (provider !== 'all') {
    query += ' AND source_provider = ?';
    params.push(provider);
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

  try {
    const { results } = await db.prepare(query).bind(...params).all();

    let countQuery = "SELECT COUNT(*) as total FROM skills WHERE status = 'published'";
    const countParams: unknown[] = [];
    if (category === 'featured') {
      countQuery += ' AND featured = 1';
    } else if (category !== 'all') {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    if (provider !== 'all') {
      countQuery += ' AND source_provider = ?';
      countParams.push(provider);
    }
    if (tag) {
      countQuery += ' AND tags LIKE ?';
      countParams.push(`%"${tag}"%`);
    }
    if (q) {
      countQuery += ' AND (name LIKE ? OR display_name LIKE ? OR description LIKE ?)';
      const p = `%${q}%`;
      countParams.push(p, p, p);
    }
    const { results: countResults } = await db.prepare(countQuery).bind(...countParams).all();

    return json({
      skills: results.map(parseSkillRow),
      total: (countResults[0] as any)?.total || 0,
      page,
      limit,
    });
  } catch (err: any) {
    console.error('list skills error:', err);
    return json({ error: err.message || 'Internal Server Error' }, 500);
  }
};
