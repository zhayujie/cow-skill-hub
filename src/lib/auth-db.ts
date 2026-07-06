/**
 * Persist OAuth user (users table with provider + composite uniqueness).
 */

import type { DataStore } from '@/server/storage/types';

export async function upsertOAuthUser(
  db: DataStore,
  row: {
    id: string;
    provider: 'github' | 'google';
    username: string;
    display_name: string;
    avatar_url: string;
    github_url: string | null;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (id, provider, username, display_name, avatar_url, github_url, role)
       VALUES (?, ?, ?, ?, ?, ?, 'user')
       ON CONFLICT(id) DO UPDATE SET
         username = excluded.username,
         display_name = excluded.display_name,
         avatar_url = excluded.avatar_url,
         github_url = excluded.github_url`,
    )
    .bind(
      row.id,
      row.provider,
      row.username,
      row.display_name,
      row.avatar_url,
      row.github_url,
    )
    .run();
}
