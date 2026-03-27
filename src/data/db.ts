import type { SkillData, SkillFile } from './skills';
import { skills as mockSkills } from './skills';

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all(): Promise<{ results: Record<string, unknown>[] }>;
  first(): Promise<Record<string, unknown> | null>;
}

function safeParse(s: unknown, fallback: unknown) {
  if (typeof s !== 'string') return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

function rowToSkill(row: Record<string, unknown>): SkillData {
  return {
    name: row.name as string,
    displayName: row.display_name as string,
    description: row.description as string || '',
    summary: row.summary as string || '',
    version: row.version as string || '1.0.0',
    author: row.author as string || 'CowAgent',
    category: row.category as SkillData['category'],
    tags: safeParse(row.tags, []),
    featured: !!(row.featured as number),
    downloads: row.downloads as number || 0,
    requiresEnv: safeParse(row.requires_env, []),
    requiresBins: safeParse(row.requires_bins, []),
    platforms: safeParse(row.platforms, ['darwin', 'linux', 'windows']),
    homepage: row.homepage as string | undefined,
    sourceType: row.source_type as SkillData['sourceType'],
    sourceProvider: row.source_provider as SkillData['sourceProvider'],
    sourceUrl: row.source_url as string | undefined,
    sourcePath: row.source_path as string | undefined,
    files: [],
  };
}

export async function getAllSkills(db: D1Database | null): Promise<SkillData[]> {
  if (!db) return mockSkills;
  try {
    const { results } = await db.prepare(
      "SELECT * FROM skills WHERE status = 'published' ORDER BY sort_order ASC, downloads DESC"
    ).all();
    return results.map(rowToSkill);
  } catch {
    return mockSkills;
  }
}

export async function getSkillByName(db: D1Database | null, name: string): Promise<SkillData | null> {
  if (!db) {
    return mockSkills.find(s => s.name === name) || null;
  }
  try {
    const row = await db.prepare(
      "SELECT * FROM skills WHERE name = ? AND status = 'published'"
    ).bind(name).first();
    if (!row) return null;
    const skill = rowToSkill(row);

    const { results: fileRows } = await db.prepare(
      'SELECT path, content, size FROM skill_files WHERE skill_name = ? ORDER BY path'
    ).bind(name).all();
    skill.files = fileRows.map(f => ({
      path: f.path as string,
      content: f.content as string,
      size: f.size as number,
    }));

    return skill;
  } catch {
    return mockSkills.find(s => s.name === name) || null;
  }
}

export async function getTagDefinitions(db: D1Database | null): Promise<{ id: string; name: string }[]> {
  if (!db) return [];
  try {
    const { results } = await db.prepare(
      'SELECT id, name FROM tag_definitions ORDER BY sort_order ASC'
    ).all();
    return results.map(r => ({ id: r.id as string, name: r.name as string }));
  } catch {
    return [];
  }
}
