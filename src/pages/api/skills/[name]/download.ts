import type { APIRoute } from 'astro';
import { json, getDB, getBucket, corsHeaders, isValidGitHubSpec, isValidSkillName, errorResponse } from '../../_utils';

const REGISTRY_PROVIDERS: Record<string, (slug: string) => string> = {
  clawhub: (slug) => {
    // source_url may be stored as "owner/name"; clawhub API expects only the name part
    const name = slug.includes('/') ? slug.split('/').pop()! : slug;
    return `https://wry-manatee-359.convex.site/api/v1/download?slug=${encodeURIComponent(name)}`;
  },
};

function resolveRegistryDownloadUrl(provider: string, slug: string | null): string | null {
  if (!slug || !provider) return null;
  const resolver = REGISTRY_PROVIDERS[provider];
  return resolver ? resolver(slug) : null;
}

export const GET: APIRoute = async ({ params, locals }) => {
  const db = getDB(locals);
  const bucket = getBucket(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;
  if (!isValidSkillName(name)) return json({ error: 'Invalid skill name' }, 400);

  try {
    const skill: any = await db.prepare(
      'SELECT name, version, source_type, source_provider, source_url, source_path, r2_key, sha256 FROM skills WHERE name = ? AND status = ?'
    ).bind(name, 'published').first();

    if (!skill) return json({ error: 'Skill not found' }, 404);

    // Count download on every successful fetch
    await db.prepare('UPDATE skills SET downloads = downloads + 1 WHERE name = ?').bind(name).run();

    if (skill.source_type === 'github' && skill.source_url) {
      if (!isValidGitHubSpec(skill.source_url)) {
        console.error(`Invalid source_url in DB for skill '${name}': ${skill.source_url}`);
        return json({ error: 'Invalid source configuration' }, 500);
      }
      return json({
        redirect: `https://github.com/${skill.source_url}/archive/refs/heads/main.zip`,
        source_type: 'github',
        source_url: skill.source_url,
        source_path: skill.source_path || null,
      });
    }

    if (skill.source_type === 'registry') {
      const downloadUrl = resolveRegistryDownloadUrl(skill.source_provider, skill.source_url);
      if (downloadUrl) {
        return json({
          source_type: 'registry',
          source_provider: skill.source_provider,
          download_url: downloadUrl,
          ...(skill.sha256 ? { sha256: skill.sha256 } : {}),
        });
      }
      return json({
        source_type: 'registry',
        source_provider: skill.source_provider,
        source_url: skill.source_url,
        message: 'Unsupported registry provider',
      }, 400);
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
        ...(skill.sha256 ? { 'X-Checksum-Sha256': skill.sha256 } : {}),
      },
    });
  } catch (err: unknown) {
    return errorResponse('download error:', err);
  }
};
