import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const bucket = (locals as any).runtime?.env?.BUCKET;
  if (!db) return jsonResp({ error: 'DB not available' }, 500);

  const { name } = params;
  const skill = await db.prepare(
    'SELECT name, version, source_type, source_url, source_path, r2_key FROM skills WHERE name = ? AND status = ?'
  ).bind(name, 'published').first();

  if (!skill) return jsonResp({ error: 'Skill not found' }, 404);

  await db.prepare('UPDATE skills SET downloads = downloads + 1 WHERE name = ?').bind(name).run();

  if (skill.source_type === 'github' && skill.source_url) {
    return jsonResp({
      redirect: `https://github.com/${skill.source_url}/archive/refs/heads/main.zip`,
      source_type: 'github',
      source_url: skill.source_url,
      source_path: skill.source_path || null,
    });
  }

  if (skill.source_type === 'registry') {
    return jsonResp({
      source_type: 'registry',
      source_url: skill.source_url,
      message: 'Use the corresponding CLI to install this skill',
    });
  }

  if (!bucket) return jsonResp({ error: 'Storage not available' }, 500);

  const r2Key = skill.r2_key || `skills/${name}/${skill.version}.zip`;
  const object = await bucket.get(r2Key);
  if (!object) return jsonResp({ error: 'Package not found' }, 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${name}-${skill.version}.zip"`,
      'Access-Control-Allow-Origin': '*',
    },
  });
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
