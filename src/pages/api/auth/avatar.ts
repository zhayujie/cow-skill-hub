import type { APIRoute } from 'astro';
import { verifyJwt } from '@/lib/jwt';
import { AUTH_TOKEN_COOKIE } from '@/lib/oauth-cookie';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function allowedAvatarHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === 'lh3.googleusercontent.com' ||
    h.endsWith('.googleusercontent.com') ||
    h === 'avatars.githubusercontent.com' ||
    h.endsWith('.githubusercontent.com') ||
    h === 'secure.gravatar.com' ||
    h.endsWith('.gravatar.com')
  );
}

function safeAvatarUrl(raw: string): URL | null {
  const t = raw.trim();
  if (!t.startsWith('https://') && !t.startsWith('http://')) return null;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return null;
  }
  if (u.username || u.password) return null;
  if (!allowedAvatarHost(u.hostname)) return null;
  return u;
}

export const GET: APIRoute = async ({ cookies, locals }) => {
  const secret = locals.runtime?.env?.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length === 0) {
    return new Response(null, { status: 503 });
  }

  const token = cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return new Response(null, { status: 401 });

  const payload = await verifyJwt(token, secret);
  if (!payload?.avatar) return new Response(null, { status: 404 });

  const target = safeAvatarUrl(payload.avatar);
  if (!target) return new Response(null, { status: 400 });

  const upstream = await fetch(target.toString(), {
    redirect: 'follow',
    headers: {
      Accept: 'image/*,*/*;q=0.8',
      'User-Agent': 'CowAgent-SkillHub-Avatar/1.0',
    },
    // @ts-expect-error Cloudflare caches the subrequest (reduces 429 from Google CDN)
    cf: { cacheEverything: true, cacheTtl: 86_400 },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: 502 });
  }

  const len = upstream.headers.get('Content-Length');
  if (len && Number(len) > MAX_AVATAR_BYTES) {
    return new Response(null, { status: 413 });
  }

  const ct = upstream.headers.get('Content-Type') || 'image/jpeg';
  if (!ct.startsWith('image/')) {
    return new Response(null, { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
      'Referrer-Policy': 'no-referrer',
      Vary: 'Cookie',
    },
  });
};
