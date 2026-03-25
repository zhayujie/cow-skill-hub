import type { APIRoute } from 'astro';
import { json, getDB, getBucket, corsHeaders } from '../../_utils';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = getDB(locals);
  const bucket = getBucket(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;

  try {
    const skill: any = await db.prepare(
      'SELECT name, version, source_type, source_url, source_path, r2_key FROM skills WHERE name = ? AND status = ?'
    ).bind(name, 'published').first();

    if (!skill) return json({ error: 'Skill not found' }, 404);

    if (skill.source_type === 'github' && skill.source_url) {
      return json({
        redirect: `https://github.com/${skill.source_url}/archive/refs/heads/main.zip`,
        source_type: 'github',
        source_url: skill.source_url,
        source_path: skill.source_path || null,
      });
    }

    if (skill.source_type === 'registry') {
      return json({
        source_type: 'registry',
        source_url: skill.source_url,
        message: 'Use the corresponding CLI to install this skill',
      });
    }

    if (!bucket) return json({ error: 'Storage not available' }, 500);

    const r2Key = skill.r2_key || `skills/${name}/${skill.version}.zip`;
    const object = await bucket.get(r2Key);
    if (!object) return json({ error: 'Package not found' }, 404);

    return new Response(object.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}-${skill.version}.zip"`,
      },
    });
  } catch (err: any) {
    console.error('download error:', err);
    return json({ error: err.message || 'Internal Server Error' }, 500);
  }
};
