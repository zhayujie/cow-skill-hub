/**
 * Storage abstraction layer.
 *
 * Two pluggable backends sit behind these interfaces so the app can run either
 * on Cloudflare (D1 + R2, the default) or on a self-hosted Linux server
 * (MySQL + local filesystem). Business code only depends on these interfaces.
 */

/** A prepared SQL statement, intentionally mirroring Cloudflare D1's API so
 *  existing query code keeps working unchanged. */
export interface PreparedStatement {
  /** Bind positional `?` parameters. Returns a (possibly new) statement. */
  bind(...values: unknown[]): PreparedStatement;
  /** Run the query and return all rows. */
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  /** Run the query and return the first row (or null). */
  first<T = Record<string, unknown>>(): Promise<T | null>;
  /** Execute a write statement. */
  run(): Promise<{ success: boolean }>;
}

/** Database abstraction. Mirrors the subset of the D1 API the app uses. */
export interface DataStore {
  prepare(query: string): PreparedStatement;
  /** Execute multiple prepared statements (best-effort batch / transaction). */
  batch(statements: PreparedStatement[]): Promise<unknown>;
}

/** A stored binary object returned by BlobStore.get(). */
export interface BlobObject {
  /** Streamable body, suitable for passing directly to a Response. */
  body: ReadableStream | null;
  /** Full contents as bytes (use when streaming is not available). */
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface PutOptions {
  httpMetadata?: { contentType?: string };
}

/** Object storage abstraction. Mirrors the subset of the R2 API the app uses. */
export interface BlobStore {
  get(key: string): Promise<BlobObject | null>;
  put(key: string, value: Uint8Array | ArrayBuffer, options?: PutOptions): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Resolved secrets / runtime settings, read uniformly regardless of backend. */
export interface AppSecrets {
  JWT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

/** Everything the request handlers need from the runtime, backend-agnostic. */
export interface AppContext {
  db: DataStore | null;
  blob: BlobStore | null;
  secrets: AppSecrets;
  /**
   * When true, the submit flow skips login entirely: anyone can upload a skill
   * and it is published immediately under an anonymous author. Intended for
   * simple self-hosted deployments. Defaults to true on the Node backend and
   * false on Cloudflare.
   */
  allowAnonymousSubmit: boolean;
}

export type DeployTarget = 'cloudflare' | 'node';
