import type { APIRoute } from 'astro';
import { json, getDB, parseSkillRow, errorResponse } from '../_utils';

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, ch => `\\${ch}`);
}

export const GET: APIRoute = async ({ locals, url }) => {
  const db = await getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  if (!q) return json({ skills: [], total: 0, page: 1, limit: 10 });

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50));
  const offset = (page - 1) * limit;

  try {
    const pattern = `%${escapeLike(q)}%`;
    const whereClause = `WHERE status = 'published'
         AND (name LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\')`;

    const { results } = await db.prepare(
      `SELECT * FROM skills ${whereClause}
       ORDER BY downloads DESC
       LIMIT ? OFFSET ?`
    ).bind(pattern, pattern, pattern, pattern, pattern, limit, offset).all();

    const { results: countResults } = await db.prepare(
      `SELECT COUNT(*) as total FROM skills ${whereClause}`
    ).bind(pattern, pattern, pattern, pattern, pattern).all();

    return json({
      skills: results.map(parseSkillRow),
      total: (countResults[0] as any)?.total || 0,
      page,
      limit,
    });
  } catch (err: unknown) {
    return errorResponse('search error:', err);
  }
};
