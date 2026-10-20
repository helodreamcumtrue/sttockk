import { json } from '@sveltejs/kit';
import { query } from '#lib/server/db/index.js';

export async function GET() {
  const sectors = await query(`
    SELECT s.*, COUNT(c.id) as company_count
    FROM sectors s
    LEFT JOIN companies c ON s.id = c.sector_id
    GROUP BY s.id
    ORDER BY s.name ASC
  `);

  return json({
    sectors: sectors.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description,
      macro_drivers: s.macro_drivers ? JSON.parse(s.macro_drivers) : [],
      benchmark_index: s.benchmark_index,
      company_count: Number(s.company_count)
    }))
  });
}
