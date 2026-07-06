import type { APIRoute } from 'astro';
import { json, getDB, isValidSkillName, errorResponse } from '../../_utils';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const db = await getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;
  if (!isValidSkillName(name)) return json({ error: 'Invalid skill name' }, 400);

  let cowVersion: string | null = null;
  try {
    const body = await request.json();
    cowVersion = typeof body.cow_version === 'string' ? body.cow_version.slice(0, 64) : null;
  } catch {}

  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 256) || null;

  try {
    await db.prepare(
      'INSERT INTO install_logs (skill_name, user_agent, cow_version) VALUES (?, ?, ?)'
    ).bind(name, userAgent, cowVersion).run();

    return json({ ok: true });
  } catch (err: unknown) {
    return errorResponse('install error:', err);
  }
};
