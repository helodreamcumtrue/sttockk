import { json } from '@sveltejs/kit';
import { queryOne, query } from '#lib/server/db/index.js';
import { marketService } from '#lib/server/providers/market-service.js';

export async function GET({ params, url }) {
  const symbol = params.symbol.toUpperCase();
  const isDemo = url.searchParams.get('mode') === 'demo' || process.env.FORCE_DEMO_MODE === 'true';

  const company = await queryOne(`
    SELECT c.*, s.name as sector_name, s.code as sector_code, s.benchmark_index
    FROM companies c
    LEFT JOIN sectors s ON c.sector_id = s.id
    WHERE c.symbol = ?
  `, [symbol]);

  if (!company) {
    return json({ error: `Company ${symbol} not found in knowledge graph` }, { status: 404 });
  }

  // Fetch latest quote
  const quote = await marketService.getQuote(symbol, isDemo).catch(() => null);

  // Fetch relationships (both outgoing and incoming)
  const relationships = await query(`
    SELECT r.*,
           sc.symbol as source_symbol, sc.name as source_name,
           tc.symbol as target_symbol, tc.name as target_name
    FROM company_relationships r
    JOIN companies sc ON r.source_company_id = sc.id
    JOIN companies tc ON r.target_company_id = tc.id
    WHERE r.source_company_id = ? OR r.target_company_id = ?
  `, [company.id, company.id]);

  // Fetch active impact assessments for this company
  const assessments = await query(`
    SELECT a.*, n.title as article_title, n.published_at, n.verification_status, n.verification_score, n.event_category
    FROM impact_assessments a
    JOIN news_articles n ON a.article_id = n.id
    WHERE a.company_id = ?
    ORDER BY n.published_at DESC
  `, [company.id]);

  // Fetch historical event reactions for this company
  const historicalEvents = await query(`
    SELECT * FROM historical_event_studies
    WHERE company_id = ? OR company_symbol = ?
    ORDER BY event_date DESC
  `, [company.id, symbol]);

  // Fetch sector peers for Screener.in Peer Comparison
  const peers = await query(`
    SELECT c.id, c.symbol, c.name, c.market_cap_category, c.sub_industry,
           c.export_exposure_pct, c.currency_sensitivity,
           q.last_price, q.change, q.change_percent, q.volume
    FROM companies c
    LEFT JOIN market_quotes q ON c.symbol = q.symbol
    WHERE c.sector_id = ?
    ORDER BY q.last_price DESC
  `, [company.sector_id]);

  return json({
    company: {
      id: company.id,
      symbol: company.symbol,
      isin: company.isin,
      exchange: company.exchange,
      name: company.name,
      sector_id: company.sector_id,
      sector_name: company.sector_name,
      sector_code: company.sector_code,
      benchmark_index: company.benchmark_index,
      sub_industry: company.sub_industry,
      market_cap_category: company.market_cap_category,
      description: company.description,
      products_services: company.products_services ? JSON.parse(company.products_services) : [],
      raw_materials: company.raw_materials ? JSON.parse(company.raw_materials) : [],
      input_costs: company.input_costs ? JSON.parse(company.input_costs) : [],
      export_exposure_pct: company.export_exposure_pct,
      import_exposure_pct: company.import_exposure_pct,
      currency_sensitivity: company.currency_sensitivity,
      interest_rate_sensitivity: company.interest_rate_sensitivity,
      commodity_sensitivities: company.commodity_sensitivities ? JSON.parse(company.commodity_sensitivities) : {},
      regulatory_bodies: company.regulatory_bodies ? JSON.parse(company.regulatory_bodies) : []
    },
    quote,
    peers: peers.map(p => ({
      id: p.id,
      symbol: p.symbol,
      name: p.name,
      market_cap_category: p.market_cap_category,
      sub_industry: p.sub_industry,
      export_exposure_pct: p.export_exposure_pct || 0,
      currency_sensitivity: p.currency_sensitivity || 'NEUTRAL',
      last_price: Number(p.last_price || 0),
      change: Number(p.change || 0),
      change_percent: Number(p.change_percent || 0),
      volume: Number(p.volume || 0)
    })),
    relationships: relationships.map(r => ({
      id: r.id,
      type: r.relationship_type,
      confidence_score: r.confidence_score,
      evidence_source: r.evidence_source,
      description: r.description,
      is_incoming: r.target_company_id === company.id,
      counterparty_symbol: r.source_company_id === company.id ? r.target_symbol : r.source_symbol,
      counterparty_name: r.source_company_id === company.id ? r.target_name : r.source_name
    })),
    active_assessments: assessments.map(a => ({
      id: a.id,
      article_id: a.article_id,
      article_title: a.article_title,
      published_at: a.published_at,
      event_category: a.event_category,
      verification_status: a.verification_status,
      verification_score: a.verification_score,
      exposure_type: a.exposure_type,
      potential_direction: a.potential_direction,
      impact_horizon: a.impact_horizon,
      impact_score: a.impact_score,
      causal_chain: a.causal_chain ? JSON.parse(a.causal_chain) : [],
      explanation: a.explanation,
      key_facts: a.key_facts ? JSON.parse(a.key_facts) : [],
      counterarguments: a.counterarguments ? JSON.parse(a.counterarguments) : [],
      invalidation_conditions: a.invalidation_conditions ? JSON.parse(a.invalidation_conditions) : []
    })),
    historical_event_reactions: historicalEvents.map(h => ({
      id: h.id,
      event_title: h.event_title,
      event_category: h.event_category,
      event_date: h.event_date,
      car_1d: h.car_1d,
      car_3d: h.car_3d,
      car_5d: h.car_5d,
      actual_direction: h.actual_direction,
      predicted_direction: h.predicted_direction,
      directional_match: Boolean(h.directional_match),
      sample_size: h.sample_size
    }))
  });
}
