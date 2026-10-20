import { createClient } from '@libsql/client';
import pg from 'pg';
import { SCHEMA_SQL } from './schema.js';
import { seedInitialData } from './seed.js';

let dbClient = null;
let isPostgres = false;
let isInitialized = false;

function getDbUrl() {
  return process.env.DATABASE_URL || 'file:marketpulse.db';
}

export function getDb() {
  if (dbClient) return dbClient;

  const url = getDbUrl();
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    isPostgres = true;
    const pool = new pg.Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    });
    dbClient = {
      async query(sql, params = []) {
        // Convert ? placeholders to $1, $2 for Postgres if needed
        let pIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${pIndex++}`);
        const res = await pool.query(pgSql, params);
        return res.rows;
      },
      async execute(sql, params = []) {
        let pIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${pIndex++}`);
        return await pool.query(pgSql, params);
      },
      async close() {
        await pool.end();
      }
    };
  } else {
    isPostgres = false;
    const client = createClient({ url });
    dbClient = {
      async query(sql, params = []) {
        const res = await client.execute({ sql, args: params });
        return res.rows;
      },
      async execute(sql, params = []) {
        return await client.execute({ sql, args: params });
      },
      async close() {
        client.close();
      }
    };
  }

  return dbClient;
}

export async function initDb() {
  if (isInitialized) return;
  const db = getDb();

  // Split schema statements and execute
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (err) {
      console.error('Error executing schema statement:', err.message, '\nStatement:', statement.slice(0, 60));
    }
  }

  // Check if initial companies seed exists
  try {
    const existing = await db.query('SELECT COUNT(*) as count FROM companies');
    const count = existing[0]?.count ?? existing[0]?.COUNT ?? 0;
    if (Number(count) === 0) {
      console.log('Seeding initial Indian Equities Knowledge Graph & Demo Scenarios...');
      await seedInitialData(db);
      console.log('Initial database seeding complete.');
    }
  } catch (err) {
    console.error('Error during database seed check:', err);
  }

  isInitialized = true;
}

// Helper methods for queries
export async function query(sql, params = []) {
  await initDb();
  const db = getDb();
  return await db.query(sql, params);
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql, params = []) {
  await initDb();
  const db = getDb();
  return await db.execute(sql, params);
}
