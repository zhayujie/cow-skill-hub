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

export const GET: APIRoute = async ({ request, redirect, cookies, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const stored = cookies.get(OAUTH_STATE_COOKIE)?.value;
  cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

  if (!code || !state || !stored || stored !== `github:${state}`) {
    return redirect('/submit?error=oauth_state', 302);
  }

  const secrets = await getSecrets(locals);
  const clientId = secrets.GITHUB_CLIENT_ID;
  const clientSecret = secrets.GITHUB_CLIENT_SECRET;
  const jwtSecret = secrets.JWT_SECRET;
  const db = await getDB(locals);

  if (!clientId || !clientSecret || !jwtSecret) {
    return new Response('OAuth server misconfiguration', { status: 503 });
  }
  if (!db) {
    return new Response('Database not available', { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/github/callback`;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenJson.access_token) {
    return redirect('/submit?error=oauth_token', 302);
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'CowAgent-SkillHub',
    },
  });

  const gh = (await userRes.json()) as {
    id?: number;
    login?: string;
    name?: string | null;
    avatar_url?: string | null;
    html_url?: string | null;
  };

  if (!userRes.ok || gh.id == null || !gh.login) {
    return redirect('/submit?error=oauth_user', 302);
  }

  const userId = `github:${gh.id}`;
  const displayName = (gh.name && gh.name.trim()) || gh.login;
  const avatar = gh.avatar_url || '';

  await upsertOAuthUser(db, {
    id: userId,
    provider: 'github',
    username: gh.login,
    display_name: displayName,
    avatar_url: avatar,
    github_url: gh.html_url || null,
  });

  const jwt = await signJwt(
    {
      sub: userId,
      username: gh.login,
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
