/**
 * Cloudflare Workers API for CowAgent Skill Hub.
 *
 * Bindings (wrangler.toml):
 *   DB     - D1 database
 *   BUCKET - R2 bucket for skill zip packages
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/api/tags' && request.method === 'GET') {
        return await handleListTags(env, corsHeaders);
      }

      if (path === '/api/skills' && request.method === 'GET') {
        return await handleListSkills(url, env, corsHeaders);
      }

      if (path === '/api/skills/search' && request.method === 'GET') {
        return await handleSearchSkills(url, env, corsHeaders);
      }

      const detailMatch = path.match(/^\/api\/skills\/([^/]+)$/);
      if (detailMatch && request.method === 'GET') {
        return await handleGetSkill(detailMatch[1], env, corsHeaders);
      }

      const filesMatch = path.match(/^\/api\/skills\/([^/]+)\/files$/);
      if (filesMatch && request.method === 'GET') {
        return await handleGetSkillFiles(filesMatch[1], env, corsHeaders);
      }

      const downloadMatch = path.match(/^\/api\/skills\/([^/]+)\/download$/);
      if (downloadMatch && request.method === 'GET') {
        return await handleDownloadSkill(downloadMatch[1], env, corsHeaders);
      }

      const installMatch = path.match(/^\/api\/skills\/([^/]+)\/install$/);
      if (installMatch && request.method === 'POST') {
        return await handleRecordInstall(installMatch[1], request, env, corsHeaders);
      }

      return json({ error: 'Not Found' }, 404, corsHeaders);
    } catch (err) {
      return json({ error: err.message || 'Internal Server Error' }, 500, corsHeaders);
    }
  },

  async scheduled(event, env) {
    console.log('Scheduled sync triggered');
    // TODO: implement GitHub → D1/R2 sync
  },
};

// --- Handlers ---

async function handleListTags(env, headers) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, sort_order FROM tag_definitions ORDER BY sort_order ASC'
  ).all();
  return json({ tags: results }, 200, headers);
}

async function handleListSkills(url, env, headers) {
  const category = url.searchParams.get('category') || 'all';
  const provider = url.searchParams.get('provider') || 'all';
  const tag = url.searchParams.get('tag') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM skills WHERE status = ?';
  const params = ['published'];

  if (category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (provider !== 'all') {
    query += ' AND source_provider = ?';
    params.push(provider);
  }

  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%"${tag}"%`);
  }

  query += ' ORDER BY sort_order ASC, downloads DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await env.DB.prepare(query).bind(...params).all();

  let countQuery = "SELECT COUNT(*) as total FROM skills WHERE status = 'published'";
  const countParams = [];
  if (category !== 'all') {
    countQuery += ' AND category = ?';
    countParams.push(category);
  }
  if (provider !== 'all') {
    countQuery += ' AND source_provider = ?';
    countParams.push(provider);
  }
  if (tag) {
    countQuery += ' AND tags LIKE ?';
    countParams.push(`%"${tag}"%`);
  }
  const { results: countResults } = await env.DB.prepare(countQuery).bind(...countParams).all();

  return json({
    skills: results.map(parseSkillRow),
    total: countResults[0]?.total || 0,
    page,
    limit,
  }, 200, headers);
}

async function handleGetSkill(name, env, headers) {
  const skill = await env.DB.prepare(
    'SELECT * FROM skills WHERE name = ? AND status = ?'
  ).bind(name, 'published').first();

  if (!skill) {
    return json({ error: 'Skill not found' }, 404, headers);
  }

  await env.DB.prepare(
    'UPDATE skills SET views = views + 1 WHERE name = ?'
  ).bind(name).run();

  return json({ skill: parseSkillRow(skill) }, 200, headers);
}

async function handleGetSkillFiles(name, env, headers) {
  const files = await env.DB.prepare(
    'SELECT path, content, size FROM skill_files WHERE skill_name = ? ORDER BY path'
  ).bind(name).all();

  return json({ files: files.results }, 200, headers);
}

async function handleDownloadSkill(name, env, headers) {
  const skill = await env.DB.prepare(
    'SELECT name, version, source_type, source_url, source_path, r2_key FROM skills WHERE name = ? AND status = ?'
  ).bind(name, 'published').first();

  if (!skill) {
    return json({ error: 'Skill not found' }, 404, headers);
  }

  if (skill.source_type === 'github' && skill.source_url) {
    const ghUrl = `https://github.com/${skill.source_url}/archive/refs/heads/main.zip`;
    await env.DB.prepare(
      'UPDATE skills SET downloads = downloads + 1 WHERE name = ?'
    ).bind(name).run();
    return json({
      redirect: ghUrl,
      source_type: 'github',
      source_url: skill.source_url,
      source_path: skill.source_path || null,
    }, 200, headers);
  }

  if (skill.source_type === 'registry') {
    await env.DB.prepare(
      'UPDATE skills SET downloads = downloads + 1 WHERE name = ?'
    ).bind(name).run();
    return json({
      source_type: 'registry',
      source_url: skill.source_url,
      message: 'Use the corresponding CLI to install this skill',
    }, 200, headers);
  }

  const r2Key = skill.r2_key || `skills/${name}/${skill.version}.zip`;
  const object = await env.BUCKET.get(r2Key);

  if (!object) {
    return json({ error: 'Package not found' }, 404, headers);
  }

  await env.DB.prepare(
    'UPDATE skills SET downloads = downloads + 1 WHERE name = ?'
  ).bind(name).run();

  return new Response(object.body, {
    headers: {
      ...headers,
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${name}-${skill.version}.zip"`,
    },
  });
}

async function handleRecordInstall(name, request, env, headers) {
  let cowVersion = null;
  try {
    const body = await request.json();
    cowVersion = body.cow_version || null;
  } catch (e) {
    // no body is fine
  }

  await env.DB.prepare(
    'UPDATE skills SET downloads = downloads + 1 WHERE name = ?'
  ).bind(name).run();

  await env.DB.prepare(
    'INSERT INTO install_logs (skill_name, client_ip, user_agent, cow_version) VALUES (?, ?, ?, ?)'
  ).bind(
    name,
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For'),
    request.headers.get('User-Agent'),
    cowVersion
  ).run();

  return json({ ok: true }, 200, headers);
}

async function handleSearchSkills(url, env, headers) {
  const q = url.searchParams.get('q') || '';
  if (!q) {
    return json({ skills: [] }, 200, headers);
  }

  const pattern = `%${q}%`;
  const { results } = await env.DB.prepare(
    `SELECT * FROM skills
     WHERE status = 'published'
       AND (name LIKE ? OR display_name LIKE ? OR description LIKE ? OR summary LIKE ? OR tags LIKE ?)
     ORDER BY downloads DESC
     LIMIT 20`
  ).bind(pattern, pattern, pattern, pattern, pattern).all();

  return json({ skills: results.map(parseSkillRow) }, 200, headers);
}

// --- Helpers ---

function parseSkillRow(row) {
  if (!row) return row;
  return {
    ...row,
    tags: safeJsonParse(row.tags, []),
    requires_env: safeJsonParse(row.requires_env, []),
    requires_bins: safeJsonParse(row.requires_bins, []),
    platforms: safeJsonParse(row.platforms, ['darwin', 'linux', 'windows']),
    featured: !!row.featured,
  };
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}
