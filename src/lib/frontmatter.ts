/**
 * Minimal YAML frontmatter parser for SKILL.md (name, description).
 */

export function parseFrontmatter(text: string): Record<string, string> {
  if (!text) return {};
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const result: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const colon = t.indexOf(':');
    if (colon < 0) continue;
    const key = t.slice(0, colon).trim();
    let val = t.slice(colon + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}
