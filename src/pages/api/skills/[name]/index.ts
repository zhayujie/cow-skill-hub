import type { APIRoute } from 'astro';
import { json, getDB, parseSkillRow } from '../../_utils';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;

  try {
    const skill = await db.prepare(
      'SELECT * FROM skills WHERE name = ? AND status = ?'
    ).bind(name, 'published').first();

    if (!skill) return json({ error: 'Skill not found' }, 404);

    await db.prepare(
      'UPDATE skills SET views = views + 1 WHERE name = ?'
    ).bind(name).run();

    return json({ skill: parseSkillRow(skill) });
  } catch (err: any) {
    console.error('skill detail error:', err);
    return json({ error: err.message || 'Internal Server Error' }, 500);
  }
};
