import type { APIRoute } from 'astro';
import { json, getDB, isValidSkillName, errorResponse } from '../../_utils';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = await getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;
  if (!isValidSkillName(name)) return json({ error: 'Invalid skill name' }, 400);

  try {
    const { results } = await db.prepare(
      `SELECT sf.path, sf.content, sf.size
       FROM skill_files sf
       INNER JOIN skills s ON s.name = sf.skill_name
       WHERE sf.skill_name = ? AND s.status = 'published'
       ORDER BY sf.path LIMIT 100`
    ).bind(name).all();

    return json({ files: results });
  } catch (err: unknown) {
    return errorResponse('skill files error:', err);
  }
};
