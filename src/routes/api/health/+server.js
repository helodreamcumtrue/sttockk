import { json } from '@sveltejs/kit';
import { query } from '#lib/server/db/index.js';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'HEALTHY';
  let companyCount = 0;

  try {
    const res = await query('SELECT count(*) as count FROM companies');
    companyCount = res[0]?.count ?? res[0]?.COUNT ?? 0;
  } catch (err) {
    dbStatus = `UNHEALTHY: ${err.message}`;
  }

  const providers = await query('SELECT * FROM provider_health').catch(() => []);

  return json({
    status: dbStatus === 'HEALTHY' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      registered_companies: Number(companyCount),
      driver: process.env.DATABASE_URL ? 'PostgreSQL (Neon)' : 'SQLite (LibSQL)'
    },
    providers,
    version: '1.0.0-marketpulse-intelligence',
    latency_ms: Date.now() - startTime
  });
}
