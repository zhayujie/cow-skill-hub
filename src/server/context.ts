/**
 * Unified runtime context.
 *
 * Resolves the active backend once per process and exposes a single
 * `getAppContext(locals)` that returns `{ db, blob, secrets }` regardless of
 * whether the app runs on Cloudflare (D1 + R2) or Node (MySQL + filesystem).
 *
 * The deploy target is chosen via the `DEPLOY_TARGET` env var:
 *   - "cloudflare" (default): use bindings from `locals.runtime.env`
 *   - "node":                 use MySQL + filesystem, secrets from `process.env`
 *
 * On Cloudflare, `DEPLOY_TARGET` is typically unset, so the default keeps the
 * original behavior untouched.
 */
import type { APIContext } from 'astro';
import type { AppContext, AppSecrets, DeployTarget } from './storage/types';
import { D1DataStore, R2BlobStore } from './storage/cloudflare';

function readEnv(locals: APIContext['locals'], key: string): string | undefined {
  const fromCfEnv = (locals as any)?.runtime?.env?.[key];
  const fromProcess =
    typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  const value = fromCfEnv ?? fromProcess;
  return value == null ? undefined : value.toString();
}

function resolveTarget(locals: APIContext['locals']): DeployTarget {
  // Cloudflare runtime exposes env via locals.runtime.env; Node uses process.env.
  const raw = (readEnv(locals, 'DEPLOY_TARGET') || '').toLowerCase();
  return raw === 'node' ? 'node' : 'cloudflare';
}

function resolveAnonymousSubmit(locals: APIContext['locals'], target: DeployTarget): boolean {
  const raw = readEnv(locals, 'ALLOW_ANONYMOUS_SUBMIT');
  if (raw != null && raw !== '') {
    return /^(1|true|yes|on)$/i.test(raw.trim());
  }
  // Default: anonymous submit is enabled for simple self-hosted (Node) setups,
  // disabled on Cloudflare where OAuth is the norm.
  return target === 'node';
}

function cloudflareContext(locals: APIContext['locals']): AppContext {
  const env = (locals as any)?.runtime?.env ?? {};
  return {
    db: env.DB ? new D1DataStore(env.DB) : null,
    blob: env.BUCKET ? new R2BlobStore(env.BUCKET) : null,
    secrets: {
      JWT_SECRET: env.JWT_SECRET,
      GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    },
    allowAnonymousSubmit: resolveAnonymousSubmit(locals, 'cloudflare'),
  };
}

// Node backends are created lazily and cached so the MySQL pool and filesystem
// store are shared across all requests in the process.
let nodeContextPromise: Promise<AppContext> | null = null;

async function buildNodeContext(): Promise<AppContext> {
  const [{ MySQLDataStore }, { FsBlobStore }] = await Promise.all([
    import('./storage/mysql'),
    import('./storage/fs-blob'),
  ]);
  const secrets: AppSecrets = {
    JWT_SECRET: process.env.JWT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };
  return {
    db: new MySQLDataStore(),
    blob: new FsBlobStore(),
    secrets,
    allowAnonymousSubmit: true,
  };
}

function nodeContext(): Promise<AppContext> {
  if (!nodeContextPromise) {
    nodeContextPromise = buildNodeContext();
  }
  return nodeContextPromise;
}

/**
 * Resolve the backend context for the current request.
 *
 * Returns a Promise because the Node backend is initialized lazily; the
 * Cloudflare path resolves synchronously-fast (already-bound objects).
 */
export async function getAppContext(locals: APIContext['locals']): Promise<AppContext> {
  if (resolveTarget(locals) === 'node') {
    const base = await nodeContext();
    // Resolve the flag per request so an explicit env override is honored.
    return { ...base, allowAnonymousSubmit: resolveAnonymousSubmit(locals, 'node') };
  }
  return cloudflareContext(locals);
}
