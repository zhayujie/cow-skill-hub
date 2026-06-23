/**
 * Lightweight SQLite -> MySQL translation.
 *
 * The codebase was written against D1 (SQLite). Rather than rewriting every
 * query, we translate the small set of dialect differences actually used here
 * at the MySQL adapter boundary. This keeps business code dialect-agnostic.
 *
 * Handled differences:
 *  - `datetime('now')`            -> `NOW()`
 *  - `INSERT OR IGNORE`           -> `INSERT IGNORE`
 *  - `INSERT ... ON CONFLICT(x) DO UPDATE SET ...` (upsert)
 *                                 -> `INSERT ... ON DUPLICATE KEY UPDATE ...`
 *  - `excluded.col`               -> `VALUES(col)` inside upsert tails
 *  - `... ESCAPE '\'`             -> stripped (MySQL LIKE escapes with `\` by default)
 *
 * Positional `?` placeholders are identical in both dialects, so binding is
 * unchanged.
 */

function translateOnConflict(sql: string): string {
  // Match: ON CONFLICT(<cols>) DO UPDATE SET <assignments...>
  // The assignment list runs to the end of the statement here (no trailing WHERE
  // is used in this codebase's upserts).
  const re = /ON\s+CONFLICT\s*\([^)]*\)\s*DO\s+UPDATE\s+SET\s+([\s\S]+)$/i;
  const m = sql.match(re);
  if (!m) return sql;

  let assignments = m[1];
  // SQLite references the proposed row via `excluded.<col>`; MySQL uses VALUES(<col>).
  assignments = assignments.replace(/excluded\.([a-zA-Z_][a-zA-Z0-9_]*)/gi, 'VALUES($1)');

  return sql.slice(0, m.index) + 'ON DUPLICATE KEY UPDATE ' + assignments;
}

export function translateSqliteToMysql(sql: string): string {
  let out = sql;

  // datetime('now') / datetime("now") -> NOW()
  out = out.replace(/datetime\(\s*['"]now['"]\s*\)/gi, 'NOW()');

  // INSERT OR IGNORE -> INSERT IGNORE
  out = out.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT IGNORE INTO');

  // UPSERT
  if (/ON\s+CONFLICT/i.test(out)) {
    out = translateOnConflict(out);
  }

  // Strip `ESCAPE '\'` clauses — MySQL's LIKE already treats backslash as the
  // default escape character, and the SQLite-specific ESCAPE syntax is rejected.
  out = out.replace(/\s+ESCAPE\s+'\\\\?'/gi, '');

  return out;
}
