import { json } from '@sveltejs/kit';
import { query } from '#lib/server/db/index.js';

export async function GET() {
  const [sources, health] = await Promise.all([
    query('SELECT * FROM data_sources ORDER BY reliability_tier ASC, name ASC'),
    query('SELECT * FROM provider_health ORDER BY provider_name ASC')
  ]);

  return json({
    timestamp: new Date().toISOString(),
    data_sources: sources.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      domain: s.domain,
      category: s.category,
      reliability_tier: s.reliability_tier,
      attribution_req: s.attribution_req,
      status: s.status,
      last_fetched_at: s.last_fetched_at,
      error_count: s.error_count
    })),
    provider_health: health.map(h => ({
      provider_name: h.provider_name,
      status: h.status,
      last_check: h.last_check,
      latency_ms: h.latency_ms,
      quota_remaining: h.quota_remaining,
      notes: h.notes
    }))
  });
}
