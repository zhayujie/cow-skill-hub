import type { APIRoute } from 'astro';
import { json } from '../_utils';
import { AUTH_TOKEN_COOKIE } from '@/lib/oauth-cookie';

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(AUTH_TOKEN_COOKIE, { path: '/' });
  return json({ ok: true });
};
