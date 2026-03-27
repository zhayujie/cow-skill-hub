import type { APIRoute } from 'astro';
import { json, getDB, isValidSkillName, errorResponse } from '../../_utils';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;
  if (!isValidSkillName(name)) return json({ error: 'Invalid skill name' }, 400);

  try {
    const { results } = await db.prepare(
      'SELECT path, content, size FROM skill_files WHERE skill_name = ? ORDER BY path LIMIT 100'
    ).bind(name).all();

    return json({ files: results });
  } catch (err: unknown) {
    return errorResponse('skill files error:', err);
  }
};
