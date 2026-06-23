import type { APIRoute } from 'astro';
import { json, getDB, parseSkillRow, errorResponse } from '../_utils';

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, ch => `\\${ch}`);
}

export const GET: APIRoute = async ({ locals, url }) => {
  const db = await getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const category = url.searchParams.get('category') || 'all';
  const provider = url.searchParams.get('provider') || 'all';
  const tag = (url.searchParams.get('tag') || '').trim().slice(0, 50);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50));
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
    query += " AND tags LIKE ? ESCAPE '\\'";
    params.push(`%"${escapeLike(tag)}"%`);
  }

  if (q) {
    query += " AND (name LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')";
    const p = `%${escapeLike(q)}%`;
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
      countQuery += " AND tags LIKE ? ESCAPE '\\'";
      countParams.push(`%"${escapeLike(tag)}"%`);
    }
    if (q) {
      countQuery += " AND (name LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')";
      const p = `%${escapeLike(q)}%`;
      countParams.push(p, p, p);
    }
    const { results: countResults } = await db.prepare(countQuery).bind(...countParams).all();

    return json({
      skills: results.map(parseSkillRow),
      total: (countResults[0] as any)?.total || 0,
      page,
      limit,
    });
  } catch (err: unknown) {
    return errorResponse('list skills error:', err);
  }
};
