/**
 * Minimal JWT HS256 sign/verify using Web Crypto (Edge-compatible).
 */

const encoder = new TextEncoder();

function base64UrlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecodeToString(s: string): string {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export interface JwtUserPayload {
  sub: string;
  username: string;
  name: string;
  avatar: string;
  iat: number;
  exp: number;
}

function defaultHeaderB64(): string {
  return base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
}

export async function signJwt(
  payload: Omit<JwtUserPayload, 'iat' | 'exp'>,
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const body: JwtUserPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const headerB64 = defaultHeaderB64();
  const payloadB64 = base64UrlEncode(JSON.stringify(body));
  const data = `${headerB64}.${payloadB64}`;
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sigB64 = base64UrlEncode(new Uint8Array(sig));
  return `${data}.${sigB64}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtUserPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  try {
    const hdr = JSON.parse(base64UrlDecodeToString(h)) as { alg?: string };
    if (hdr.alg !== 'HS256') return null;
  } catch {
    return null;
  }
  const data = `${h}.${p}`;
  const key = await importHmacKey(secret);
  let sigBytes: Uint8Array;
  try {
    const b64 = sig.replace(/-/g, '+').replace(/_/g, '/');
    let pad = b64;
    while (pad.length % 4) pad += '=';
    const bin = atob(pad);
    sigBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) sigBytes[i] = bin.charCodeAt(i);
  } catch {
    return null;
  }
  const ok = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
  if (!ok) return null;
  let body: JwtUserPayload;
  try {
    body = JSON.parse(base64UrlDecodeToString(p)) as JwtUserPayload;
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof body.exp !== 'number' || body.exp < now) return null;
  if (!body.sub || !body.username) return null;
  return body;
}
