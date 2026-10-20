import { marketService } from '#lib/server/providers/market-service.js';
import { query } from '#lib/server/db/index.js';

export async function load({ url }) {
  const isDemo = url.searchParams.get('mode') === 'demo';

  const [marketStatus, macroIndices, quotesWithCompanies, topNews, sectors] = await Promise.all([
    marketService.getMarketStatus(),
    marketService.getOverviewIndices(isDemo),
    query(`
      SELECT q.*, c.name as company_name, c.sub_industry, c.market_cap_category,
             c.export_exposure_pct, c.import_exposure_pct, c.currency_sensitivity,
             s.name as sector_name, s.code as sector_code
      FROM market_quotes q
      LEFT JOIN companies c ON q.symbol = c.symbol
      LEFT JOIN sectors s ON c.sector_id = s.id
      ORDER BY q.change_percent DESC
    `),
    query(`
      SELECT n.*, s.name as source_name, s.reliability_tier
      FROM news_articles n
      LEFT JOIN data_sources s ON n.source_id = s.id
      ORDER BY n.published_at DESC
      LIMIT 10
    `),
    query('SELECT * FROM sectors')
  ]);

  let advances = 0;
  let declines = 0;
  let unchanged = 0;

  for (const q of quotesWithCompanies) {
    if (Number(q.change) > 0) advances++;
    else if (Number(q.change) < 0) declines++;
    else unchanged++;
  }

  const allStocks = quotesWithCompanies.map(q => ({
    symbol: q.symbol,
    company_name: q.company_name || q.symbol,
    sector_name: q.sector_name || 'Broad Market',
    sector_code: q.sector_code || '',
    sub_industry: q.sub_industry || '',
    market_cap_category: q.market_cap_category || 'LARGE_CAP',
    export_exposure_pct: q.export_exposure_pct || 0,
    import_exposure_pct: q.import_exposure_pct || 0,
    currency_sensitivity: q.currency_sensitivity || 'NEUTRAL',
    last_price: Number(q.last_price || 0),
    change: Number(q.change || 0),
    change_percent: Number(q.change_percent || 0),
    high: Number(q.high || q.last_price || 0),
    low: Number(q.low || q.last_price || 0),
    open: Number(q.open || q.last_price || 0),
    volume: Number(q.volume || 0),
    data_status: q.data_status || 'DELAYED_15M'
  }));

  const topGainers = allStocks.filter(s => s.change > 0).slice(0, 6);
  const topLosers = [...allStocks].reverse().filter(s => s.change < 0).slice(0, 6);

  // Fetch assessments for all top news articles so the master-detail switches instantaneously
  const articleIds = topNews.map(n => n.id);
  let allAssessments = [];
  if (articleIds.length > 0) {
    const placeholders = articleIds.map(() => '?').join(',');
    allAssessments = await query(`
      SELECT a.*, c.symbol, c.name as company_name, c.exchange, c.sub_industry,
             s.name as sector_name, s.code as sector_code,
             q.last_price, q.change, q.change_percent, q.data_status
      FROM impact_assessments a
      JOIN companies c ON a.company_id = c.id
      LEFT JOIN sectors s ON c.sector_id = s.id
      LEFT JOIN market_quotes q ON c.symbol = q.symbol
      WHERE a.article_id IN (${placeholders})
      ORDER BY a.impact_score DESC
    `, articleIds);
  }

  const assessmentsByArticle = {};
  for (const a of allAssessments) {
    if (!assessmentsByArticle[a.article_id]) assessmentsByArticle[a.article_id] = [];
    assessmentsByArticle[a.article_id].push({
      id: a.id,
      company_id: a.company_id,
      symbol: a.symbol,
      company_name: a.company_name,
      sector_name: a.sector_name,
      exposure_type: a.exposure_type,
      potential_direction: a.potential_direction,
      impact_horizon: a.impact_horizon,
      impact_score: a.impact_score,
      explanation: a.explanation,
      causal_chain: a.causal_chain ? JSON.parse(a.causal_chain) : [],
      last_price: a.last_price ? Number(a.last_price) : null,
      change_percent: a.change_percent ? Number(a.change_percent) : null,
      data_status: a.data_status || 'DELAYED_15M'
    });
  }

  return {
    overview: {
      market_status: marketStatus,
      macro_indices: macroIndices,
      all_stocks: allStocks,
      market_breadth: {
        advances,
        declines,
        unchanged,
        total_monitored: allStocks.length
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
        is_demo: Boolean(n.is_demo),
        assessments: assessmentsByArticle[n.id] || []
      })),
      sectors: sectors.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        benchmark_index: s.benchmark_index
      }))
    }
  };
}
