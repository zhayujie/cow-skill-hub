import type { APIRoute } from 'astro';
import { json, getDB, parseSkillRow } from '../_utils';

export const GET: APIRoute = async ({ locals, url }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const q = url.searchParams.get('q') || '';
  if (!q) return json({ skills: [] });

  try {
    const pattern = `%${q}%`;
    const { results } = await db.prepare(
      `SELECT * FROM skills
       WHERE status = 'published'
         AND (name LIKE ? OR display_name LIKE ? OR description LIKE ? OR summary LIKE ? OR tags LIKE ?)
       ORDER BY downloads DESC
       LIMIT 20`
    ).bind(pattern, pattern, pattern, pattern, pattern).all();

    return json({ skills: results.map(parseSkillRow) });
  } catch (err: any) {
    console.error('search error:', err);
    return json({ error: err.message || 'Internal Server Error' }, 500);
  }
};
