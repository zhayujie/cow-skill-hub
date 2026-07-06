import type { APIRoute } from 'astro';
import { getSecrets } from '../_utils';
import { OAUTH_STATE_COOKIE, OAUTH_STATE_MAX_AGE, isSecureRequest } from '@/lib/oauth-cookie';

export const GET: APIRoute = async ({ request, redirect, cookies, locals }) => {
  const clientId = (await getSecrets(locals)).GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response('Google OAuth is not configured', { status: 503 });
  }

  const state = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  cookies.set(OAUTH_STATE_COOKIE, `google:${state}`, {
    path: '/',
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: 'lax',
    maxAge: OAUTH_STATE_MAX_AGE,
  });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);

  return redirect(authUrl.toString(), 302);
};
