import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import fs from 'fs';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
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
const CHECK_COOLDOWN_MS = 60000;

// Function to create or retrieve the connection pool (Object Method)
export const createPool = () => {
  if (!global._postgresPool) {
    const host = getResolvedSqlHost();
    global._postgresPool = new Pool({
      host,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 1500,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', () => {
      isDbOnline = false;
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance lazily
const pool = createPool();

// Initialize Drizzle with the pool and schema
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
    const host = getResolvedSqlHost();
    if (!host || !fs.existsSync(host)) {
      isDbOnline = false;
      return false;
    }

    const testPool = createPool();
    const testPromise = testPool.query('SELECT 1');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 1000)
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

