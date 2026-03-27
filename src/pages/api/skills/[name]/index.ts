import type { APIRoute } from 'astro';
import { json, getDB, parseSkillRow, isValidSkillName, errorResponse } from '../../_utils';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;
  if (!isValidSkillName(name)) return json({ error: 'Invalid skill name' }, 400);

  try {
    const skill = await db.prepare(
      'SELECT * FROM skills WHERE name = ? AND status = ?'
    ).bind(name, 'published').first();

    if (!skill) return json({ error: 'Skill not found' }, 404);

    await db.prepare(
      'UPDATE skills SET views = views + 1 WHERE name = ?'
    ).bind(name).run();

    return json({ skill: parseSkillRow(skill) });
  } catch (err: unknown) {
    return errorResponse('skill detail error:', err);
  }
};
