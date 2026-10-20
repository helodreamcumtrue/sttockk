import { json } from '@sveltejs/kit';
import { marketService } from '#lib/server/providers/market-service.js';
import { query } from '#lib/server/db/index.js';

export async function GET({ url }) {
  const isDemo = url.searchParams.get('mode') === 'demo' || process.env.FORCE_DEMO_MODE === 'true';

  const [marketStatus, macroIndices, quotes, topNews, sectors] = await Promise.all([
    marketService.getMarketStatus(),
    marketService.getOverviewIndices(isDemo),
    query('SELECT * FROM market_quotes ORDER BY change_percent DESC'),
    query(`
      SELECT n.*, s.name as source_name, s.reliability_tier
      FROM news_articles n
      LEFT JOIN data_sources s ON n.source_id = s.id
      ORDER BY n.published_at DESC
      LIMIT 6
    `),
    query('SELECT * FROM sectors')
  ]);

  // Calculate market breadth from active quotes
  let advances = 0;
  let declines = 0;
  let unchanged = 0;

  for (const q of quotes) {
    if (q.change > 0) advances++;
    else if (q.change < 0) declines++;
    else unchanged++;
  }

  const topGainers = quotes.slice(0, 4).map(q => ({
    symbol: q.symbol,
    last_price: Number(q.last_price),
    change: Number(q.change),
    change_percent: Number(q.change_percent),
    data_status: q.data_status
  }));

  const topLosers = quotes.slice(-4).reverse().map(q => ({
    symbol: q.symbol,
    last_price: Number(q.last_price),
    change: Number(q.change),
    change_percent: Number(q.change_percent),
    data_status: q.data_status
  }));

  return json({
    market_status: marketStatus,
    macro_indices: macroIndices,
    market_breadth: {
      advances,
      declines,
      unchanged,
      total_monitored: quotes.length
    },
    top_gainers: topGainers,
    top_losers: topLosers,
    high_significance_news: topNews.map(n => ({
      id: n.id,
      title: n.title,
      summary: n.summary,
      published_at: n.published_at,
      category: n.event_category,
      verification_status: n.verification_status,
      verification_score: n.verification_score,
      source_name: n.source_name,
      reliability_tier: n.reliability_tier,
      is_demo: Boolean(n.is_demo)
    })),
    sectors: sectors.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      benchmark_index: s.benchmark_index
    })),
    disclaimer: 'Informational analysis only. Market quotes may be delayed by 15 minutes as per exchange dissemination policy. Not investment advice.'
  });
}
