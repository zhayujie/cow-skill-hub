import type { APIRoute } from 'astro';
import { json, getDB, errorResponse } from './_utils';

export const GET: APIRoute = async ({ locals }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  try {
    const { results } = await db.prepare(
      'SELECT id, name, sort_order FROM tag_definitions ORDER BY sort_order ASC'
    ).all();
    return json({ tags: results });
  } catch (err: unknown) {
    return errorResponse('tags error:', err);
  }
};
