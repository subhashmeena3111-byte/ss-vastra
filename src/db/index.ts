import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';
import fs from 'fs';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to resolve database connection string (Neon, Supabase, Vercel Postgres)
export function getConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL
  );
}

// Function to locate socket path if available
export function getResolvedSqlHost(): string | undefined {
  const envHost = process.env.SQL_HOST;
  if (envHost && fs.existsSync(envHost)) {
    return envHost;
  }
  try {
    if (fs.existsSync('/app/cloudsql')) {
      const entries = fs.readdirSync('/app/cloudsql');
      for (const entry of entries) {
        const fullPath = `/app/cloudsql/${entry}`;
        if (fs.existsSync(`${fullPath}/.s.PGSQL.5432`) || fs.statSync(fullPath).isDirectory()) {
          return fullPath;
        }
      }
    }
  } catch {
    // ignore
  }
  return envHost;
}

let isDbOnline: boolean | null = null;
let lastCheckTime = 0;
const CHECK_COOLDOWN_MS = 30000;

// Function to create or retrieve the connection pool
export const createPool = (): Pool => {
  if (!global._postgresPool) {
    const connStr = getConnectionString();

    let poolConfig: PoolConfig;

    if (connStr) {
      // Connect using Neon / Supabase / Vercel Postgres connection URI
      const isRemote =
        !connStr.includes('localhost') &&
        !connStr.includes('127.0.0.1') &&
        !connStr.includes('::1');

      poolConfig = {
        connectionString: connStr,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };
    } else {
      // Connect using individual parameters or socket
      const host = getResolvedSqlHost();
      poolConfig = {
        host: host || process.env.SQL_HOST || 'localhost',
        port: Number(process.env.SQL_PORT || 5432),
        user: process.env.SQL_USER || process.env.PGUSER || 'postgres',
        password: process.env.SQL_PASSWORD || process.env.PGPASSWORD || '',
        database: process.env.SQL_DB_NAME || process.env.PGDATABASE || 'postgres',
        max: 10,
        connectionTimeoutMillis: 3000,
      };
    }

    global._postgresPool = new Pool(poolConfig);

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL Pool connection notice:', err?.message || err);
      isDbOnline = false;
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance lazily
export const pool = createPool();

// Initialize Drizzle with the pool and full schema
export const db = drizzle(pool, { schema });

export async function isDbReady(): Promise<boolean> {
  const now = Date.now();
  if (isDbOnline === true) {
    return true;
  }
  if (isDbOnline === false && now - lastCheckTime < CHECK_COOLDOWN_MS) {
    return false;
  }

  lastCheckTime = now;
  try {
    const connStr = getConnectionString();
    const host = getResolvedSqlHost();
    const hasConfig =
      Boolean(connStr) ||
      Boolean(host && fs.existsSync(host)) ||
      Boolean(process.env.SQL_USER) ||
      Boolean(process.env.PGUSER);

    if (!hasConfig) {
      isDbOnline = false;
      return false;
    }

    const testPool = createPool();
    const testPromise = testPool.query('SELECT 1');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 3000)
    );
    await Promise.race([testPromise, timeoutPromise]);
    isDbOnline = true;
    return true;
  } catch {
    isDbOnline = false;
    return false;
  }
}

export function markDbOffline() {
  isDbOnline = false;
  lastCheckTime = Date.now();
}
