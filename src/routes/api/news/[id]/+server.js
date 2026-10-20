import { json } from '@sveltejs/kit';
import { queryOne, query } from '#lib/server/db/index.js';

export async function GET({ params }) {
  const articleId = params.id;

  const article = await queryOne(`
    SELECT n.*, s.name as source_name, s.domain as source_domain, s.reliability_tier, s.attribution_req
    FROM news_articles n
    LEFT JOIN data_sources s ON n.source_id = s.id
    WHERE n.id = ?
  `, [articleId]);

  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  // Fetch all company impact assessments for this article
  const assessments = await query(`
    SELECT a.*, c.symbol, c.name as company_name, c.exchange, c.sub_industry,
           s.name as sector_name, s.code as sector_code,
           q.last_price, q.change, q.change_percent, q.data_status
    FROM impact_assessments a
    JOIN companies c ON a.company_id = c.id
    LEFT JOIN sectors s ON c.sector_id = s.id
    LEFT JOIN market_quotes q ON c.symbol = q.symbol
    WHERE a.article_id = ?
    ORDER BY a.impact_score DESC
  `, [articleId]);

  // Construct Causal Impact Graph Data (Nodes and Edges for interactive visualization)
  const nodes = [
    { id: 'event_node', type: 'EVENT', label: article.event_category.replace(/_/g, ' '), detail: article.title }
  ];
  const edges = [];

  const addedSectors = new Set();
  for (const a of assessments) {
    // Add sector node if not present
    if (a.sector_code && !addedSectors.has(a.sector_code)) {
      addedSectors.add(a.sector_code);
      nodes.push({
        id: `sector_${a.sector_code}`,
        type: 'SECTOR',
        label: a.sector_name,
        code: a.sector_code
      });
      edges.push({
        source: 'event_node',
        target: `sector_${a.sector_code}`,
        relation: 'SECTOR_IMPACT',
        label: 'Economic Shock'
      });
    }

    // Add company node
    nodes.push({
      id: `comp_${a.symbol}`,
      type: 'COMPANY',
      symbol: a.symbol,
      label: a.symbol,
      name: a.company_name,
      direction: a.potential_direction,
      impact_score: a.impact_score,
      exposure_type: a.exposure_type,
      price: a.last_price ? Number(a.last_price) : null,
      change_pct: a.change_percent ? Number(a.change_percent) : null
    });

    edges.push({
      source: a.sector_code ? `sector_${a.sector_code}` : 'event_node',
      target: `comp_${a.symbol}`,
      relation: a.exposure_type,
      direction: a.potential_direction,
      label: `${a.potential_direction} (${a.impact_score}/100)`
    });
  }

  // Fetch historical analogues for this event category
  const analogues = await query(`
    SELECT * FROM historical_event_studies
    WHERE event_category = ?
    ORDER BY event_date DESC
    LIMIT 5
  `, [article.event_category]);

  return json({
    article: {
      id: article.id,
      title: article.title,
      url: article.url,
      canonical_url: article.canonical_url,
      author: article.author,
      summary: article.summary,
      content_snippet: article.content_snippet,
      published_at: article.published_at,
      retrieved_at: article.retrieved_at,
      event_category: article.event_category,
      verification_status: article.verification_status,
      verification_score: article.verification_score,
      verification_factors: article.verification_factors ? JSON.parse(article.verification_factors) : {},
      is_demo: Boolean(article.is_demo),
      source: {
        id: article.source_id,
        name: article.source_name,
        domain: article.source_domain,
        reliability_tier: article.reliability_tier,
        attribution_req: article.attribution_req
      }
    },
    assessments: assessments.map(a => ({
      id: a.id,
      company_id: a.company_id,
      symbol: a.symbol,
      company_name: a.company_name,
      exchange: a.exchange,
      sector_name: a.sector_name,
      sub_industry: a.sub_industry,
      exposure_type: a.exposure_type,
      potential_direction: a.potential_direction,
      impact_horizon: a.impact_horizon,
      impact_score: a.impact_score,
      evidence_quality_score: a.evidence_quality_score,
      causal_chain: a.causal_chain ? JSON.parse(a.causal_chain) : [],
      explanation: a.explanation,
      key_facts: a.key_facts ? JSON.parse(a.key_facts) : [],
      counterarguments: a.counterarguments ? JSON.parse(a.counterarguments) : [],
      invalidation_conditions: a.invalidation_conditions ? JSON.parse(a.invalidation_conditions) : [],
      market_data: {
        last_price: a.last_price ? Number(a.last_price) : null,
        change: a.change ? Number(a.change) : null,
        change_percent: a.change_percent ? Number(a.change_percent) : null,
        data_status: a.data_status || 'LAST_AVAILABLE'
      }
    })),
    causal_graph: {
      nodes,
      edges
    },
    historical_analogues: analogues.map(h => ({
      id: h.id,
      event_title: h.event_title,
      symbol: h.company_symbol,
      event_date: h.event_date,
      car_1d: h.car_1d,
      car_3d: h.car_3d,
      car_5d: h.car_5d,
      car_20d: h.car_20d,
      actual_direction: h.actual_direction,
      sample_size: h.sample_size
    }))
  });
}
