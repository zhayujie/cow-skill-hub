import type { APIRoute } from 'astro';
import { getDB, getBucket, json, errorResponse } from '../_utils';
import { buildZip } from '@/lib/build-zip';
import { FALLBACK_CATALOG_SLUGS } from '@/data/fallback-catalog-slugs';
import { isValidSubmitSlug } from '@/lib/slug';

const MAX_BODY_CHARS = 5_242_880; // 5 MB JSON text (matches client-side limit)

interface SubmitFile {
  path: string;
  content: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const db = getDB(locals);
  const bucket = getBucket(locals);
  if (!db || !bucket) {
    return json({ error: 'Service unavailable' }, 503);
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }
  if (bodyText.length > MAX_BODY_CHARS) {
    return json({ error: 'Payload too large' }, 413);
  }

  let body: {
    name?: string;
    display_name?: string;
    description?: string;
    summary?: string;
    tags?: string[];
    files?: SubmitFile[];
  };
  try {
    body = JSON.parse(bodyText) as typeof body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const summary =
    typeof body.summary === 'string' && body.summary.trim()
      ? body.summary.trim()
      : description;
  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string') : [];
  const files = Array.isArray(body.files) ? body.files : [];

  if (!isValidSubmitSlug(name)) {
    return json({ error: 'Invalid slug: use 2–64 chars, lowercase letters, digits, and hyphens only' }, 400);
  }
  if (!displayName || displayName.length > 200) {
    return json({ error: 'display_name is required (max 200 chars)' }, 400);
  }
  if (!description || description.length > 2000) {
    return json({ error: 'description is required (max 2000 chars)' }, 400);
  }

  const normalizedFiles: SubmitFile[] = [];
  let total = 0;
  const seen = new Set<string>();
  for (const f of files) {
    if (!f || typeof f.path !== 'string' || typeof f.content !== 'string') continue;
    const path = f.path.replace(/^\/+/, '').trim();
    if (!path || path.includes('..') || seen.has(path)) continue;
    seen.add(path);
    total += f.content.length;
    if (total > MAX_BODY_CHARS) {
      return json({ error: 'Total file content too large' }, 413);
    }
    normalizedFiles.push({ path, content: f.content });
  }

  const hasSkillMd = normalizedFiles.some((f) => f.path.toLowerCase() === 'skill.md');
  if (!hasSkillMd) {
    return json({ error: 'SKILL.md is required' }, 400);
  }

  const existingRow = await db
    .prepare('SELECT status FROM skills WHERE name = ?')
    .bind(name)
    .first<{ status: string }>();
  if (existingRow?.status === 'published') {
    return json({ error: '该唯一标识与技能库中已上架技能重复，请更换后再提交。' }, 409);
  }
  if (existingRow?.status === 'pending') {
    return json({ error: '该唯一标识已有提交正在审核中，请更换后再提交。' }, 409);
  }
  if (existingRow?.status) {
    return json({ error: '该唯一标识已被占用，请更换后再提交。' }, 409);
  }
  if (FALLBACK_CATALOG_SLUGS.has(name)) {
    return json({ error: '该唯一标识与技能库中已上架技能重复，请更换后再提交。' }, 409);
  }

  const tagsJson = JSON.stringify(tags);
  const authorStr = user.name || user.username;
  const r2Key = `skills/${name}.zip`;

  const zipInner = normalizedFiles.map((f) => ({
    path: `${name}/${f.path}`,
    content: f.content,
  }));
  let zipBytes: Uint8Array;
  try {
    zipBytes = buildZip(zipInner);
  } catch (e) {
    return errorResponse('buildZip', e);
  }

  const skillMdContent =
    normalizedFiles.find((f) => f.path.toLowerCase() === 'skill.md')?.content || '';

  const insertSkill = db
    .prepare(
      `INSERT INTO skills (
        name, display_name, description, summary, version, author, author_id,
        category, tags, featured, sort_order, status, requires_env, requires_bins,
        platforms, homepage, source_type, source_provider, source_url, skill_md, r2_key
      ) VALUES (?, ?, ?, ?, '1.0.0', ?, ?, 'community', ?, 0, 500, 'pending', '[]', '[]',
        '["darwin","linux","windows"]', NULL, 'zip', 'community', NULL, ?, ?)`,
    )
    .bind(
      name,
      displayName,
      description,
      summary,
      authorStr,
      user.sub,
      tagsJson,
      skillMdContent,
      r2Key,
    );

  const fileStmts = normalizedFiles.map((f) =>
    db
      .prepare('INSERT INTO skill_files (skill_name, path, content, size) VALUES (?, ?, ?, ?)')
      .bind(name, f.path, f.content, new TextEncoder().encode(f.content).length),
  );

  try {
    await insertSkill.run();
    const CHUNK = 80;
    for (let i = 0; i < fileStmts.length; i += CHUNK) {
      await db.batch(fileStmts.slice(i, i + CHUNK));
    }
  } catch (err: unknown) {
    try {
      await db.prepare('DELETE FROM skill_files WHERE skill_name = ?').bind(name).run();
      await db.prepare('DELETE FROM skills WHERE name = ?').bind(name).run();
    } catch {
      /* ignore cleanup errors */
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE') || msg.includes('constraint') || msg.includes('FOREIGN KEY')) {
      return json(
        {
          error: msg.includes('FOREIGN KEY')
            ? '账号无效，请重新登录后再试'
            : '该唯一标识已存在或文件路径冲突，请更换后再提交',
        },
        msg.includes('FOREIGN KEY') ? 400 : 409,
      );
    }
    return errorResponse('submit batch', err);
  }

  try {
    await bucket.put(r2Key, zipBytes, {
      httpMetadata: { contentType: 'application/zip' },
    });
  } catch (err) {
    console.error('R2 put failed after D1 insert', err);
    try {
      await db.prepare('DELETE FROM skill_files WHERE skill_name = ?').bind(name).run();
      await db.prepare('DELETE FROM skills WHERE name = ?').bind(name).run();
    } catch (cleanErr) {
      console.error('Cleanup after R2 failure', cleanErr);
    }
    return json({ error: 'Failed to store package' }, 500);
  }

  return json({ ok: true, name }, 201);
};
