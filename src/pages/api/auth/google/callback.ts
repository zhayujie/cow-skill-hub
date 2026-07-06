import type { APIRoute } from 'astro';
import { getDB, getSecrets } from '../../_utils';
import { signJwt } from '@/lib/jwt';
import { upsertOAuthUser } from '@/lib/auth-db';
import {
  AUTH_TOKEN_COOKIE,
  JWT_TTL_SECONDS,
  OAUTH_STATE_COOKIE,
  isSecureRequest,
} from '@/lib/oauth-cookie';

function googleUsernameFromEmail(email: string, sub: string): string {
  const local = email.split('@')[0] || '';
  const safe = local.replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, 48);
  if (safe.length >= 2) return safe;
  return `user-${sub.replace(/[^a-zA-Z0-9]/g, '').slice(-16) || 'google'}`;
}

export const GET: APIRoute = async ({ request, redirect, cookies, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const stored = cookies.get(OAUTH_STATE_COOKIE)?.value;
  cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

  if (!code || !state || !stored || stored !== `google:${state}`) {
    return redirect('/submit?error=oauth_state', 302);
  }

  const secrets = await getSecrets(locals);
  const clientId = secrets.GOOGLE_CLIENT_ID;
  const clientSecret = secrets.GOOGLE_CLIENT_SECRET;
  const jwtSecret = secrets.JWT_SECRET;
  const db = await getDB(locals);

  if (!clientId || !clientSecret || !jwtSecret) {
    return new Response('OAuth server misconfiguration', { status: 503 });
  }
  if (!db) {
    return new Response('Database not available', { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenJson.access_token) {
    return redirect('/submit?error=oauth_token', 302);
  }

  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  const u = (await userRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!userRes.ok || !u.sub) {
    return redirect('/submit?error=oauth_user', 302);
  }

  const email = u.email || '';
  const username = googleUsernameFromEmail(email, u.sub);
  const displayName = (u.name && u.name.trim()) || username;
  const avatar = u.picture || '';
  const userId = `google:${u.sub}`;

  await upsertOAuthUser(db, {
    id: userId,
    provider: 'google',
    username,
    display_name: displayName,
    avatar_url: avatar,
    github_url: null,
  });

  const jwt = await signJwt(
    {
      sub: userId,
      username,
      name: displayName,
      avatar,
    },
    jwtSecret,
    JWT_TTL_SECONDS,
  );

  cookies.set(AUTH_TOKEN_COOKIE, jwt, {
    path: '/',
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: 'lax',
    maxAge: JWT_TTL_SECONDS,
  });

  return redirect('/submit', 302);
};
