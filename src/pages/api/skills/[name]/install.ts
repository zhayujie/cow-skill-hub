import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) return jsonResp({ error: 'DB not available' }, 500);

  const { name } = params;
  let cowVersion = null;
  try {
    const body = await request.json();
    cowVersion = body.cow_version || null;
  } catch {}

  await db.prepare('UPDATE skills SET downloads = downloads + 1 WHERE name = ?').bind(name).run();

  await db.prepare(
    'INSERT INTO install_logs (skill_name, client_ip, user_agent, cow_version) VALUES (?, ?, ?, ?)'
  ).bind(
    name,
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For'),
    request.headers.get('User-Agent'),
    cowVersion
  ).run();

  return jsonResp({ ok: true });
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
