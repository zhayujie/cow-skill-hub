import type { APIRoute } from 'astro';
import { json, getDB } from '../../_utils';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;

  try {
    const { results } = await db.prepare(
      'SELECT path, content, size FROM skill_files WHERE skill_name = ? ORDER BY path'
    ).bind(name).all();

    return json({ files: results });
  } catch (err: any) {
    console.error('skill files error:', err);
    return json({ error: err.message || 'Internal Server Error' }, 500);
  }
};
