import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) return jsonResp({ error: 'DB not available' }, 500);

  const { results } = await db.prepare(
    'SELECT id, name, sort_order FROM tag_definitions ORDER BY sort_order ASC'
  ).all();

  return jsonResp({ tags: results });
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
