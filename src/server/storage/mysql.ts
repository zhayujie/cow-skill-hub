/**
 * Node backend: MySQL database via `mysql2/promise`.
 *
 * A single connection pool is reused across requests (module-level singleton).
 * SQLite-flavored SQL coming from business code is translated to MySQL at the
 * statement boundary (see sql-dialect.ts).
 */
import type { DataStore, PreparedStatement } from './types';
import { translateSqliteToMysql } from './sql-dialect';

// `mysql2` is only loaded in the Node deployment; keep it out of the Cloudflare
// bundle by importing dynamically.
type Pool = {
  query(sql: string, values?: unknown[]): Promise<[unknown, unknown]>;
  getConnection(): Promise<PoolConnection>;
};
type PoolConnection = {
  query(sql: string, values?: unknown[]): Promise<[unknown, unknown]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
};

let poolPromise: Promise<Pool> | null = null;

export interface MysqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
}

function buildConfigFromEnv(): MysqlConfig {
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (url) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      connectionLimit: Number(process.env.MYSQL_POOL_SIZE || 10),
    };
  }
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'cow_skill_hub',
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE || 10),
  };
}

async function getPool(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const mysql = await import('mysql2/promise');
      const cfg = buildConfigFromEnv();
      return mysql.createPool({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        connectionLimit: cfg.connectionLimit,
        waitForConnections: true,
        // Return DATE/DATETIME as strings to match SQLite text semantics.
        dateStrings: true,
        namedPlaceholders: false,
      }) as unknown as Pool;
    })();
  }
  return poolPromise;
}

class MysqlPreparedStatement implements PreparedStatement {
  private values: unknown[] = [];

  constructor(private sql: string) {}

  bind(...values: unknown[]): PreparedStatement {
    const next = new MysqlPreparedStatement(this.sql);
    next.values = values;
    return next;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const pool = await getPool();
    const [rows] = await pool.query(this.sql, this.values);
    return { results: (rows as T[]) ?? [] };
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const pool = await getPool();
    const [rows] = await pool.query(this.sql, this.values);
    const list = rows as T[];
    return list && list.length > 0 ? list[0] : null;
  }

  async run(): Promise<{ success: boolean }> {
    const pool = await getPool();
    await pool.query(this.sql, this.values);
    return { success: true };
  }

  /** Internal accessors for batch(). */
  _sql(): string {
    return this.sql;
  }
  _values(): unknown[] {
    return this.values;
  }
}

export class MySQLDataStore implements DataStore {
  prepare(query: string): PreparedStatement {
    return new MysqlPreparedStatement(translateSqliteToMysql(query));
  }

  async batch(statements: PreparedStatement[]): Promise<unknown> {
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const results: unknown[] = [];
      for (const s of statements) {
        const stmt = s as MysqlPreparedStatement;
        const [res] = await conn.query(stmt._sql(), stmt._values());
        results.push(res);
      }
      await conn.commit();
      return results;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
