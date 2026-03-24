#!/usr/bin/env node

/**
 * Sync skills from the local skills/ directory to Cloudflare D1 and R2.
 *
 * This script is designed to run in GitHub Actions after a push to skills/.
 * It parses each SKILL.md frontmatter, upserts metadata into D1,
 * stores file contents for preview, and uploads zip packages to R2.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=xxx node scripts/sync-skills.js
 *
 * Requires: wrangler CLI installed globally.
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync, mkdtempSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { tmpdir } from 'node:os';

const SKILLS_DIR = join(process.cwd(), 'skills');
const DB_NAME = 'cow-skill-hub';
const R2_BUCKET = 'cow-skills';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: content };

  const yamlStr = match[1];
  const body = content.slice(match[0].length).trim();
  const meta = parseSimpleYaml(yamlStr);
  return { meta, body };
}

/**
 * Minimal YAML parser for SKILL.md frontmatter.
 * Handles flat key-value, inline arrays, and nested metadata.requires.
 */
function parseSimpleYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n');
  let currentKey = null;
  let currentIndent = 0;
  let nestedObj = null;
  let nestedKey = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;

    // Top-level key: value
    const kvMatch = trimmed.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kvMatch && indent === 0) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();

      if (val === '') {
        result[currentKey] = {};
        currentIndent = indent;
        nestedObj = result[currentKey];
        nestedKey = currentKey;
        continue;
      }

      result[currentKey] = parseValue(val);
      nestedObj = null;
      nestedKey = null;
      continue;
    }

    // Nested keys (metadata.requires.env etc.)
    if (nestedObj && indent > 0) {
      const nestedKvMatch = trimmed.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
      if (nestedKvMatch) {
        const nk = nestedKvMatch[1];
        const nv = nestedKvMatch[2].trim();
        if (nv === '') {
          nestedObj[nk] = {};
          const parentObj = nestedObj;
          nestedObj = nestedObj[nk];
        } else {
          nestedObj[nk] = parseValue(nv);
        }
      }
    }
  }

  return result;
}

function parseValue(val) {
  if (val.startsWith('[') && val.endsWith(']')) {
    const inner = val.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
  }
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^\d+$/.test(val)) return parseInt(val, 10);
  if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
  return val.replace(/^["']|["']$/g, '');
}

function collectFiles(dir) {
  const files = [];
  function walk(current, prefix = '') {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else {
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        const content = readFileSync(fullPath, 'utf-8');
        const size = statSync(fullPath).size;
        files.push({ path: relPath, content, size });
      }
    }
  }
  walk(dir);
  return files;
}

function discoverSkills() {
  if (!existsSync(SKILLS_DIR)) {
    console.log('No skills/ directory found, skipping.');
    return [];
  }

  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = join(SKILLS_DIR, entry.name);
    const skillMdPath = join(skillDir, 'SKILL.md');

    if (!existsSync(skillMdPath)) {
      console.warn(`  Skipping ${entry.name}: no SKILL.md found`);
      continue;
    }

    const rawContent = readFileSync(skillMdPath, 'utf-8');
    const { meta, body } = parseFrontmatter(rawContent);
    const files = collectFiles(skillDir);

    const requires = meta.metadata?.requires || {};
    const name = meta.name || entry.name;
    const version = meta.version || '1.0.0';

    const skill = {
      name,
      display_name: meta.display_name || meta.displayName || toDisplayName(name),
      description: meta.description || '',
      summary: meta.summary || '',
      version,
      author: meta.author || 'CowAgent',
      category: meta.category || 'official',
      tags: JSON.stringify(meta.tags || []),
      featured: meta.featured ? 1 : 0,
      sort_order: meta.sort_order || 100,
      status: 'published',
      skill_md: rawContent,
      requires_env: JSON.stringify(requires.env || []),
      requires_bins: JSON.stringify(requires.bins || requires.anyBins || []),
      platforms: JSON.stringify(meta.platforms || ['darwin', 'linux', 'windows']),
      homepage: meta.homepage || null,
      source_type: 'zip',
      source_provider: meta.source_provider || 'cowagent',
      source_url: meta.source_url || null,
      source_path: meta.source_path || null,
      r2_key: `skills/${name}/${version}.zip`,
      files,
    };

    skills.push(skill);
    console.log(`  Found skill: ${name} v${version} (${files.length} files)`);
  }

  return skills;
}

function toDisplayName(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function wrangler(args) {
  const cmd = `npx wrangler ${args}`;
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'inherit'] });
}

function d1Execute(sql) {
  const tmpFile = join(tmpdir(), `cow-sql-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(tmpFile, sql, 'utf-8');
  try {
    return wrangler(`d1 execute ${DB_NAME} --remote --file="${tmpFile}"`);
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

async function syncSkill(skill) {
  console.log(`\nSyncing: ${skill.name}`);

  // Upsert skill metadata
  const upsertSql = `
    INSERT INTO skills (name, display_name, description, summary, version, author, category, tags, featured, sort_order, status, skill_md, requires_env, requires_bins, platforms, homepage, source_type, source_provider, source_url, source_path, r2_key, updated_at)
    VALUES ('${esc(skill.name)}', '${esc(skill.display_name)}', '${esc(skill.description)}', '${esc(skill.summary)}', '${esc(skill.version)}', '${esc(skill.author)}', '${esc(skill.category)}', '${esc(skill.tags)}', ${skill.featured}, ${skill.sort_order}, '${esc(skill.status)}', '${esc(skill.skill_md)}', '${esc(skill.requires_env)}', '${esc(skill.requires_bins)}', '${esc(skill.platforms)}', ${sqlStr(skill.homepage)}, '${esc(skill.source_type)}', '${esc(skill.source_provider)}', ${sqlStr(skill.source_url)}, ${sqlStr(skill.source_path)}, '${esc(skill.r2_key)}', datetime('now'))
    ON CONFLICT(name) DO UPDATE SET
      display_name = excluded.display_name,
      description = excluded.description,
      summary = excluded.summary,
      version = excluded.version,
      author = excluded.author,
      category = excluded.category,
      tags = excluded.tags,
      featured = excluded.featured,
      sort_order = excluded.sort_order,
      skill_md = excluded.skill_md,
      requires_env = excluded.requires_env,
      requires_bins = excluded.requires_bins,
      platforms = excluded.platforms,
      homepage = excluded.homepage,
      source_type = excluded.source_type,
      source_provider = excluded.source_provider,
      source_url = excluded.source_url,
      source_path = excluded.source_path,
      r2_key = excluded.r2_key,
      updated_at = datetime('now');
  `.trim();

  d1Execute(upsertSql);

  // Sync skill files for preview
  d1Execute(`DELETE FROM skill_files WHERE skill_name = '${esc(skill.name)}';`);
  for (const file of skill.files) {
    const insertFile = `
      INSERT INTO skill_files (skill_name, path, content, size)
      VALUES ('${esc(skill.name)}', '${esc(file.path)}', '${esc(file.content)}', ${file.size});
    `.trim();
    d1Execute(insertFile);
  }

  // Create zip and upload to R2
  const tempDir = mkdtempSync(join(tmpdir(), 'cow-skill-'));
  const zipPath = join(tempDir, `${skill.name}.zip`);
  const skillDir = join(SKILLS_DIR, skill.name);

  execSync(`cd "${skillDir}" && zip -r "${zipPath}" . -x '.*'`, { stdio: 'inherit' });
  wrangler(`r2 object put ${R2_BUCKET}/${skill.r2_key} --file="${zipPath}"`);
  console.log(`  Uploaded: ${skill.r2_key}`);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/'/g, "''");
}

function sqlStr(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${esc(val)}'`;
}

// --- Main ---

console.log('=== CowAgent Skill Hub - Sync ===\n');
console.log('Discovering skills...');
const skills = discoverSkills();

if (skills.length === 0) {
  console.log('No skills found to sync.');
  process.exit(0);
}

console.log(`\nFound ${skills.length} skill(s). Starting sync...`);

for (const skill of skills) {
  try {
    await syncSkill(skill);
  } catch (err) {
    console.error(`  ERROR syncing ${skill.name}:`, err.message);
    process.exit(1);
  }
}

console.log(`\n=== Sync complete: ${skills.length} skill(s) synced ===`);
