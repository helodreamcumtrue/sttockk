import { json } from '@sveltejs/kit';
import { queryOne, query } from '#lib/server/db/index.js';

export async function GET({ params }) {
  const sectorIdOrCode = params.id;

  const sector = await queryOne(`
    SELECT * FROM sectors WHERE id = ? OR code = ?
  `, [sectorIdOrCode, sectorIdOrCode.toUpperCase()]);

  if (!sector) {
    return json({ error: 'Sector not found' }, { status: 404 });
  }

  // Fetch constituent companies with quotes
  const companies = await query(`
    SELECT c.*, q.last_price, q.change, q.change_percent, q.volume, q.data_status
    FROM companies c
    LEFT JOIN market_quotes q ON c.symbol = q.symbol
    WHERE c.sector_id = ?
    ORDER BY c.symbol ASC
  `, [sector.id]);

  // Fetch recent sector news
  const news = await query(`
    SELECT DISTINCT n.*, s.name as source_name
    FROM news_articles n
    JOIN impact_assessments a ON n.id = a.article_id
    JOIN companies c ON a.company_id = c.id
    LEFT JOIN data_sources s ON n.source_id = s.id
    WHERE c.sector_id = ?
    ORDER BY n.published_at DESC
    LIMIT 10
  `, [sector.id]);

  return json({
    sector: {
      id: sector.id,
      code: sector.code,
      name: sector.name,
      description: sector.description,
      macro_drivers: sector.macro_drivers ? JSON.parse(sector.macro_drivers) : [],
      benchmark_index: sector.benchmark_index
    },
    companies: companies.map(c => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      sub_industry: c.sub_industry,
      market_cap_category: c.market_cap_category,
      last_price: c.last_price ? Number(c.last_price) : null,
      change: c.change ? Number(c.change) : null,
      change_percent: c.change_percent ? Number(c.change_percent) : null,
      data_status: c.data_status || 'LAST_AVAILABLE',
      volume: c.volume ? Number(c.volume) : 0,
      commodity_sensitivities: c.commodity_sensitivities ? JSON.parse(c.commodity_sensitivities) : {}
    })),
    recent_news: news.map(n => ({
      id: n.id,
      title: n.title,
      summary: n.summary,
      published_at: n.published_at,
      event_category: n.event_category,
      verification_status: n.verification_status,
      verification_score: n.verification_score,
      source_name: n.source_name
    }))
  });
}
