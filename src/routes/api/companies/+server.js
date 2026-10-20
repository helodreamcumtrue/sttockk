import { json } from '@sveltejs/kit';
import { query } from '#lib/server/db/index.js';

export async function GET({ url }) {
  const search = url.searchParams.get('q') || '';
  const sector = url.searchParams.get('sector') || '';

  let sql = `
    SELECT c.*, s.name as sector_name, s.code as sector_code,
           q.last_price, q.change, q.change_percent, q.data_status, q.volume
    FROM companies c
    LEFT JOIN sectors s ON c.sector_id = s.id
    LEFT JOIN market_quotes q ON c.symbol = q.symbol
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (c.symbol LIKE ? OR c.name LIKE ? OR c.sub_industry LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (sector) {
    sql += ` AND (s.code = ? OR s.id = ?)`;
    params.push(sector, sector);
  }

  sql += ` ORDER BY c.symbol ASC`;

  const companies = await query(sql, params);

  return json({
    companies: companies.map(c => ({
      id: c.id,
      symbol: c.symbol,
      isin: c.isin,
      exchange: c.exchange,
      name: c.name,
      sector_id: c.sector_id,
      sector_name: c.sector_name,
      sector_code: c.sector_code,
      sub_industry: c.sub_industry,
      market_cap_category: c.market_cap_category,
      description: c.description,
      products_services: c.products_services ? JSON.parse(c.products_services) : [],
      commodity_sensitivities: c.commodity_sensitivities ? JSON.parse(c.commodity_sensitivities) : {},
      last_price: c.last_price ? Number(c.last_price) : null,
      change: c.change ? Number(c.change) : null,
      change_percent: c.change_percent ? Number(c.change_percent) : null,
      data_status: c.data_status || 'LAST_AVAILABLE',
      volume: c.volume ? Number(c.volume) : 0
    })),
    count: companies.length
  });
}
