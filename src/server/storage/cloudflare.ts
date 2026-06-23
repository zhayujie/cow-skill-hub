/**
 * Cloudflare backend (default): D1 for the database, R2 for object storage.
 *
 * These adapters are thin pass-throughs because the storage interfaces were
 * modeled on the D1/R2 APIs, so the default deployment keeps identical behavior.
 */
import type {
  BlobObject,
  BlobStore,
  DataStore,
  PreparedStatement,
  PutOptions,
} from './types';

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown>;
}

interface R2Object {
  body: ReadableStream | null;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: Uint8Array | ArrayBuffer, options?: PutOptions): Promise<unknown>;
  delete(key: string): Promise<void>;
}

class D1PreparedStatementAdapter implements PreparedStatement {
  constructor(private stmt: D1PreparedStatement) {}

  bind(...values: unknown[]): PreparedStatement {
    return new D1PreparedStatementAdapter(this.stmt.bind(...values));
  }

  all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    return this.stmt.all<T>();
  }

  first<T = Record<string, unknown>>(): Promise<T | null> {
    return this.stmt.first<T>();
  }

  run(): Promise<{ success: boolean }> {
    return this.stmt.run();
  }

  /** Internal: expose the underlying D1 statement for batch(). */
  unwrap(): D1PreparedStatement {
    return this.stmt;
  }
}

export class D1DataStore implements DataStore {
  constructor(private db: D1Database) {}

  prepare(query: string): PreparedStatement {
    return new D1PreparedStatementAdapter(this.db.prepare(query));
  }

  batch(statements: PreparedStatement[]): Promise<unknown> {
    const inner = statements.map((s) => (s as D1PreparedStatementAdapter).unwrap());
    return this.db.batch(inner);
  }
}

export class R2BlobStore implements BlobStore {
  constructor(private bucket: R2Bucket) {}

  async get(key: string): Promise<BlobObject | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    return {
      body: obj.body,
      arrayBuffer: () => obj.arrayBuffer(),
    };
  }

  async put(key: string, value: Uint8Array | ArrayBuffer, options?: PutOptions): Promise<void> {
    await this.bucket.put(key, value, options);
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}
