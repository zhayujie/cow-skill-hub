import type { APIRoute } from 'astro';
import { json, getDB, getBucket, corsHeaders, isValidSkillName, errorResponse } from '../../_utils';

const REGISTRY_PROVIDERS: Record<string, (slug: string) => string> = {
  clawhub: (slug) => {
    const name = slug.includes('/') ? slug.split('/').pop()! : slug;
    return `https://wry-manatee-359.convex.site/api/v1/download?slug=${encodeURIComponent(name)}`;
  },
  linkai: (slug) => `https://api.link-ai.tech/v1/skill/download?slug=${encodeURIComponent(slug)}`,
};

function resolveRegistryDownloadUrl(provider: string, slug: string | null): string | null {
  if (!slug || !provider) return null;
  const resolver = REGISTRY_PROVIDERS[provider];
  return resolver ? resolver(slug) : null;
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const db = getDB(locals);
  const bucket = getBucket(locals);
  if (!db) return json({ error: 'DB not available' }, 500);

  const { name } = params;
  if (!isValidSkillName(name)) return json({ error: 'Invalid skill name' }, 400);

  let provider: string | null = null;
  let useMirror = false;
  try {
    const body = await request.json();
    provider = typeof body.provider === 'string' ? body.provider : null;
    useMirror = body.mirror === true;
  } catch {}

  try {
    const skill: any = await db.prepare(
      'SELECT name, display_name, version, source_type, source_provider, source_url, source_path, r2_key, sha256 FROM skills WHERE name = ? AND status = ?'
    ).bind(name, 'published').first();

    if (skill) {
      await db.prepare('UPDATE skills SET downloads = downloads + 1 WHERE name = ?').bind(name).run();

      if (skill.source_type === 'github' && skill.source_url) {
        const hasMirror = !!(skill.r2_key && bucket);

        // Client requested mirror download (GitHub fallback)
        if (useMirror && hasMirror) {
          const r2Key = skill.r2_key || `skills/${name}.zip`;
          let object = await bucket!.get(r2Key);
          if (!object && !skill.r2_key) {
            object = await bucket!.get(`skills/${name}/${skill.version}.zip`);
          }
          if (object) {
            return new Response(object.body, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${name}-${skill.version}.zip"`,
                ...(skill.sha256 ? { 'X-Checksum-Sha256': skill.sha256 } : {}),
              },
            });
          }
        }

        return json({
          source_type: 'github',
          source_url: skill.source_url,
          has_mirror: hasMirror,
          display_name: skill.display_name || '',
        });
      }

      if (skill.source_type === 'registry') {
        const hasMirror = !!(skill.r2_key && bucket);

        if (useMirror && hasMirror) {
          const r2Key = skill.r2_key || `skills/${name}.zip`;
          let object = await bucket!.get(r2Key);
          if (!object && !skill.r2_key) {
            object = await bucket!.get(`skills/${name}/${skill.version}.zip`);
          }
          if (object) {
            return new Response(object.body, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${name}-${skill.version}.zip"`,
                ...(skill.sha256 ? { 'X-Checksum-Sha256': skill.sha256 } : {}),
              },
            });
          }
        }

        // source_url is a direct zip URL — use it as download link
        const directUrl = (skill.source_url?.startsWith('https://') && skill.source_url?.endsWith('.zip')) ? skill.source_url : null;
        const downloadUrl = directUrl || resolveRegistryDownloadUrl(skill.source_provider, skill.source_url);
        if (downloadUrl) {
          return json({
            source_type: 'registry',
            source_provider: skill.source_provider,
            download_url: downloadUrl,
            has_mirror: hasMirror,
            display_name: skill.display_name || '',
            ...(skill.sha256 ? { sha256: skill.sha256 } : {}),
          });
        }
        return json({
          source_type: 'registry',
          source_provider: skill.source_provider,
          source_url: skill.source_url,
          display_name: skill.display_name || '',
          message: 'Unsupported registry provider',
        }, 400);
      }

      if (!bucket) return json({ error: 'Storage not available' }, 500);

      const r2Key = skill.r2_key || `skills/${name}.zip`;
      let object = await bucket.get(r2Key);
      if (!object && !skill.r2_key) {
        object = await bucket.get(`skills/${name}/${skill.version}.zip`);
      }
      if (!object) return json({ error: 'Package not found' }, 404);

      return new Response(object.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${name}-${skill.version}.zip"`,
          ...(skill.sha256 ? { 'X-Checksum-Sha256': skill.sha256 } : {}),
        },
      });
    }

    // Skill not in DB — try provider fallback for supported registries
    if (provider && REGISTRY_PROVIDERS[provider]) {
      const downloadUrl = REGISTRY_PROVIDERS[provider](name!);
      return json({
        source_type: 'registry',
        source_provider: provider,
        download_url: downloadUrl,
      });
    }

    return json({ error: 'Skill not found' }, 404);
  } catch (err: unknown) {
    return errorResponse('download error:', err);
  }
};
