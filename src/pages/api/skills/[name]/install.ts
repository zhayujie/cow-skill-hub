import type { APIRoute } from 'astro';
import { json, getDB } from '../../_utils';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;
  let cowVersion = null;
  try {
    const body = await request.json();
    cowVersion = body.cow_version || null;
  } catch {}

  try {
    await db.prepare('UPDATE skills SET downloads = downloads + 1 WHERE name = ?').bind(name).run();

    await db.prepare(
      'INSERT INTO install_logs (skill_name, client_ip, user_agent, cow_version) VALUES (?, ?, ?, ?)'
    ).bind(
      name,
      request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For'),
      request.headers.get('User-Agent'),
      cowVersion
    ).run();

    return json({ ok: true });
  } catch (err: any) {
    console.error('install error:', err);
    return json({ error: err.message || 'Internal Server Error' }, 500);
  }
};
