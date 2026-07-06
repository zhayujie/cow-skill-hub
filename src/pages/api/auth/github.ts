import type { APIRoute } from 'astro';
import { getSecrets } from '../_utils';
import { OAUTH_STATE_COOKIE, OAUTH_STATE_MAX_AGE, isSecureRequest } from '@/lib/oauth-cookie';

export const GET: APIRoute = async ({ request, redirect, cookies, locals }) => {
  const clientId = (await getSecrets(locals)).GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('GitHub OAuth is not configured', { status: 503 });
  }

  const state = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/github/callback`;

  cookies.set(OAUTH_STATE_COOKIE, `github:${state}`, {
    path: '/',
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: 'lax',
    maxAge: OAUTH_STATE_MAX_AGE,
  });

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'read:user user:email');
  authUrl.searchParams.set('state', state);

  return redirect(authUrl.toString(), 302);
};
